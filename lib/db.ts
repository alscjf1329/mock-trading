import { sql } from '@vercel/postgres'

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS rankings (
      id        SERIAL PRIMARY KEY,
      nickname  VARCHAR(20) NOT NULL,
      profit    BIGINT NOT NULL,
      profit_rate DECIMAL(8,2) NOT NULL,
      final_value BIGINT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function insertRanking(nickname: string, profit: number, profitRate: number, finalValue: number) {
  await initDb()
  await sql`
    INSERT INTO rankings (nickname, profit, profit_rate, final_value)
    VALUES (${nickname}, ${profit}, ${profitRate}, ${finalValue})
  `
}

export async function getDailyRankings() {
  await initDb()
  const { rows } = await sql`
    SELECT nickname, profit, profit_rate, final_value, created_at
    FROM rankings
    WHERE created_at >= NOW() - INTERVAL '1 day'
    ORDER BY profit DESC
    LIMIT 50
  `
  return rows
}

export async function getWeeklyRankings() {
  await initDb()
  const { rows } = await sql`
    SELECT nickname, MAX(profit) as profit, MAX(profit_rate) as profit_rate,
           MAX(final_value) as final_value, MAX(created_at) as created_at
    FROM rankings
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY nickname
    ORDER BY profit DESC
    LIMIT 50
  `
  return rows
}
