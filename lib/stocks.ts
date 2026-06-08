export interface StockInfo {
  symbol: string
  name: string       // 정식 영문명 (또는 주요 표기명)
  nameKo?: string    // 한국어 표시명 (name과 다를 때만)
  aliases: string[]  // 검색 키워드 (한국어 포함)
  market: 'KR' | 'US'
}

export const STOCKS: StockInfo[] = [
  // ── 국내주 ──────────────────────────────────────────────
  { symbol: '005930.KS', name: '삼성전자',         aliases: ['삼성', '삼성전자', 'samsung'],                 market: 'KR' },
  { symbol: '000660.KS', name: 'SK하이닉스',       aliases: ['SK하이닉스', '하이닉스', 'skhynix'],           market: 'KR' },
  { symbol: '035420.KS', name: 'NAVER',             nameKo: '네이버',          aliases: ['네이버', 'naver'],                             market: 'KR' },
  { symbol: '035720.KS', name: '카카오',            aliases: ['카카오', 'kakao'],                             market: 'KR' },
  { symbol: '005380.KS', name: '현대차',            aliases: ['현대차', '현대자동차', 'hyundai'],             market: 'KR' },
  { symbol: '000270.KS', name: '기아',              aliases: ['기아', '기아차', 'kia'],                       market: 'KR' },
  { symbol: '373220.KS', name: 'LG에너지솔루션',   aliases: ['LG에너지', 'LG엔솔', 'lges'],                  market: 'KR' },
  { symbol: '068270.KS', name: '셀트리온',          aliases: ['셀트리온', 'celltrion'],                       market: 'KR' },
  { symbol: '247540.KQ', name: '에코프로비엠',      aliases: ['에코프로비엠', '에코프로', 'ecoprobm'],        market: 'KR' },
  { symbol: '086520.KS', name: '에코프로',          aliases: ['에코프로홀딩스', 'ecopro'],                    market: 'KR' },
  { symbol: '259960.KS', name: '크래프톤',          aliases: ['크래프톤', 'krafton', '배그'],                 market: 'KR' },
  { symbol: '028260.KS', name: '삼성물산',          aliases: ['삼성물산'],                                    market: 'KR' },
  { symbol: '066570.KS', name: 'LG전자',           aliases: ['LG전자', 'lge'],                               market: 'KR' },
  { symbol: '051910.KS', name: 'LG화학',           aliases: ['LG화학', 'lgchem'],                            market: 'KR' },
  { symbol: '207940.KS', name: '삼성바이오로직스',  aliases: ['삼성바이오', '삼성바이오로직스'],              market: 'KR' },
  { symbol: '006400.KS', name: '삼성SDI',          aliases: ['삼성SDI', 'sdi'],                              market: 'KR' },
  { symbol: '003550.KS', name: 'LG',               nameKo: 'LG(주)',           aliases: ['LG', 'LG그룹', 'LG홀딩스'],                    market: 'KR' },
  { symbol: '105560.KS', name: 'KB금융',           aliases: ['KB금융', 'KB', '국민은행'],                    market: 'KR' },
  { symbol: '055550.KS', name: '신한지주',          aliases: ['신한', '신한금융', '신한은행'],                market: 'KR' },
  { symbol: '086790.KS', name: '하나금융지주',      aliases: ['하나금융', '하나은행'],                        market: 'KR' },
  { symbol: '032830.KS', name: '삼성생명',          aliases: ['삼성생명'],                                    market: 'KR' },
  { symbol: '015760.KS', name: 'KEPCO',             nameKo: '한국전력',        aliases: ['한국전력', '한전', 'kepco'],                    market: 'KR' },
  { symbol: '096770.KS', name: 'SK이노베이션',      aliases: ['SK이노', 'SK이노베이션'],                      market: 'KR' },
  { symbol: '034730.KS', name: 'SK',               nameKo: 'SK(주)',           aliases: ['SK그룹', 'SK홀딩스'],                           market: 'KR' },
  { symbol: '000810.KS', name: '삼성화재',          aliases: ['삼성화재'],                                    market: 'KR' },
  { symbol: '009830.KS', name: 'POSCO홀딩스',      aliases: ['포스코', 'posco', 'POSCO'],                    market: 'KR' },
  { symbol: '011200.KS', name: 'HMM',              nameKo: 'HMM(현대상선)',    aliases: ['HMM', '현대상선', '해운'],                     market: 'KR' },
  { symbol: '010130.KS', name: '고려아연',          aliases: ['고려아연'],                                    market: 'KR' },
  { symbol: '018260.KS', name: '삼성SDS',          aliases: ['삼성SDS', '삼성에스디에스'],                   market: 'KR' },
  { symbol: '047050.KS', name: '포스코인터내셔널',  aliases: ['포스코인터', '포스코인터내셔널'],              market: 'KR' },
  { symbol: '003490.KS', name: '대한항공',          aliases: ['대한항공', '항공'],                            market: 'KR' },
  { symbol: '035250.KS', name: '강원랜드',          aliases: ['강원랜드', '카지노'],                          market: 'KR' },
  { symbol: '030200.KS', name: 'KT',               nameKo: 'KT(케이티)',       aliases: ['KT', '케이티'],                                market: 'KR' },
  { symbol: '017670.KS', name: 'SK텔레콤',          aliases: ['SKT', 'SK텔레콤', '에스케이텔레콤'],           market: 'KR' },
  { symbol: '032640.KS', name: 'LG유플러스',       aliases: ['LGU+', 'LG유플러스'],                          market: 'KR' },
  { symbol: '251270.KS', name: '넷마블',            aliases: ['넷마블', 'netmarble'],                         market: 'KR' },
  { symbol: '263750.KQ', name: '펄어비스',          aliases: ['펄어비스', 'pearlabyss'],                      market: 'KR' },
  { symbol: '112040.KQ', name: '위메이드',          aliases: ['위메이드', 'wemade'],                          market: 'KR' },
  { symbol: '293490.KQ', name: '카카오게임즈',      aliases: ['카카오게임즈', 'kakaogames'],                  market: 'KR' },
  { symbol: '041510.KQ', name: 'SM엔터테인먼트',   aliases: ['SM', 'SM엔터', 'SM엔터테인먼트'],              market: 'KR' },
  { symbol: '035900.KQ', name: 'JYP Ent.',          nameKo: 'JYP엔터테인먼트', aliases: ['JYP', 'JYP엔터'],                              market: 'KR' },
  { symbol: '122870.KQ', name: '와이지엔터테인먼트', aliases: ['YG', 'YG엔터', '와이지'],                    market: 'KR' },
  { symbol: '000720.KS', name: '현대건설',          aliases: ['현대건설'],                                    market: 'KR' },
  { symbol: '006800.KS', name: '미래에셋증권',      aliases: ['미래에셋', '미래에셋증권'],                    market: 'KR' },

  // ── 미국주 ──────────────────────────────────────────────
  { symbol: 'NVDA',  name: 'NVIDIA',          nameKo: '엔비디아',        aliases: ['엔비디아', 'nvidia', 'nvda'],                   market: 'US' },
  { symbol: 'AAPL',  name: 'Apple',           nameKo: '애플',            aliases: ['애플', 'apple', 'aapl'],                       market: 'US' },
  { symbol: 'TSLA',  name: 'Tesla',           nameKo: '테슬라',          aliases: ['테슬라', 'tesla', 'tsla'],                     market: 'US' },
  { symbol: 'MSFT',  name: 'Microsoft',       nameKo: '마이크로소프트',  aliases: ['마이크로소프트', '마소', 'microsoft'],          market: 'US' },
  { symbol: 'AMZN',  name: 'Amazon',          nameKo: '아마존',          aliases: ['아마존', 'amazon'],                            market: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet',        nameKo: '구글',            aliases: ['구글', '알파벳', 'google', 'alphabet'],        market: 'US' },
  { symbol: 'META',  name: 'Meta',            nameKo: '메타',            aliases: ['메타', '페이스북', 'meta', 'facebook'],        market: 'US' },
  { symbol: 'PLTR',  name: 'Palantir',        nameKo: '팔란티어',        aliases: ['팔란티어', 'palantir'],                        market: 'US' },
  { symbol: 'AMD',   name: 'AMD',             nameKo: 'AMD',             aliases: ['AMD', '에이엠디'],                             market: 'US' },
  { symbol: 'SOXL',  name: 'SOXL',            nameKo: '반도체 3배 ETF', aliases: ['SOXL', '반도체3배'],                           market: 'US' },
  { symbol: 'INTC',  name: 'Intel',           nameKo: '인텔',            aliases: ['인텔', 'intel'],                               market: 'US' },
  { symbol: 'NFLX',  name: 'Netflix',         nameKo: '넷플릭스',        aliases: ['넷플릭스', 'netflix'],                         market: 'US' },
  { symbol: 'DIS',   name: 'Disney',          nameKo: '디즈니',          aliases: ['디즈니', 'disney'],                            market: 'US' },
  { symbol: 'BABA',  name: 'Alibaba',         nameKo: '알리바바',        aliases: ['알리바바', 'alibaba'],                         market: 'US' },
  { symbol: 'BIDU',  name: 'Baidu',           nameKo: '바이두',          aliases: ['바이두', 'baidu'],                             market: 'US' },
  { symbol: 'UBER',  name: 'Uber',            nameKo: '우버',            aliases: ['우버', 'uber'],                                market: 'US' },
  { symbol: 'COIN',  name: 'Coinbase',        nameKo: '코인베이스',      aliases: ['코인베이스', 'coinbase'],                      market: 'US' },
  { symbol: 'HOOD',  name: 'Robinhood',       nameKo: '로빈후드',        aliases: ['로빈후드', 'robinhood'],                       market: 'US' },
  { symbol: 'ARM',   name: 'ARM Holdings',    nameKo: 'ARM홀딩스',       aliases: ['ARM', '암홀딩스'],                             market: 'US' },
  { symbol: 'SMCI',  name: 'Super Micro',     nameKo: '슈퍼마이크로',    aliases: ['슈퍼마이크로', 'supermicro', 'SMCI'],          market: 'US' },
  { symbol: 'MSTR',  name: 'MicroStrategy',   nameKo: '마이크로스트래티지', aliases: ['마이크로스트래티지', 'microstrategy'],     market: 'US' },
  { symbol: 'TSM',   name: 'TSMC',            nameKo: '대만반도체',      aliases: ['TSMC', '대만반도체'],                          market: 'US' },
  { symbol: 'ASML',  name: 'ASML',            nameKo: 'ASML',            aliases: ['ASML', '에이에스엠엘'],                        market: 'US' },
  { symbol: 'JPM',   name: 'JPMorgan',        nameKo: 'JP모건',          aliases: ['JP모건', 'jpmorgan'],                          market: 'US' },
  { symbol: 'BAC',   name: 'Bank of America', nameKo: '뱅크오브아메리카', aliases: ['뱅크오브아메리카', 'bofa'],                   market: 'US' },
  { symbol: 'RIVN',  name: 'Rivian',          nameKo: '리비안',          aliases: ['리비안', 'rivian'],                            market: 'US' },
  { symbol: 'NIO',   name: 'NIO',             nameKo: '니오',            aliases: ['니오', 'nio'],                                 market: 'US' },
  { symbol: 'XPEV',  name: 'XPeng',           nameKo: '샤오펑',          aliases: ['샤오펑', 'xpeng'],                             market: 'US' },
  { symbol: 'SHOP',  name: 'Shopify',         nameKo: '쇼피파이',        aliases: ['쇼피파이', 'shopify'],                         market: 'US' },
  { symbol: 'SNAP',  name: 'Snap',            nameKo: '스냅챗',          aliases: ['스냅', '스냅챗', 'snapchat'],                  market: 'US' },
  { symbol: 'RKLB',  name: 'Rocket Lab',      nameKo: '로켓랩',          aliases: ['로켓랩', 'rocketlab'],                         market: 'US' },
  { symbol: 'LUNR',  name: 'Intuitive Machines', nameKo: '인튜이티브머신스', aliases: ['인튜이티브머신스'],                       market: 'US' },
  { symbol: 'IONQ',  name: 'IonQ',            nameKo: '아이온큐',        aliases: ['아이온큐', 'ionq'],                            market: 'US' },
  { symbol: 'RGTI',  name: 'Rigetti',         nameKo: '리게티',          aliases: ['리게티', 'rigetti'],                           market: 'US' },
  { symbol: 'TQQQ',  name: 'TQQQ',            nameKo: '나스닥 3배 ETF', aliases: ['TQQQ', '나스닥3배'],                           market: 'US' },
  { symbol: 'SQQQ',  name: 'SQQQ',            nameKo: '나스닥 인버스 3배', aliases: ['SQQQ', '나스닥인버스3배'],                  market: 'US' },
  { symbol: 'QQQ',   name: 'QQQ',             nameKo: '나스닥 ETF',     aliases: ['QQQ', '나스닥ETF'],                            market: 'US' },
  { symbol: 'SPY',   name: 'SPY',             nameKo: 'S&P500 ETF',     aliases: ['SPY', 'S&P500'],                               market: 'US' },
]

/** 언어에 맞는 표시명 반환 */
export function getDisplayName(s: StockInfo, lang: 'ko' | 'en'): string {
  if (lang === 'ko') return s.nameKo ?? s.name
  return s.name
}

/** 부제목용 보조 표시명 (주표시명과 다를 때만) */
export function getSubName(s: StockInfo, lang: 'ko' | 'en'): string | null {
  if (!s.nameKo || s.nameKo === s.name) return null
  return lang === 'ko' ? s.name : s.nameKo
}

export function searchStocks(query: string): StockInfo[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  return STOCKS.filter(s =>
    s.name.toLowerCase().includes(q) ||
    (s.nameKo?.toLowerCase().includes(q)) ||
    s.symbol.toLowerCase().includes(q) ||
    s.aliases.some(a => a.toLowerCase().includes(q))
  ).slice(0, 8)
}

export function findStock(query: string): StockInfo | undefined {
  const q = query.toLowerCase().trim()
  return STOCKS.find(s =>
    s.symbol.toLowerCase() === q ||
    s.name.toLowerCase() === q ||
    s.nameKo?.toLowerCase() === q ||
    s.aliases.some(a => a.toLowerCase() === q)
  )
}
