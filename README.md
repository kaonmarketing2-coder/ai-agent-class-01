# 교육 그룹 배정 시스템

교육 참석 그룹 배정을 위한 웹 페이지입니다. 원본 React(JSX) 컴포넌트를
외부 의존성 없이 동작하는 self-contained HTML로 변환했습니다. (React 인라인 포함)

## 페이지

| 파일 | 설명 | Supabase 테이블 |
|------|------|------|
| `index.html` | 랜딩 페이지 (전체 메뉴) | — |
| `attendance.html` | 참석 배정 제출 폼 — Group 1·2 (RM본부) | `training_submissions` |
| `dashboard.html` | 관리자 대시보드 — Group 1·2 (비밀번호 필요) | `training_submissions` |
| `attendance_g345.html` | 참석 배정 제출 폼 — Group 3·4·5 | `training_submissions_g345` |
| `dashboard_g345.html` | 관리자 대시보드 — Group 3·4·5 (비밀번호 필요) | `training_submissions_g345` |

- Group 3·4·5 대상 부서: 영업본부, Corporate실, PI그룹, 경영지원본부, RM본부(ESG팀), ProjectManage본부
- Group 3·4·5 대시보드는 CSV 외에 Google Sheets 내보내기도 지원합니다
  (사용하려면 `src/dashboard_g345.jsx`의 `GOOGLE_CLIENT_ID` 설정 필요).

## HTML로 보는 방법 (GitHub Pages)

1. GitHub 저장소 → **Settings** → **Pages**
2. **Source**: `Deploy from a branch`
3. **Branch**: `claude/github-html-upload-5axtes` / `/ (root)` 선택 후 **Save**
4. 잠시 후 생성되는 주소로 접속:
   - `https://<사용자>.github.io/ai-agent-class-01/` (랜딩)
   - `.../attendance.html` · `.../dashboard.html`

> Pages는 보통 `main` 등 기본 브랜치에서 배포합니다. 이 브랜치를 병합(merge)한 뒤
> 기본 브랜치에서 Pages를 켜는 것을 권장합니다.

## 개발 / 빌드

페이지는 React를 외부 CDN으로 불러오지 않고 **파일 안에 모두 포함(self-contained)** 합니다.
그래서 캐시·CDN 차단·회사망과 무관하게 어디서나 열립니다. 소스를 고친 뒤 빌드하면 됩니다.

```bash
npm install        # 빌드 도구 설치 (최초 1회)
npm run build      # src/*.jsx → attendance.html, dashboard.html 재생성
```

- 편집 대상: `src/attendance.jsx`, `src/dashboard.jsx` (읽기 쉬운 원본)
- 루트의 `*.html`은 빌드 산출물 — 직접 수정하지 말고 빌드로 갱신하세요.

## 참고

- 빌드된 `*.html`은 더블클릭하거나 정적 호스팅에 올리면 바로 동작합니다 (외부 요청 0개).
- 대시보드 비밀번호는 `src/dashboard.jsx`의 `DASHBOARD_PASSWORD` 값에서 변경 후 빌드하세요.
- **비고**는 `이름 / 사유` 행 목록으로 입력하며, Supabase에는 JSON 문자열로 저장됩니다.
  기존에 일반 텍스트로 저장된 비고도 그대로 표시됩니다(역호환).
