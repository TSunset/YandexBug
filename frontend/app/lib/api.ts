export type Tariff = {
  code: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  is_popular: boolean;
  success_rate: number;
};

export type Delivery = {
  id: string;
  sender_name?: string;
  recipient_address: string;
  message: string;
  tariff: string;
  bug_name?: string;
  bug_class?: string;
  status: string;
  eta_minutes: number;
  threats: string[];
  priority: string;
  notify_channel: string;
  created_at: string;
  updated_at: string;
  finished_at?: string;
};

export type CreateDeliveryInput = {
  sender_name?: string;
  recipient_address: string;
  message: string;
  tariff: string;
  priority?: string;
  notify_channel?: string;
};

const apiUrl = (path: string): string => {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  return base.replace(/\/$/, '') + path;
};

export async function listTariffs(): Promise<Tariff[]> {
  const r = await fetch(apiUrl('/tariffs'), { cache: 'no-store' });
  if (!r.ok) throw new Error('failed to fetch tariffs');
  return r.json();
}

export async function createDelivery(input: CreateDeliveryInput): Promise<Delivery> {
  const r = await fetch(apiUrl('/deliveries'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const text = await r.text();
  if (!r.ok) {
    let msg = text;
    try {
      const parsed = JSON.parse(text);
      msg = parsed.error || text;
    } catch {}
    throw new Error(msg || 'request failed');
  }
  return JSON.parse(text);
}

export async function getDelivery(id: string): Promise<Delivery> {
  const r = await fetch(apiUrl(`/deliveries/${id}`), { cache: 'no-store' });
  if (!r.ok) throw new Error('not found');
  return r.json();
}

export async function listRecentDeliveries(limit = 20): Promise<Delivery[]> {
  const r = await fetch(apiUrl(`/deliveries?limit=${limit}`), { cache: 'no-store' });
  if (!r.ok) throw new Error('failed to fetch deliveries');
  return r.json();
}
