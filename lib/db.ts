import { sql } from '@vercel/postgres'

// ── 실시간 랭킹 ──────────────────────────────────────────

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS rankings (
      id          SERIAL PRIMARY KEY,
      nickname    VARCHAR(20) NOT NULL,
      profit      BIGINT NOT NULL,
      profit_rate DECIMAL(8,2) NOT NULL,
      final_value BIGINT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS challenges (
      id          SERIAL PRIMARY KEY,
      title       VARCHAR(60) NOT NULL,
      description TEXT,
      trade_start DATE NOT NULL,
      trade_end   DATE NOT NULL,
      open_from   TIMESTAMPTZ NOT NULL,
      open_until  TIMESTAMPTZ NOT NULL,
      seed        BIGINT NOT NULL DEFAULT 10000000,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS user_states (
      nickname    VARCHAR(20) PRIMARY KEY,
      cash        BIGINT NOT NULL,
      holdings    JSONB NOT NULL DEFAULT '{}',
      history     JSONB NOT NULL DEFAULT '[]',
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS challenge_rankings (
      id           SERIAL PRIMARY KEY,
      challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
      nickname     VARCHAR(20) NOT NULL,
      profit       BIGINT NOT NULL,
      profit_rate  DECIMAL(8,2) NOT NULL,
      final_value  BIGINT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function insertRanking(nickname: string, profit: number, profitRate: number, finalValue: number) {
  await initDb()
  await sql`INSERT INTO rankings (nickname, profit, profit_rate, final_value) VALUES (${nickname}, ${profit}, ${profitRate}, ${finalValue})`
}

export async function getDailyRankings() {
  await initDb()
  const { rows } = await sql`
    SELECT nickname, profit, profit_rate, final_value, created_at FROM rankings
    WHERE created_at >= NOW() - INTERVAL '1 day'
    ORDER BY profit DESC LIMIT 50
  `
  return rows
}

export async function getWeeklyRankings() {
  await initDb()
  const { rows } = await sql`
    SELECT nickname, MAX(profit) as profit, MAX(profit_rate) as profit_rate,
           MAX(final_value) as final_value, MAX(created_at) as created_at
    FROM rankings WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY nickname ORDER BY profit DESC LIMIT 50
  `
  return rows
}

// ── 유저 상태 ────────────────────────────────────────────

export async function getUserState(nickname: string) {
  await initDb()
  const { rows } = await sql`
    SELECT cash, holdings, history FROM user_states WHERE nickname = ${nickname}
  `
  return rows[0] ?? null
}

export async function saveUserState(nickname: string, cash: number, holdings: object, history: object[]) {
  await initDb()
  await sql`
    INSERT INTO user_states (nickname, cash, holdings, history)
    VALUES (${nickname}, ${cash}, ${JSON.stringify(holdings)}, ${JSON.stringify(history)})
    ON CONFLICT (nickname) DO UPDATE
      SET cash = ${cash}, holdings = ${JSON.stringify(holdings)},
          history = ${JSON.stringify(history)}, updated_at = NOW()
  `
}

// ── 챌린지 ──────────────────────────────────────────────

export async function getChallenges() {
  await initDb()
  const { rows } = await sql`
    SELECT * FROM challenges ORDER BY open_until DESC
  `
  return rows
}

export async function getChallenge(id: number) {
  await initDb()
  const { rows } = await sql`SELECT * FROM challenges WHERE id = ${id}`
  return rows[0] ?? null
}

export async function createChallenge(data: {
  title: string
  description: string
  trade_start: string
  trade_end: string
  open_from: string
  open_until: string
  seed: number
}) {
  await initDb()
  const { rows } = await sql`
    INSERT INTO challenges (title, description, trade_start, trade_end, open_from, open_until, seed)
    VALUES (${data.title}, ${data.description}, ${data.trade_start}, ${data.trade_end},
            ${data.open_from}, ${data.open_until}, ${data.seed})
    RETURNING *
  `
  return rows[0]
}

export async function updateChallenge(id: number, data: {
  title: string
  description: string
  trade_start: string
  trade_end: string
  open_from: string
  open_until: string
  seed: number
}) {
  await initDb()
  await sql`
    UPDATE challenges SET title=${data.title}, description=${data.description},
      trade_start=${data.trade_start}, trade_end=${data.trade_end},
      open_from=${data.open_from}, open_until=${data.open_until}, seed=${data.seed}
    WHERE id=${id}
  `
}

export async function deleteChallenge(id: number) {
  await initDb()
  await sql`DELETE FROM challenges WHERE id = ${id}`
}

export async function getChallengeRankings(challengeId: number) {
  await initDb()
  const { rows } = await sql`
    SELECT nickname, MAX(profit) as profit, MAX(profit_rate) as profit_rate,
           MAX(final_value) as final_value, MAX(submitted_at) as submitted_at
    FROM challenge_rankings WHERE challenge_id = ${challengeId}
    GROUP BY nickname ORDER BY profit DESC LIMIT 50
  `
  return rows
}

export async function insertChallengeRanking(challengeId: number, nickname: string, profit: number, profitRate: number, finalValue: number) {
  await initDb()
  await sql`
    INSERT INTO challenge_rankings (challenge_id, nickname, profit, profit_rate, final_value)
    VALUES (${challengeId}, ${nickname}, ${profit}, ${profitRate}, ${finalValue})
  `
}
