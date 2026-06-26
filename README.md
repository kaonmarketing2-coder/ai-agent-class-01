# 교육 그룹 배정 시스템

RM본부 교육(Group 1·2) 참석 배정을 위한 웹 페이지입니다. 원본 React(JSX) 컴포넌트를
브라우저에서 바로 실행 가능한 standalone HTML로 변환했습니다. (React + Babel CDN 사용)

## 페이지

| 파일 | 설명 |
|------|------|
| `index.html` | 랜딩 페이지 (두 페이지로 이동) |
| `attendance.html` | 참석 배정 제출 폼 |
| `dashboard.html` | 관리자 대시보드 (비밀번호 필요) |

데이터는 Supabase의 `training_submissions` 테이블에 저장됩니다.

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
