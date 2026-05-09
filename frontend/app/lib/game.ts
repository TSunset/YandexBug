// Клиент API мини-игры BugRunner.

export type ScoreEntry = {
  user_id: string;
  username: string;
  display_name: string;
  score: number;
  level: number;
  played_at: string;
};

export type PersonalBest = {
  score: number;
  level: number;
};

const apiBase = (): string => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return base.replace(/\/$/, '');
};

async function jsonOrThrow<T>(r: Response): Promise<T> {
  const text = await r.text();
  if (!r.ok) {
    let msg = text;
    try { msg = JSON.parse(text).error || text; } catch {}
    throw new Error(msg || `HTTP ${r.status}`);
  }
  return text ? JSON.parse(text) : ({} as T);
}

export async function fetchLeaderboard(limit = 10): Promise<ScoreEntry[]> {
  const r = await fetch(`${apiBase()}/game/leaderboard?limit=${limit}`, {
    credentials: 'include',
  });
  return jsonOrThrow<ScoreEntry[]>(r);
}

export async function submitScore(score: number, level: number): Promise<void> {
  const r = await fetch(`${apiBase()}/game/scores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ score, level }),
  });
  await jsonOrThrow(r);
}

export async function fetchPersonalBest(): Promise<PersonalBest> {
  const r = await fetch(`${apiBase()}/game/me`, {
    credentials: 'include',
  });
  return jsonOrThrow<PersonalBest>(r);
}
