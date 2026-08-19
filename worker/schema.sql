-- 임라이언 번역방 방명록 스키마
--
-- 적용:
--   npx wrangler d1 execute limryan-guestbook --remote --file=worker/schema.sql

CREATE TABLE IF NOT EXISTS entries (
  id         TEXT    PRIMARY KEY,
  name       TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  created_at INTEGER NOT NULL
);

-- 최신 글부터 뽑는 질의를 위한 인덱스.
CREATE INDEX IF NOT EXISTS entries_created_at
  ON entries (created_at DESC);

-- 도배 방지용. 글쓴이를 식별하려는 것이 아니라 같은 회선에서
-- 짧은 시간에 연달아 넣는 것만 막기 위해 IP의 해시만 잠깐 둔다.
-- 여기 남는 값으로는 원래 IP를 되돌릴 수 없고, 글과 연결되지도 않는다.
CREATE TABLE IF NOT EXISTS throttle (
  who  TEXT    PRIMARY KEY,
  last INTEGER NOT NULL
);

-- 관리자 암호 무차별 대입 차단.
-- 틀린 시도를 세다가 일정 횟수를 넘기면 그 회선은 잠시 막는다.
-- 여기 남는 값도 되돌릴 수 없는 해시이며 맞히면 바로 지워진다.
CREATE TABLE IF NOT EXISTS auth_fail (
  who   TEXT    PRIMARY KEY,
  fails INTEGER NOT NULL,
  seen  INTEGER NOT NULL
);

-- ---- 비밀글과 답글 (2026-08-19 추가) ----
-- 기존 entries 테이블에 컬럼을 덧붙이는 마이그레이션이다.
-- 이미 적용된 저장소에서는 ALTER 두 줄이 duplicate column 오류를 내므로,
-- 그 경우에는 오류를 무시하고 넘어가면 된다.
--
--   ALTER TABLE entries ADD COLUMN secret INTEGER NOT NULL DEFAULT 0;
--   ALTER TABLE entries ADD COLUMN pw_hash TEXT;

-- 관리자만 다는 답글.
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT    PRIMARY KEY,
  entry_id   TEXT    NOT NULL,
  message    TEXT    NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS comments_entry
  ON comments (entry_id, created_at);
