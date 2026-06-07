# 모의투자 — 국내/미국주 모의투자 랭킹 앱

시드머니 1,000만원으로 국내주·미국주를 실제 시세로 매매하고, 수익금으로 랭킹을 겨루는 모의투자 웹앱.

## 기능

- 실시간 시세 조회 (Yahoo Finance, 3개월 차트)
- 국내주 (KOSPI/KOSDAQ) + 미국주 동시 지원
- USD↔KRW 환율 자동 적용 — 총 자산 원화 통일 표시
- 매수 / 매도 체결
- 포트폴리오 손익 추적 (국내/미국 섹션 분리)
- 수익금 기준 일별/주별 랭킹
- 세션 기반 데이터 (탭 닫으면 초기화, 닉네임으로 구분)

## 기술 스택

- Next.js 14 (App Router)
- Yahoo Finance 2 — 서버사이드 시세 조회 (CORS 없음)
- Zustand + sessionStorage
- Vercel Postgres — 랭킹 데이터 저장
- Tailwind CSS / Chart.js

## 로컬 실행

```bash
npm install
npm run dev
```

로컬에서 랭킹 기능을 쓰려면 `.env.local`에 Vercel Postgres 환경변수 필요:

```
POSTGRES_URL=...
POSTGRES_URL_NON_POOLING=...
```

랭킹 없이 트레이딩만 테스트할 때는 환경변수 없어도 됨.

## Vercel 배포

1. GitHub 레포에 push
2. Vercel에서 프로젝트 import
3. **Storage 탭 → Create Database → Postgres** 생성 후 프로젝트 연결
4. Deploy — DB 테이블은 첫 요청 시 자동 생성됨

## 종목코드 형식

| 시장 | 형식 | 예시 |
|------|------|------|
| KOSPI | `코드.KS` | `005930.KS` |
| KOSDAQ | `코드.KQ` | `247540.KQ` |
| 미국주 | 티커 그대로 | `NVDA`, `AAPL` |

## 페이지 구조

| 경로 | 설명 |
|------|------|
| `/` | 일별/주별 수익금 랭킹 |
| `/trade` | 닉네임 입력 → 트레이딩 → 랭킹 등록 |
