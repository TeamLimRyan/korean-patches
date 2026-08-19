/**
 * 임라이언 번역방 방명록 API
 *
 *   GET    /entries                 최근 글 목록
 *   POST   /entries                 글 남기기 (로그인 없음, 비밀글 가능)
 *   POST   /entries/:id/unlock      비밀글을 글쓴이 암호로 열어 보기
 *   DELETE /entries/:id             글 지우기 (관리자)
 *   POST   /entries/:id/comments    답글 달기 (관리자만)
 *   DELETE /comments/:id            답글 지우기 (관리자)
 *   POST   /admin/check             관리자 암호 확인
 *
 * 비밀글은 서버에서 본문을 아예 빼고 내려보낸다. 화면에서 가리는 방식이 아니라
 * 관리자이거나 글쓴이 암호를 맞힌 요청에만 본문이 실린다.
 */

const NAME_MAX = 20;
const MESSAGE_MAX = 500;
const COMMENT_MAX = 500;
const PW_MIN = 4;
const PW_MAX = 20;
const BODY_MAX_BYTES = 8 * 1024;

// 암호 무차별 대입 차단 (관리자 암호, 비밀글 암호 공통)
const AUTH_MAX_FAILS = 5;
const AUTH_BLOCK_MS = 10 * 60 * 1000;

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
    const id = '([A-Za-z0-9_-]{1,64})';

    try {
      if (path === '/entries' && request.method === 'GET')  return await listEntries(request, env, cors);
      if (path === '/entries' && request.method === 'POST') return await createEntry(request, env, cors);

      let m = path.match(new RegExp('^/entries/' + id + '$'));
      if (m && request.method === 'DELETE') return await deleteEntry(m[1], request, env, cors);

      m = path.match(new RegExp('^/entries/' + id + '/unlock$'));
      if (m && request.method === 'POST') return await unlockEntry(m[1], request, env, cors);

      m = path.match(new RegExp('^/entries/' + id + '/comments$'));
      if (m && request.method === 'POST') return await createComment(m[1], request, env, cors);

      m = path.match(new RegExp('^/comments/' + id + '$'));
      if (m && request.method === 'DELETE') return await deleteComment(m[1], request, env, cors);

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

async function listEntries(request, env, cors) {
  const size = clampInt(env.PAGE_SIZE, 100, 1, 500);
  const admin = (await checkAdmin(request, env)).ok;

  const rows = (await env.DB
    .prepare(
      'SELECT id, name, message, created_at, secret FROM entries ' +
      'ORDER BY created_at DESC LIMIT ?1'
    )
    .bind(size)
    .all()).results || [];

  // 답글은 한 번에 가져와 글별로 묶는다.
  const byEntry = new Map();
  if (rows.length) {
    const marks = rows.map((_, i) => '?' + (i + 1)).join(',');
    const cs = (await env.DB
      .prepare(
        'SELECT id, entry_id, message, created_at FROM comments ' +
        'WHERE entry_id IN (' + marks + ') ORDER BY created_at ASC'
      )
      .bind(...rows.map((r) => r.id))
      .all()).results || [];
    for (const c of cs) {
      if (!byEntry.has(c.entry_id)) byEntry.set(c.entry_id, []);
      byEntry.get(c.entry_id).push({ id: c.id, message: c.message, createdAt: c.created_at });
    }
  }

  const entries = rows.map((r) => {
    const secret = Boolean(r.secret);
    // 비밀글은 관리자가 아니면 본문도 답글도 실어 보내지 않는다.
    if (secret && !admin) {
      return { id: r.id, name: r.name, createdAt: r.created_at, secret: true, locked: true };
    }
    return {
      id: r.id,
      name: r.name,
      message: r.message,
      createdAt: r.created_at,
      secret,
      comments: byEntry.get(r.id) || [],
    };
  });

  return json({ entries, admin }, 200, cors);
}

/* ---------------- 글 남기기 ---------------- */

async function createEntry(request, env, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'bad_json' }, 400, cors);

  const name = clean(body.name);
  const message = clean(body.message);
  const secret = body.secret === true;
  const password = typeof body.password === 'string' ? body.password.trim() : '';

  if (!name || name.length > NAME_MAX) return json({ error: 'bad_name' }, 400, cors);
  if (!message || message.length > MESSAGE_MAX) return json({ error: 'bad_message' }, 400, cors);
  if (secret && (password.length < PW_MIN || password.length > PW_MAX)) {
    return json({ error: 'bad_password' }, 400, cors);
  }

  const gap = clampInt(env.THROTTLE_SECONDS, 30, 0, 3600) * 1000;
  const now = Date.now();
  let who = null;

  if (gap > 0) {
    who = await hashIp(request, env);
    if (who) {
      const row = await env.DB.prepare('SELECT last FROM throttle WHERE who = ?1').bind(who).first();
      if (row && now - row.last < gap) {
        return json({ error: 'too_soon', wait: Math.ceil((gap - (now - row.last)) / 1000) }, 429, cors);
      }
    }
  }

  const id = crypto.randomUUID();
  const pwHash = secret ? await sha256Hex((env.IP_SALT || '') + ':pw:' + password) : null;

  const statements = [
    env.DB.prepare(
      'INSERT INTO entries (id, name, message, created_at, secret, pw_hash) ' +
      'VALUES (?1, ?2, ?3, ?4, ?5, ?6)'
    ).bind(id, name, message, now, secret ? 1 : 0, pwHash),
  ];
  if (who) {
    statements.push(
      env.DB.prepare(
        'INSERT INTO throttle (who, last) VALUES (?1, ?2) ' +
        'ON CONFLICT(who) DO UPDATE SET last = excluded.last'
      ).bind(who, now),
      env.DB.prepare('DELETE FROM throttle WHERE last < ?1').bind(now - 24 * 3600 * 1000)
    );
  }
  await env.DB.batch(statements);

  const entry = secret
    ? { id, name, createdAt: now, secret: true, locked: true }
    : { id, name, message, createdAt: now, secret: false, comments: [] };

  return json({ entry }, 201, cors);
}

