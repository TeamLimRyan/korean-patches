# 임라이언 번역방

비공식 한국어 패치 배포 페이지입니다. GitHub Pages로 게시합니다.

- 공개 주소: https://teamlimryan.github.io/korean-patches/

## 게시하는 패치

| 패치 | 최신 버전 | 저장소 |
|---|---|---|
| 프로야구 스피리츠 2021 그랜드슬램 한국어 패치 | v0.92 | [EBASEBALL_PRO_YAKYU_SPIRITS_2021_GRAND_SLAM_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/EBASEBALL_PRO_YAKYU_SPIRITS_2021_GRAND_SLAM_KOREAN_LOCALIZATION_RELEASE) |
| 졸업 S 한국어 패치 | v1.0 | [SOTSUGYOU_GRADUATION_S_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/SOTSUGYOU_GRADUATION_S_KOREAN_LOCALIZATION_RELEASE) |
| 파워풀 프로야구 2026-2027 한국어 패치 | v1.01 | [PAWAFURU_PRO_YAKYU_2026_2027_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/PAWAFURU_PRO_YAKYU_2026_2027_KOREAN_LOCALIZATION_RELEASE) |
| 서몬나이트 크래프트 소드 이야기 한국어 패치 | v1.0.5 | [SUMMON_NIGHT_CRAFT_SWORD_MONOGATARI_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/SUMMON_NIGHT_CRAFT_SWORD_MONOGATARI_KOREAN_LOCALIZATION_RELEASE) |
| 서몬나이트 크래프트 소드 이야기 2 한국어 패치 | v1.0.5 | [SUMMON_NIGHT_CRAFT_SWORD_MONOGATARI_2_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/SUMMON_NIGHT_CRAFT_SWORD_MONOGATARI_2_KOREAN_LOCALIZATION_RELEASE) |
| 서몬나이트 크래프트 소드 이야기 ~시작의 돌~ 한국어 패치 | v1.0.2 | [SUMMON_NIGHT_CRAFT_SWORD_MONOGATARI_HAJIMARI_NO_ISHI_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/SUMMON_NIGHT_CRAFT_SWORD_MONOGATARI_HAJIMARI_NO_ISHI_KOREAN_LOCALIZATION_RELEASE) |
| 테일즈 오브 판타지아 나리키리 던전 한국어 패치 | v1.0.0 | [TALES_OF_PHANTASIA_NARIKIRI_DUNGEON_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/TALES_OF_PHANTASIA_NARIKIRI_DUNGEON_KOREAN_LOCALIZATION_RELEASE) |
| 기동전사 건담 신 기렌의 야망 한국어 패치 | v0.2.0 | [KIDOU_SENSHI_GUNDAM_SHIN_GIHREN_NO_YABOU_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/KIDOU_SENSHI_GUNDAM_SHIN_GIHREN_NO_YABOU_KOREAN_LOCALIZATION_RELEASE) |
| 요괴워치 3 스키야키 한국어 패치 | v0.2.1 / v0.4.0 | [YW3_SUKIYAKI_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/YW3_SUKIYAKI_KOREAN_LOCALIZATION_RELEASE) |
| 발키리 드라이브 -비크니- 한국어 패치 | v0.1.1 | [VALKYRIE_DRIVE_BHIKKHUNI_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/VALKYRIE_DRIVE_BHIKKHUNI_KOREAN_LOCALIZATION_RELEASE) |
| 테일즈 오브 더 월드 ~서머너즈 리니지~ 한국어 패치 | v1.0.1 | [TALES_OF_THE_WORLD_SUMMONERS_LINEAGE_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/TALES_OF_THE_WORLD_SUMMONERS_LINEAGE_KOREAN_LOCALIZATION_RELEASE) |
| 두근두근 메모리얼 forever with you 이모셔널 한국어 패치 | 1.0.0-ko-20260801 | [TOKIMEMO_EMOTIONAL_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/TOKIMEMO_EMOTIONAL_KOREAN_LOCALIZATION_RELEASE) |
| 태합입지전 V DX 한국어 패치 | v1.02 | [TAIKO_RISSHIDEN_V_DX_KOREAN_LOCALIZATION_RELEASE](https://github.com/TeamLimRyan/TAIKO_RISSHIDEN_V_DX_KOREAN_LOCALIZATION_RELEASE) |

패치 파일 자체는 이 저장소에 두지 않습니다. 각 패치 저장소의 GitHub Releases 자산으로 직접 연결합니다.

요괴워치 3은 두 판이 대상 게임 데이터 버전이 달라 함께 게시합니다. `v0.2.1`은 게임 데이터 `0.2.0`용으로 텍스트 132,357개와 이미지 1,694개가 한글화되어 있고, `v0.4.0`은 게임 데이터 `0.4.0`용으로 텍스트 56,317개를 다루며 이미지는 원본을 유지합니다. 번호가 큰 쪽이 최신이 아닙니다.

## 구성

```
index.html                    전체 페이지 (HTML + CSS + 스크립트 한 파일)
favicon.png                   탭 아이콘
assets/
  hero.jpg                    상단 일러스트
  footer.jpg                  하단 일러스트
  guestbook-config.js         방명록 API 주소
worker/                       방명록 서버 (Cloudflare Worker + D1)
  wrangler.toml               배포 설정
  schema.sql                  D1 테이블
  src/index.js                API 구현
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

Cloudflare Worker + D1로 굴러갑니다. GitHub Pages는 정적 파일만 주므로 글 저장은 Worker가 맡습니다.

- **글쓰기는 로그인이 필요 없습니다.** 닉네임과 내용만 적으면 됩니다.
- **비밀글**을 고르면 글쓴이가 정한 열람 암호(4~20자)를 아는 사람과 관리자만 본문을 볼 수 있습니다. 화면에서 가리는 방식이 아니라 서버가 본문을 아예 빼고 내려보냅니다.
- **답글은 관리자만** 답니다. 방문자는 답글을 달 수 없습니다.
- **삭제는 관리자 암호를 아는 사람만 합니다.** 페이지 방명록의 `관리자` 버튼을 눌러 암호를 넣으면 각 글에 삭제·답글 버튼이 생깁니다.
- 글 수정 기능은 없습니다.

### 구성

| 항목 | 값 |
|---|---|
| Worker | `limryan-guestbook` |
| API 주소 | `https://limryan-guestbook.yw3-mobile-image-review.workers.dev` |
| D1 데이터베이스 | `limryan-guestbook` (`0bac1ee9-d6a2-435b-806f-b9b3991125b9`) |
| 허용 출처 | `wrangler.toml`의 `ALLOWED_ORIGINS` |

API 주소는 [`assets/guestbook-config.js`](assets/guestbook-config.js)에 들어 있습니다.

### API

| 메서드 | 경로 | 설명 |
|---|---|---|
| `GET` | `/entries` | 최근 글 목록. 비밀글은 본문과 답글을 빼고 내려줍니다 |
| `POST` | `/entries` | 글 남기기 (`{name, message, secret?, password?}`) |
| `POST` | `/entries/:id/unlock` | 비밀글을 열람 암호로 열기 (`{password}`) |
| `DELETE` | `/entries/:id` | 글 지우기 (관리자) |
| `POST` | `/entries/:id/comments` | 답글 달기 (관리자, `{message}`) |
| `DELETE` | `/comments/:id` | 답글 지우기 (관리자) |
| `POST` | `/admin/check` | 관리자 암호가 맞는지만 확인 |

관리자 요청은 모두 `Authorization: Bearer <관리자 암호>` 헤더를 붙입니다.

### 관리자 암호 바꾸기

```
cd worker
npx wrangler secret put ADMIN_TOKEN
```

암호는 저장소 어디에도 없고 Worker secret 으로만 존재합니다. 브라우저에는 탭을 닫으면 사라지는 `sessionStorage`에만 잠깐 남습니다. 값을 바꾸면 반영까지 몇십 초 걸릴 수 있습니다.

틀린 암호를 한 회선에서 5번 넣으면 그 회선은 10분 동안 막힙니다(`AUTH_MAX_FAILS`, `AUTH_BLOCK_MS`). 비밀글 열람 암호도 같은 방식으로 따로 셉니다. 막혀 있는 동안에는 맞는 암호를 넣어도 통과되지 않고, 한 번 맞히면 실패 기록은 지워집니다. 짧은 암호를 쓰더라도 마구 찔러 볼 수 없게 하려는 장치입니다.

실수로 스스로 막혔다면 이렇게 풉니다.

```
npx wrangler d1 execute limryan-guestbook --remote --command="DELETE FROM auth_fail;"
```

비밀글 열람 암호는 되찾을 수 없습니다. 글쓴이가 잊었다면 관리자가 대신 읽어 주거나 글을 지우는 수밖에 없습니다.

### 서버 고치고 다시 올리기

```
cd worker
npx wrangler deploy
```

스키마를 바꿨다면:

```
npx wrangler d1 execute limryan-guestbook --remote --file=schema.sql
```

### 스팸 대응

Worker에서 닉네임 20자, 내용 500자, 본문 8KB로 자르고 그 밖의 필드는 받지 않습니다. 화면에 보이지 않는 봇 잡이 입력칸이 있고, 같은 회선에서 연달아 넣는 것은 30초로 막습니다(`THROTTLE_SECONDS`). 이때 쓰는 값은 소금을 섞은 IP 해시라 원래 주소로 되돌릴 수 없고, 글과 연결되지도 않으며 하루가 지나면 지워집니다. 그래도 들어온 글은 관리자로 로그인해 지우면 됩니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Pages가 자동으로 반영합니다. 저장소 설정의 Pages 소스는 `main` 브랜치의 루트(`/`)입니다.

## 권리

비공식 팬메이드 프로젝트입니다. 각 게임과 상표, 원본 데이터의 권리는 해당 권리자에게 있습니다. 이 저장소와 패치 배포본에는 원본 게임 파일이 포함되어 있지 않습니다.
