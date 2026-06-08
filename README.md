# 모의투자

시드 1,000만원으로 국내주·미국주를 실제 시세로 매매하고 수익금 랭킹을 겨루는 모의투자 웹앱.

---

## 주요 기능

### 일반 트레이딩
- 닉네임 입력 즉시 시작 (계정 불필요)
- **국내주 + 미국주** 실시간 시세 (Yahoo Finance)
- 한국어 종목 검색 — `삼성물산`, `테슬라`, `팔란티어` 등 alias 지원
- **수량 / 금액** 방식 매수 선택 (빠른 금액 버튼 + 전액 투자)
- 일별 / 주별 수익금 랭킹 (같은 닉네임은 최고 성적만 유지)
- 장 개폐장 시간 체크 (국내 KST 9:00~15:30 / 미국 ET 9:30~16:00)
- PWA 지원 — 홈 화면 추가 가능

### 챌린지 모드
- 운영자가 설정한 **과거 특정 기간** 시세로 트레이딩
- 24시간 장 마감 없음
- 챌린지별 독립 랭킹
- 세션 기반 — 브라우저 탭을 닫으면 초기화

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 App Router |
| DB | Vercel Postgres |
| 상태관리 | Zustand + localStorage (일반) / sessionStorage (챌린지) |
| 시세 | Yahoo Finance API (직접 fetch) |
| 스타일 | Tailwind CSS |
| 차트 | Chart.js / react-chartjs-2 |
| 배포 | Vercel |

---

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # Vercel Postgres 연결 정보 입력
npm run dev
```

`.env.local` 필요 항목:

```env
POSTGRES_URL=...
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NO_SSL=...
POSTGRES_URL_NON_POOLING=...
POSTGRES_USER=...
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=...
ADMIN_PASSWORD=your_password   # 영문+숫자만, 특수문자 불가
```

> DB 테이블은 최초 API 호출 시 자동 생성됩니다.

---

## Vercel 배포

1. GitHub에 push
2. Vercel에서 프로젝트 import
3. **Storage** 탭 → Vercel Postgres 데이터베이스 연결
4. **Settings → Environment Variables** 에서 `ADMIN_PASSWORD` 추가 (Production)
5. 재배포

---

## 관리자 페이지

`/admin` 접속 → `ADMIN_PASSWORD` 입력

- 챌린지 추가 / 수정 / 삭제
- 시세 기간(과거 날짜), 참여 기간, 시드머니 설정

---

## 페이지 구조

```
/                   랭킹 (일별 / 주별)
/trade              일반 트레이딩
/challenges         챌린지 목록
/challenges/[id]    챌린지 트레이딩
/admin              관리자 로그인
/admin/dashboard    챌린지 관리
```

---

## 검색 가능 종목

**국내주 (44개)** — 삼성전자, SK하이닉스, 네이버, 카카오, 현대차, 기아, 삼성물산, LG전자, 포스코, 셀트리온, SM/JYP/YG 엔터, 넷마블, 크래프톤 등

**미국주 (37개)** — NVDA(엔비디아), AAPL(애플), TSLA(테슬라), META, PLTR(팔란티어), ARM, IONQ(아이온큐), RKLB(로켓랩), TQQQ, QQQ 등

한국어 입력 시 로컬 DB에서 즉시 매핑 → 없는 종목은 Yahoo Finance 검색으로 fallback
