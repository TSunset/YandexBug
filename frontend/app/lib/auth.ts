// Клиент авторизации. Все запросы идут с credentials: 'include' чтобы JWT-cookie
// отправлялась на бэкенд (CORS + AllowCredentials уже разрешены на бэке для localhost).

export type User = {
  id: string;
  username: string;
  email?: string;
  display_name: string;
  telegram_chat_id?: number;
  telegram_username?: string;
  avatar_url?: string;
  created_at: string;
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

export async function register(input: { username: string; password: string; display_name?: string; email?: string }): Promise<User> {
  const r = await fetch(apiBase() + '/auth/register', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return jsonOrThrow<User>(r);
}

export async function login(input: { username: string; password: string }): Promise<User> {
  const r = await fetch(apiBase() + '/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return jsonOrThrow<User>(r);
}

export async function logout(): Promise<void> {
  await fetch(apiBase() + '/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export async function me(): Promise<User | null> {
  const r = await fetch(apiBase() + '/auth/me', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (r.status === 401) return null;
  return jsonOrThrow<User>(r);
}

// telegramAuthCallback — вызывается виджетом Telegram Login.
// Бэкенд проверяет hash и логинит/создаёт пользователя.
export async function telegramAuth(payload: Record<string, string | number>): Promise<User> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    params.set(k, String(v));
  }
  const r = await fetch(apiBase() + '/auth/telegram?' + params.toString(), {
    credentials: 'include',
  });
  return jsonOrThrow<User>(r);
}

// Получатель: поиск пользователя сайта или Telegram-юзера по handle.
export type LookupResult = {
  kind: 'site_user' | 'telegram_user';
  handle: string;
  display_name: string;
  user_id?: string;
  telegram_chat_id?: number;
  has_telegram: boolean;
  avatar_url?: string;
};

export async function lookupRecipient(handle: string): Promise<LookupResult | null> {
  const cleaned = handle.replace(/^@/, '').trim();
  if (!cleaned) return null;
  const r = await fetch(apiBase() + '/users/lookup/' + encodeURIComponent(cleaned), {
    credentials: 'include',
  });
  if (r.status === 404) return null;
  return jsonOrThrow<LookupResult>(r);
}

// Inbox.
export type InboxMessage = {
  id: string;
  recipient_user_id: string;
  delivery_id?: string;
  sender_display: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export async function getInbox(): Promise<{ messages: InboxMessage[]; unread_count: number }> {
  const r = await fetch(apiBase() + '/inbox', {
    credentials: 'include',
    cache: 'no-store',
  });
  return jsonOrThrow(r);
}

export async function markRead(id: string): Promise<void> {
  await fetch(apiBase() + `/inbox/${id}/read`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function getUnreadCount(): Promise<number> {
  const r = await fetch(apiBase() + '/inbox/unread-count', {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!r.ok) return 0;
  const data = await r.json();
  return data.unread_count || 0;
}
