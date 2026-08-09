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
index.html      전체 페이지 (HTML + CSS + 스크립트 한 파일)
favicon.png     탭 아이콘
assets/
  hero.png      상단 일러스트
  footer.png    하단 일러스트
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

giscus를 씁니다. 남긴 글은 이 저장소의 GitHub Discussions `Announcements` 카테고리에 `방명록`이라는 제목의 토론 하나로 쌓입니다. 방문자는 GitHub 계정으로 로그인해야 글을 쓸 수 있습니다.

동작하려면 이 저장소에 **giscus 앱이 설치**되어 있어야 합니다.

1. https://github.com/apps/giscus 접속
2. `Install`(이미 다른 곳에 설치했다면 `Configure`)
3. 계정 `TeamLimRyan` 선택
4. `Only select repositories` → `korean-patches` 체크 → 저장

설정값은 `index.html`의 `giscus.app/client.js` 스크립트 태그에 들어 있습니다.

| 항목 | 값 |
|---|---|
| `data-repo-id` | `R_kgDOTzOmuA` |
| `data-category` | `Announcements` |
| `data-category-id` | `DIC_kwDOTzOmuM4DC_--` |
| `data-mapping` / `data-term` | `specific` / `방명록` |

스팸이나 부적절한 글은 Discussions에서 바로 삭제·차단할 수 있습니다. 앱이 없거나 로드에 실패하면 8초 뒤 Discussions로 가는 링크가 대신 표시됩니다.

## 배포

`main` 브랜치에 푸시하면 GitHub Pages가 자동으로 반영합니다. 저장소 설정의 Pages 소스는 `main` 브랜치의 루트(`/`)입니다.

## 권리

비공식 팬메이드 프로젝트입니다. 각 게임과 상표, 원본 데이터의 권리는 해당 권리자에게 있습니다. 이 저장소와 패치 배포본에는 원본 게임 파일이 포함되어 있지 않습니다.
