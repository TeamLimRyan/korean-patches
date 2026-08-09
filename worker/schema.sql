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