/* ---------------- 비밀글 열기 ---------------- */

async function unlockEntry(id, request, env, cors) {
  const body = await readJson(request);
  if (!body) return json({ error: 'bad_json' }, 400, cors);

  const password = typeof body.password === 'string' ? body.password : '';
  if (!password) return json({ error: 'unauthorized' }, 401, cors);

  const who = await hashIp(request, env);
  const gate = await failGate(env, who, 'unlock');
  if (gate.blocked) return json({ error: 'too_many_attempts', wait: gate.wait }, 429, cors);

  const row = await env.DB
    .prepare('SELECT id, name, message, created_at, secret, pw_hash FROM entries WHERE id = ?1')
    .bind(id)
    .first();
  if (!row || !row.secret) return json({ error: 'not_found' }, 404, cors);

  const given = await sha256Hex((env.IP_SALT || '') + ':pw:' + password.trim());
  const ok = row.pw_hash && timingSafeEqualHex(given, row.pw_hash);
  await failRecord(env, who, 'unlock', ok, gate.fails);
  if (!ok) return json({ error: 'unauthorized' }, 401, cors);

  const cs = (await env.DB
    .prepare('SELECT id, message, created_at FROM comments WHERE entry_id = ?1 ORDER BY created_at ASC')
    .bind(id)
    .all()).results || [];

  return json({
    entry: {
      id: row.id,
      name: row.name,
      message: row.message,
      createdAt: row.created_at,
      secret: true,
      comments: cs.map((c) => ({ id: c.id, message: c.message, createdAt: c.created_at })),
    },
  }, 200, cors);
}

/* ---------------- 지우기 ---------------- */

async function deleteEntry(id, request, env, cors) {
  const check = await checkAdmin(request, env);
  if (!check.ok) return adminError(check, cors);

  const res = await env.DB.batch([
    env.DB.prepare('DELETE FROM comments WHERE entry_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM entries WHERE id = ?1').bind(id),
  ]);
  const removed = res[1] && res[1].meta ? res[1].meta.changes : 0;
  if (!removed) return json({ error: 'not_found' }, 404, cors);

  return json({ ok: true }, 200, cors);
}

/* ---------------- 답글 (관리자 전용) ---------------- */

