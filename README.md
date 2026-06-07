# 모의투자 — 국내주 모의투자 앱

Yahoo Finance 실시간 시세 연동 국내주 모의투자 웹앱.  
시드머니 1,000만원으로 시작해서 실제 시세로 매매 연습.

## 기술 스택

- Next.js 14 (App Router)
- Yahoo Finance 2 (서버사이드 시세 조회 — CORS 없음)
- Zustand (상태관리 + localStorage 영구저장)
- Tailwind CSS
- Chart.js / react-chartjs-2

## 로컬 실행

```bash
npm install
npm run dev
```

## Vercel 배포

```bash
npm i -g vercel
vercel
```

별도 환경변수 없음. `yahoo-finance2`가 서버사이드에서 직접 호출하므로 API 키도 불필요.

## 종목코드 형식

| 시장 | 형식 | 예시 |
|------|------|------|
| KOSPI | `코드.KS` | `005930.KS` |
| KOSDAQ | `코드.KQ` | `247540.KQ` |
| 미국주 | 티커 그대로 | `NVDA`, `AAPL` |

## 기능

- 실시간 시세 조회 (3개월 차트 포함)
- 매수 / 매도 체결
- 포트폴리오 손익 추적
- 거래내역 조회
- 데이터 브라우저 localStorage 영구저장
