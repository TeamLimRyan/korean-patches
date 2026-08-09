// 방명록 설정.
//
// 글은 Cloudflare Worker(worker/src/index.js)가 받아서 D1에 넣습니다.
// 방문자는 로그인 없이 닉네임과 내용만 적으면 되고,
// 지우는 것은 관리자 암호를 아는 사람만 할 수 있습니다.
//
// 암호는 이 파일이 아니라 Worker의 secret(ADMIN_TOKEN)에 들어 있습니다.
// 바꾸려면:  cd worker && npx wrangler secret put ADMIN_TOKEN

export const API_BASE = "https://limryan-guestbook.yw3-mobile-image-review.workers.dev";

// 같은 브라우저에서 연속으로 글을 남길 때 기다리는 시간(초).
// 서버에서도 같은 값으로 막고 있어서, 이건 헛걸음을 줄여 주는 용도입니다.
export const COOLDOWN_SECONDS = 30;
