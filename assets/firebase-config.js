// 방명록용 Firebase 설정.
//
// Firebase 콘솔 → 프로젝트 설정(톱니바퀴) → 일반 → "내 앱"의 웹 앱에서
// 아래 여섯 값을 그대로 복사해 채우면 방명록이 켜집니다.
// 값이 비어 있으면 사이트는 방명록 자리에 "준비 중" 안내만 띄우고 나머지는 정상 동작합니다.
//
// 이 값들은 비밀이 아닙니다. 웹 API 키는 브라우저에 노출되는 것이 정상이며,
// 실제 접근 통제는 firestore.rules 가 담당합니다. 저장소에 그대로 커밋해도 됩니다.

export const firebaseConfig = {
  apiKey:            "",
  authDomain:        "",
  projectId:         "",
  storageBucket:     "",
  messagingSenderId: "",
  appId:             "",
};

// 방명록 글을 지울 수 있는 관리자의 Firebase UID.
// 이 UID로 GitHub 로그인했을 때만 화면에 삭제 버튼이 나타납니다.
//
// 값을 모르면 비워 둔 채로 두고, 사이트 방명록에서 "관리자 로그인"을 눌러
// GitHub 계정으로 로그인하면 화면에 이 계정의 UID가 표시됩니다.
// 그 값을 여기와 firestore.rules 의 ownerUid() 양쪽에 넣으면 됩니다.
//
// 실제 삭제 차단은 firestore.rules 가 하므로, 이 값만 고쳐서는 남의 글을 지울 수 없습니다.
export const OWNER_UID = "";

// 방명록 글이 저장될 컬렉션 이름. 바꿀 일은 거의 없습니다.
export const GUESTBOOK_COLLECTION = "guestbook";

// 한 번에 불러올 최근 글 수.
export const GUESTBOOK_LIMIT = 100;

// 같은 브라우저에서 연속으로 글을 남길 때 기다려야 하는 시간(초).
export const COOLDOWN_SECONDS = 30;