async function createComment(entryId, request, env, cors) {
  const check = await checkAdmin(request, env);
  if (!check.ok) return adminError(check, cors);

  const body = await readJson(request);
  if (!body) return json({ error: 'bad_json' }, 400, cors);

  const message = clean(body.message);
  if (!message || message.length > COMMENT_MAX) return json({ error: 'bad_message' }, 400, cors);

  const parent = await env.DB.prepare('SELECT id FROM entries WHERE id = ?1').bind(entryId).first();
  if (!parent) return json({ error: 'not_found' }, 404, cors);

  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB
    .prepare('INSERT INTO comments (id, entry_id, message, created_at) VALUES (?1, ?2, ?3, ?4)')
    .bind(id, entryId, message, now)
    .run();

  return json({ comment: { id, entryId, message, createdAt: now } }, 201, cors);
}

async function deleteComment(id, request, env, cors) {
  const check = await checkAdmin(request, env);
  if (!check.ok) return adminError(check, cors);

  const res = await env.DB.prepare('DELETE FROM comments WHERE id = ?1').bind(id).run();
  const removed = res.meta && typeof res.meta.changes === 'number' ? res.meta.changes : 0;
  if (!removed) return json({ error: 'not_found' }, 404, cors);

  return json({ ok: true }, 200, cors);
}

/* ---------------- 관리자 확인 ---------------- */

async function checkAdmin(request, env) {
  const secret = env.ADMIN_TOKEN;
  if (!secret) return { ok: false };

  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false };

  const who = await hashIp(request, env);
  const gate = await failGate(env, who, 'auth');
  if (gate.blocked) return { ok: false, blocked: true, wait: gate.wait };

  // 길이 차이로 정답을 좁힐 수 없도록 해시를 비교한다.
  const [given, real] = await Promise.all([sha256(match[1]), sha256(secret)]);
  const ok = timingSafeEqual(given, real);

  await failRecord(env, who, 'auth', ok, gate.fails);
  return { ok };
}

function adminError(check, cors) {
  if (check.blocked) return json({ error: 'too_many_attempts', wait: check.wait }, 429, cors);
  return json({ error: 'unauthorized' }, 401, cors);
}

/* ---------------- 암호 시도 제한 ---------------- */

async function failGate(env, who, kind) {
  if (!who) return { blocked: false, fails: 0 };
  const row = await env.DB
    .prepare('SELECT fails, seen FROM auth_fail WHERE who = ?1')
    .bind(kind + ':' + who)
    .first();
  if (!row) return { blocked: false, fails: 0 };

  const age = Date.now() - row.seen;
  if (age >= AUTH_BLOCK_MS) return { blocked: false, fails: 0 };
  if (row.fails >= AUTH_MAX_FAILS) {
    return { blocked: true, wait: Math.ceil((AUTH_BLOCK_MS - age) / 1000), fails: row.fails };
  }
  return { blocked: false, fails: row.fails };
}

async function failRecord(env, who, kind, ok, fails) {
  if (!who) return;
  const key = kind + ':' + who;
  if (ok) {
    await env.DB.prepare('DELETE FROM auth_fail WHERE who = ?1').bind(key).run();
    return;
  }
  await env.DB
    .prepare(
      'INSERT INTO auth_fail (who, fails, seen) VALUES (?1, ?2, ?3) ' +
      'ON CONFLICT(who) DO UPDATE SET fails = excluded.fails, seen = excluded.seen'
    )
    .bind(key, (fails || 0) + 1, Date.now())
    .run();
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

async function readJson(request) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > BODY_MAX_BYTES) return null;
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? body : null;
  } catch {
    return null;
  }
}

function clean(value) {
  if (typeof value !== 'string') return '';
  // 줄바꿈과 탭은 남기고 나머지 제어문자만 걷어낸다.
  let out = '';
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code === 9 || code === 10 || code === 13) { out += ch; continue; }
    if (code < 32 || code === 127) continue;
    out += ch;
  }
  return out.trim();
}

function clampInt(raw, fallback, min, max) {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

async function hashIp(request, env) {
  const ip = request.headers.get('CF-Connecting-IP');
  if (!ip) return null;
  return await sha256Hex((env.IP_SALT || '') + ':' + ip);
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

function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
