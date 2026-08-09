/**
 * 임라이언 번역방 방명록 API
 *
 *   GET    /entries        최근 글 목록
 *   POST   /entries        글 남기기 (로그인 없음)
 *   DELETE /entries/:id    글 지우기 (관리자 암호 필요)
 *   POST   /admin/check    관리자 암호 확인
 *
 * 지우는 것만 ADMIN_TOKEN 을 요구한다. 이 값은 소스에 없고 Worker secret 으로만 들어간다.
 */

const NAME_MAX = 20;
const MESSAGE_MAX = 500;
const BODY_MAX_BYTES = 8 * 1024;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // 브라우저에서 부르는 API이므로 허용하지 않은 출처는 여기서 끊는다.
    // Origin 이 아예 없는 요청(curl 등)은 읽기만 허용한다.
    if (origin && !cors['Access-Control-Allow-Origin']) {
      return json({ error: 'forbidden_origin' }, 403, {});
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path === '/entries' && request.method === 'GET')  return await listEntries(env, cors);
      if (path === '/entries' && request.method === 'POST') return await createEntry(request, env, cors);

      const del = path.match(/^\/entries\/([A-Za-z0-9_-]{1,64})$/);
      if (del && request.method === 'DELETE') return await deleteEntry(del[1], request, env, cors);

      if (path === '/admin/check' && request.method === 'POST') {
        const check = await checkAdmin(request, env);
        if (!check.ok) return adminError(check, cors);
        return json({ ok: true }, 200, cors);
      }

      return json({ error: 'not_found' }, 404, cors);
    } catch (err) {
      console.error(err);
      return json({ error: 'server_error' }, 500, cors);
    }
  },
};

/* ---------------- 목록 ---------------- */

async function listEntries(env, cors) {
  const size = clampInt(env.PAGE_SIZE, 100, 1, 500);
  const { results } = await env.DB
    .prepare('SELECT id, name, message, created_at FROM entries ORDER BY created_at DESC LIMIT ?1')
    .bind(size)
    .all();

  const entries = (results || []).map((r) => ({
    id: r.id,
    name: r.name,
    message: r.message,
    createdAt: r.created_at,
  }));

  return json({ entries }, 200, cors);
}

/* ---------------- 글 남기기 ---------------- */

async function createEntry(request, env, cors) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > BODY_MAX_BYTES) return json({ error: 'too_large' }, 413, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400, cors);
  }

  const name = clean(body && body.name);
  const message = clean(body && body.message);

  if (!name || name.length > NAME_MAX)       return json({ error: 'bad_name' }, 400, cors);
  if (!message || message.length > MESSAGE_MAX) return json({ error: 'bad_message' }, 400, cors);

  // 도배 방지. 같은 회선인지만 보고, 원래 IP는 복원할 수 없는 해시로만 잠깐 남긴다.
  const gap = clampInt(env.THROTTLE_SECONDS, 30, 0, 3600) * 1000;
  const now = Date.now();
  let who = null;

  if (gap > 0) {
    who = await hashIp(request, env);
    if (who) {
      const row = await env.DB
        .prepare('SELECT last FROM throttle WHERE who = ?1')
        .bind(who)
        .first();
      if (row && now - row.last < gap) {
        const wait = Math.ceil((gap - (now - row.last)) / 1000);
        return json({ error: 'too_soon', wait }, 429, cors);
      }
    }
  }

  const id = crypto.randomUUID();
  const statements = [
    env.DB.prepare(
      'INSERT INTO entries (id, name, message, created_at) VALUES (?1, ?2, ?3, ?4)'
    ).bind(id, name, message, now),
  ];
  if (who) {
    statements.push(
      env.DB.prepare(
        'INSERT INTO throttle (who, last) VALUES (?1, ?2) ' +
        'ON CONFLICT(who) DO UPDATE SET last = excluded.last'
      ).bind(who, now)
    );
    // 오래된 흔적은 남겨 둘 이유가 없으니 함께 지운다.
    statements.push(
      env.DB.prepare('DELETE FROM throttle WHERE last < ?1').bind(now - 24 * 3600 * 1000)
    );
  }
  await env.DB.batch(statements);

  return json({ entry: { id, name, message, createdAt: now } }, 201, cors);
}

/* ---------------- 지우기 ---------------- */

async function deleteEntry(id, request, env, cors) {
  const check = await checkAdmin(request, env);
  if (!check.ok) return adminError(check, cors);

  const res = await env.DB.prepare('DELETE FROM entries WHERE id = ?1').bind(id).run();
  const removed = res.meta && typeof res.meta.changes === 'number' ? res.meta.changes : 0;
  if (!removed) return json({ error: 'not_found' }, 404, cors);

  return json({ ok: true }, 200, cors);
}

/* ---------------- 관리자 확인 ---------------- */

// 짧은 암호를 쓰더라도 마구 찔러 볼 수 없도록, 틀린 시도를 회선별로 센다.
const AUTH_MAX_FAILS = 5;          // 이 횟수를 넘기면
const AUTH_BLOCK_MS = 10 * 60_000; // 이만큼 막는다 (실패 기록의 유효 기간이기도 하다)

/**
 * @returns {{ok: boolean, blocked?: boolean, wait?: number}}
 */
async function checkAdmin(request, env) {
  const secret = env.ADMIN_TOKEN;
  if (!secret) return { ok: false };

  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false };

  const who = await hashIp(request, env);
  const now = Date.now();

  // 이미 막혀 있으면 암호를 비교해 보지도 않는다.
  let row = null;
  if (who) {
    row = await env.DB
      .prepare('SELECT fails, seen FROM auth_fail WHERE who = ?1')
      .bind('auth:' + who)
      .first();
    if (row && now - row.seen < AUTH_BLOCK_MS && row.fails >= AUTH_MAX_FAILS) {
      return { ok: false, blocked: true, wait: Math.ceil((AUTH_BLOCK_MS - (now - row.seen)) / 1000) };
    }
  }

  // 길이 차이로 정답을 좁힐 수 없도록 해시를 비교한다.
  const [given, real] = await Promise.all([sha256(match[1]), sha256(secret)]);
  const ok = timingSafeEqual(given, real);

  if (who) {
    if (ok) {
      await env.DB.prepare('DELETE FROM auth_fail WHERE who = ?1').bind('auth:' + who).run();
    } else {
      // 마지막 실패로부터 시간이 충분히 지났으면 처음부터 다시 센다.
      const fresh = row && now - row.seen < AUTH_BLOCK_MS ? row.fails : 0;
      await env.DB
        .prepare(
          'INSERT INTO auth_fail (who, fails, seen) VALUES (?1, ?2, ?3) ' +
          'ON CONFLICT(who) DO UPDATE SET fails = excluded.fails, seen = excluded.seen'
        )
        .bind('auth:' + who, fresh + 1, now)
        .run();
    }
  }

  return { ok };
}

function adminError(check, cors) {
  if (check.blocked) {
    return json({ error: 'too_many_attempts', wait: check.wait }, 429, cors);
  }
  return json({ error: 'unauthorized' }, 401, cors);
}

/* ---------------- 도구 ---------------- */

function corsHeaders(origin, env) {
  const allowed = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...cors },
  });
}

function clean(value) {
  if (typeof value !== 'string') return '';
  // 줄바꿈은 남기고 나머지 제어문자만 걷어낸다.
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
}

function clampInt(raw, fallback, min, max) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function hashIp(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return null;
  return await sha256Hex(`${env.IP_SALT || ''}:${ip}`);
}

async function sha256(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

async function sha256Hex(text) {
  const bytes = await sha256(text);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
