export type StatusInfo = {
  label: string;
  description: string;
  color: 'yellow' | 'orange' | 'red' | 'green' | 'gray' | 'blue';
  emoji: string;
  isFinal?: boolean;
  isFailure?: boolean;
};

export const STATUS_MAP: Record<string, StatusInfo> = {
  CREATED:        { label: 'CREATED',        description: 'Сообщение создано',                            color: 'gray',   emoji: '📝' },
  PACKED:         { label: 'PACKED',         description: 'Письмо закреплено',                            color: 'gray',   emoji: '📦' },
  BUG_ASSIGNED:   { label: 'BUG_ASSIGNED',   description: 'Назначен таракан-курьер',                      color: 'yellow', emoji: '🪳' },
  TAKEOFF:        { label: 'TAKEOFF',        description: 'Таракан взлетел и взял курс. Удачного полёта!', color: 'blue',   emoji: '🚀' },
  IN_ROUTE:       { label: 'IN_ROUTE',       description: 'Таракан в пути',                               color: 'blue',   emoji: '✈️' },
  KITCHEN_DELAY:  { label: 'KITCHEN_DELAY',  description: 'Задержка на кухне',                            color: 'orange', emoji: '🍞' },
  CAT_DETECTED:   { label: 'CAT_DETECTED',   description: 'Замечен кот на маршруте. Идём в обход.',       color: 'orange', emoji: '🐱' },
  SLIPPER_DANGER: { label: 'SLIPPER_DANGER', description: 'Обнаружена угроза тапком. Манёвр уклонения!',  color: 'red',    emoji: '🥿' },
  WINDOW_BLOCKED: { label: 'WINDOW_BLOCKED', description: 'Закрыта форточка',                             color: 'orange', emoji: '🪟' },
  LOST_SIGNAL:    { label: 'LOST_SIGNAL',    description: 'Таракан ушёл за холодильник',                  color: 'gray',   emoji: '📡' },
  DELIVERED:      { label: 'DELIVERED',      description: 'Сообщение доставлено. Миссия выполнена!',     color: 'green',  emoji: '✅', isFinal: true },
  FAILED:         { label: 'FAILED',         description: 'Миссия провалена',                             color: 'red',    emoji: '❌', isFinal: true, isFailure: true },
  EATEN:          { label: 'EATEN',          description: 'Курьер съеден',                                color: 'red',    emoji: '😿', isFinal: true, isFailure: true },
  HERO_STATUS:    { label: 'HERO_STATUS',    description: 'Таракан погиб геройски',                       color: 'orange', emoji: '🎖️', isFinal: true, isFailure: true },
};

export function statusInfo(s: string): StatusInfo {
  return STATUS_MAP[s] ?? { label: s, description: s, color: 'gray', emoji: '•' };
}
