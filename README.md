# 임라이언 번역방

비공식 한국어 패치 배포 페이지입니다. GitHub Pages로 게시합니다.

- 공개 주소: https://teamlimryan.github.io/korean-patches/

## 게시하는 패치

| 패치 | 최신 버전 | 저장소 |
|---|---|---|
| 태합입지전 V DX 한국어 패치 | v1.02 | [TAIKO_RISSHIDEN_V_DX_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/TAIKO_RISSHIDEN_V_DX_KOREAN_LOCALIZATION_RELEASE) |
| 두근두근 메모리얼 forever with you 이모셔널 한국어 패치 | 1.0.0-ko-20260801 | [TOKIMEMO_EMOTIONAL_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/TOKIMEMO_EMOTIONAL_KOREAN_LOCALIZATION_RELEASE) |

패치 파일 자체는 이 저장소에 두지 않습니다. 각 패치 저장소의 GitHub Releases 자산으로 직접 연결합니다.

## 구성

```
index.html                 전체 페이지 (HTML + CSS + 스크립트 한 파일)
favicon.png                탭 아이콘
firestore.rules            방명록 접근 규칙 (Firebase 콘솔에 붙여넣는 용도)
assets/
  hero.jpg                 상단 일러스트
  footer.jpg               하단 일러스트
  firebase-config.js       방명록 설정값
```

빌드 과정이 없습니다. `index.html`을 브라우저로 열면 그대로 확인할 수 있습니다.

## 수정 방법

새 패치를 추가하거나 버전을 올릴 때 `index.html`에서 손볼 곳은 세 군데입니다.

1. **공지** — `<div class="notice">` 안의 문구
2. **패치 다운로드** — `<section id="download">` 안에 `<article class="card">` 블록을 복사해 제목, 버전, 용량, 다운로드 URL, 설치 안내를 교체
3. **진행 이력** — `<ol class="timeline">` 맨 위에 새 `<li>` 추가

다운로드 URL은 릴리스 자산의 `browser_download_url`을 그대로 씁니다.

```
https://github.com/TeamLimRyan/<저장소>/releases/download/<태그>/<파일명>
```

## 방명록

Firebase Firestore를 씁니다.

- **글쓰기는 로그인이 필요 없습니다.** 닉네임과 내용만 적으면 됩니다.
- **삭제는 저장소 주인만 합니다.** GitHub 계정으로 로그인했을 때, 그 UID가 등록된 주인과 같은 경우에만 각 글에 삭제 버튼이 나타납니다. 화면에서 버튼을 숨기는 것과 별개로 `firestore.rules`가 서버에서 한 번 더 막으므로, 브라우저를 조작해도 남의 글은 지워지지 않습니다.
- 수정은 아무도 할 수 없습니다.

설정이 비어 있으면 방명록 자리에 "준비 중" 안내만 뜨고 나머지 페이지는 그대로 동작합니다.

### 1. Firebase 프로젝트와 Firestore 만들기

1. https://console.firebase.google.com 에서 프로젝트를 만듭니다. 애널리틱스는 꺼도 됩니다.
2. 좌측 **빌드 → Firestore Database → 데이터베이스 만들기**
3. 위치는 `asia-northeast3` (서울), **프로덕션 모드**로 시작합니다.
4. **규칙** 탭에 이 저장소의 [`firestore.rules`](firestore.rules) 내용을 붙여넣고 게시합니다. `ownerUid()`는 4단계에서 채웁니다.

### 2. 웹 앱 등록하고 설정값 넣기

1. **프로젝트 설정(톱니바퀴) → 일반 → 내 앱 → 웹(`</>`)** 을 눌러 앱을 등록합니다.
2. 화면에 나오는 `firebaseConfig`의 여섯 값을 [`assets/firebase-config.js`](assets/firebase-config.js)에 붙여넣습니다.
3. 커밋해서 푸시하면 방명록이 켜집니다. 이 값들은 비밀이 아니라 공개되어도 됩니다.

### 3. GitHub 로그인 켜기 (삭제용)

1. Firebase에서 **빌드 → Authentication → 시작하기 → 로그인 방법 → GitHub → 사용 설정**
2. Firebase가 보여주는 콜백 URL(`https://<프로젝트>.firebaseapp.com/__/auth/handler`)을 복사합니다.
3. GitHub **Settings → Developer settings → OAuth Apps → New OAuth App**
   - Homepage URL: `https://teamlimryan.github.io/korean-patches/`
   - Authorization callback URL: 방금 복사한 값
4. 발급된 **Client ID / Client secret**을 Firebase의 GitHub 설정에 넣고 저장합니다.
5. **Authentication → Settings → 승인된 도메인**에 `teamlimryan.github.io`를 추가합니다.

### 4. 내 UID를 주인으로 등록

1. 사이트 방명록에서 **관리자 로그인**을 눌러 GitHub 계정으로 로그인합니다.
2. 아직 주인이 아니므로 화면에 `이 계정의 UID: …` 가 뜹니다. 그 값을 복사합니다.
3. 같은 값을 두 군데에 넣습니다.
   - `assets/firebase-config.js`의 `OWNER_UID`
   - `firestore.rules`의 `ownerUid()`
4. 규칙은 Firebase 콘솔 규칙 탭에 다시 붙여넣어 게시하고, 설정 파일은 커밋해서 푸시합니다.
5. 새로고침하면 각 글에 삭제 버튼이 생깁니다.

### 스팸 대응

`firestore.rules`에서 `name`(1~20자), `message`(1~500자), `createdAt`(서버 시각) 세 필드만 받고 그 외 필드는 거부합니다. 화면에는 보이지 않는 봇 잡이 입력칸이 있고, 같은 브라우저에서 연속 작성은 30초 간격으로 제한합니다(`COOLDOWN_SECONDS`). 그래도 들어온 글은 로그인 후 삭제 버튼으로 지우면 됩니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Pages가 자동으로 반영합니다. 저장소 설정의 Pages 소스는 `main` 브랜치의 루트(`/`)입니다.

## 권리

비공식 팬메이드 프로젝트입니다. 각 게임과 상표, 원본 데이터의 권리는 해당 권리자에게 있습니다. 이 저장소와 패치 배포본에는 원본 게임 파일이 포함되어 있지 않습니다.
