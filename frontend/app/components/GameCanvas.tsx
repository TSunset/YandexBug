'use client';

// BugRunner — мини-игра в стиле Pac-Man.
// Таракан собирает крошки, носит письма по одному в почтовый ящик,
// убегает от котов и тапок (с предупреждением). 5 уровней, у каждого свой лабиринт.

import { useCallback, useEffect, useRef, useState } from 'react';
import { submitScore } from '../lib/game';

// ─── РАЗМЕРЫ КАРТЫ ─────────────────────────────────────────────────────
// Все 5 лабиринтов 21×15. Симметричны по горизонтали для эстетики.
const COLS = 21;
const ROWS = 15;

// Тоннель — горизонтальная полоса где можно завернуть с края на край.
const TUNNEL_ROW = 7;

// 5 лабиринтов. Каждая строка — ровно 21 символ. '#' стена, '.' крошка.
// Дизайн-инвариант: ряды 1, 7, 13 и колонки 1, 19 всегда полностью открыты —
// формируют гарантированный периметр-кольцо. Внутренние стены могут варьироваться.
// Тоннель: ряд 7 + переход с края на край (см. canStepFrom).
const MAZES: string[][] = [
  // 1 — классические блоки
  [
    '#####################',
    '#...................#',
    '#.###.#####.#####.#.#',
    '#...................#',
    '#.#.###.#.#.#.###.#.#',
    '#.....#.....#.......#',
    '#.#.#.#####.#####.#.#',
    '#...................#',
    '#.#.#.#####.#####.#.#',
    '#.....#.....#.......#',
    '#.#.###.#.#.#.###.#.#',
    '#...................#',
    '#.###.#####.#####.#.#',
    '#...................#',
    '#####################',
  ],
  // 2 — вертикальные ребра
  [
    '#####################',
    '#...................#',
    '#.#.#.###.#.###.#.#.#',
    '#...................#',
    '#.###.#.#####.#.###.#',
    '#.....#.......#.....#',
    '#.#.###.#.#.###.#.#.#',
    '#...................#',
    '#.#.###.#.#.###.#.#.#',
    '#.....#.......#.....#',
    '#.###.#.#####.#.###.#',
    '#...................#',
    '#.#.#.###.#.###.#.#.#',
    '#...................#',
    '#####################',
  ],
  // 3 — рамки
  [
    '#####################',
    '#...................#',
    '#.#####.#.#.#.#####.#',
    '#...................#',
    '#.#.###.#####.###.#.#',
    '#...#.....#.....#...#',
    '#.#.#.###.#.###.#.#.#',
    '#...................#',
    '#.#.#.###.#.###.#.#.#',
    '#...#.....#.....#...#',
    '#.#.###.#####.###.#.#',
    '#...................#',
    '#.#####.#.#.#.#####.#',
    '#...................#',
    '#####################',
  ],
  // 4 — рассеянные пилоны
  [
    '#####################',
    '#...................#',
    '#.##.##.#.#.#.##.##.#',
    '#...................#',
    '#.....#.......#.....#',
    '#.###.#.#####.#.###.#',
    '#.#...#...#...#...#.#',
    '#...................#',
    '#.#...#...#...#...#.#',
    '#.###.#.#####.#.###.#',
    '#.....#.......#.....#',
    '#...................#',
    '#.##.##.#.#.#.##.##.#',
    '#...................#',
    '#####################',
  ],
  // 5 — финальный, плотный
  [
    '#####################',
    '#...................#',
    '#.#.#.#.#.#.#.#.#.#.#',
    '#...................#',
    '#.###.#####.#####.#.#',
    '#.#.....#.....#...#.#',
    '#.#.#####.###.#####.#',
    '#...................#',
    '#.#####.###.#####.#.#',
    '#.#...#.....#.....#.#',
    '#.#.#####.#####.###.#',
    '#...................#',
    '#.#.#.#.#.#.#.#.#.#.#',
    '#...................#',
    '#####################',
  ],
];

const PLAYER_START = { x: 10, y: 11 };
const MAILBOX = { x: 10, y: 1 };

// Валидация: размеры + достижимость почты от старта.
(function validate() {
  for (let m = 0; m < MAZES.length; m++) {
    if (MAZES[m].length !== ROWS) {
      throw new Error(`Maze ${m} has ${MAZES[m].length} rows, expected ${ROWS}`);
    }
    for (let y = 0; y < ROWS; y++) {
      if (MAZES[m][y].length !== COLS) {
        // eslint-disable-next-line no-console
        console.warn(`Maze ${m} row ${y} length=${MAZES[m][y].length}, padding to ${COLS}`);
        MAZES[m][y] = (MAZES[m][y] + '.'.repeat(COLS)).slice(0, COLS);
      }
    }
    if (MAZES[m][PLAYER_START.y][PLAYER_START.x] === '#') {
      throw new Error(`Maze ${m}: player start is a wall`);
    }
    if (MAZES[m][MAILBOX.y][MAILBOX.x] === '#') {
      throw new Error(`Maze ${m}: mailbox is a wall`);
    }
    const reachable = bfsReachable(MAZES[m], PLAYER_START.x, PLAYER_START.y);
    if (!reachable.has(`${MAILBOX.x},${MAILBOX.y}`)) {
      throw new Error(`Maze ${m}: mailbox unreachable from player start`);
    }
  }
})();

function bfsReachable(maze: string[], sx: number, sy: number): Set<string> {
  const visited = new Set<string>();
  const queue: [number, number][] = [[sx, sy]];
  visited.add(`${sx},${sy}`);
  while (queue.length) {
    const [x, y] = queue.shift()!;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      let nx = x + dx; const ny = y + dy;
      if (ny === TUNNEL_ROW && nx < 0) nx = COLS - 1;
      else if (ny === TUNNEL_ROW && nx >= COLS) nx = 0;
      if (ny < 0 || ny >= ROWS) continue;
      if (nx < 0 || nx >= COLS) continue;
      if (maze[ny][nx] === '#') continue;
      const k = `${nx},${ny}`;
      if (visited.has(k)) continue;
      visited.add(k);
      queue.push([nx, ny]);
    }
  }
  return visited;
}

// 4 точки спавна для котов (в зоне центрального тоннеля).
// Игра возьмёт первые N штук в зависимости от уровня.
const CAT_SPAWN_POINTS: { x: number; y: number }[] = [
  { x: 6, y: 7 },
  { x: 14, y: 7 },
  { x: 10, y: 5 },
  { x: 10, y: 9 },
  { x: 8, y: 7 },
];

// Очки
const POINTS_CRUMB = 10;
const POINTS_LETTER = 50;
const POINTS_DELIVERY = 200;
const POINTS_LEVEL_BONUS = 1000;

const MAX_LEVEL = 5;

// Параметры по уровню. Тапок: count = level + 1.
type LevelConfig = { cats: number; slipperPeriod: [number, number]; catSpeed: number; playerSpeed: number; slipperCount: number };
const LEVELS: LevelConfig[] = [
  { cats: 2, slipperPeriod: [3500, 5500], catSpeed: 4.0, playerSpeed: 5.6, slipperCount: 2 },
  { cats: 3, slipperPeriod: [3000, 5000], catSpeed: 4.4, playerSpeed: 5.6, slipperCount: 3 },
  { cats: 4, slipperPeriod: [2500, 4500], catSpeed: 4.7, playerSpeed: 5.7, slipperCount: 4 },
  { cats: 4, slipperPeriod: [2000, 3500], catSpeed: 5.0, playerSpeed: 5.7, slipperCount: 5 },
  { cats: 5, slipperPeriod: [1500, 3000], catSpeed: 5.3, playerSpeed: 5.8, slipperCount: 6 },
];
const levelConfig = (n: number): LevelConfig => LEVELS[Math.max(0, Math.min(n - 1, LEVELS.length - 1))];
const mazeForLevel = (n: number): string[] => MAZES[Math.max(0, Math.min(n - 1, MAZES.length - 1))];

type Dir = 0 | 1 | 2 | 3; // 0=right, 1=down, 2=left, 3=up
const DX: Record<Dir, number> = { 0: 1, 1: 0, 2: -1, 3: 0 };
const DY: Record<Dir, number> = { 0: 0, 1: 1, 2: 0, 3: -1 };

type Cell = { x: number; y: number };

type Mover = {
  x: number; y: number;
  dir: Dir;
  nextDir: Dir | null;
  speed: number;
};

type Slipper =
  | { phase: 'idle'; nextAt: number }
  | { phase: 'warning'; at: Cell; until: number }
  | { phase: 'strike'; at: Cell; until: number };

type GameStatus = 'idle' | 'playing' | 'dying' | 'levelClear' | 'gameOver' | 'victory';

type State = {
  status: GameStatus;
  level: number;
  score: number;
  scoreAtLevelStart: number;
  lives: number;
  player: Mover;
  cats: Mover[];
  crumbs: Set<string>;
  letters: Cell[];
  carryingLetter: boolean;
  lettersDelivered: number; // на текущем уровне
  mailboxPulse: number;
  slippers: Slipper[];
  statusTimer: number;
  lastTime: number;
  scoreSubmitted: boolean;
};

const cellKey = (x: number, y: number) => `${x},${y}`;

function isWall(maze: string[], x: number, y: number): boolean {
  if (y < 0 || y >= ROWS) return true;
  if (x < 0 || x >= COLS) return false; // tunnel wrap
  return maze[y][x] === '#';
}
function cellChar(maze: string[], x: number, y: number): string {
  if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return '#';
  return maze[y][x];
}

interface Props {
  loggedIn: boolean;
  onScoreSaved?: () => void;
}

export default function GameCanvas({ loggedIn, onScoreSaved }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<State>(initialState());
  const tileRef = useRef(28);
  const rafRef = useRef<number | null>(null);

  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1, carrying: false, delivered: 0, status: 'idle' as GameStatus });

  const start = useCallback(() => {
    stateRef.current = initialState();
    stateRef.current.status = 'playing';
    stateRef.current.lastTime = performance.now();
    setHud({ score: 0, lives: 3, level: 1, carrying: false, delivered: 0, status: 'playing' });
  }, []);

  // Resize канвас под контейнер
  useEffect(() => {
    const onResize = () => {
      if (!wrapRef.current || !canvasRef.current) return;
      const w = wrapRef.current.clientWidth;
      const tile = Math.max(14, Math.min(36, Math.floor(w / COLS)));
      tileRef.current = tile;
      canvasRef.current.width = COLS * tile;
      canvasRef.current.height = ROWS * tile;
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Клавиатура
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const dir = keyToDir(k);
      if (dir != null) {
        stateRef.current.player.nextDir = dir;
        e.preventDefault();
      }
      if (k === ' ' || k === 'enter') {
        const st = stateRef.current.status;
        if (st === 'idle' || st === 'gameOver' || st === 'victory') start();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [start]);

  // Игровой цикл
  useEffect(() => {
    const tick = (t: number) => {
      const s = stateRef.current;
      const dt = Math.min(0.05, (t - s.lastTime) / 1000);
      s.lastTime = t;

      if (s.status === 'playing') {
        update(s, dt, t);
      } else if (s.status === 'dying' || s.status === 'levelClear') {
        s.statusTimer -= dt * 1000;
        if (s.statusTimer <= 0) {
          if (s.status === 'dying') {
            if (s.lives <= 0) {
              s.status = 'gameOver';
              if (loggedIn && !s.scoreSubmitted) {
                s.scoreSubmitted = true;
                submitScore(s.score, s.level).then(() => onScoreSaved?.()).catch(() => {});
              }
            } else {
              respawn(s);
              s.status = 'playing';
            }
          } else if (s.status === 'levelClear') {
            if (s.level >= MAX_LEVEL) {
              s.status = 'victory';
              if (loggedIn && !s.scoreSubmitted) {
                s.scoreSubmitted = true;
                submitScore(s.score, s.level).then(() => onScoreSaved?.()).catch(() => {});
              }
            } else {
              s.level += 1;
              s.scoreAtLevelStart = s.score;
              resetLevel(s);
              s.status = 'playing';
            }
          }
        }
      }

      draw(canvasRef.current, s, tileRef.current, t);

      const cur = {
        score: s.score,
        lives: s.lives,
        level: s.level,
        carrying: s.carryingLetter,
        delivered: s.lettersDelivered,
        status: s.status,
      };
      setHud((prev) =>
        prev.score === cur.score && prev.lives === cur.lives && prev.level === cur.level
          && prev.carrying === cur.carrying && prev.delivered === cur.delivered && prev.status === cur.status ? prev : cur);

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [loggedIn, onScoreSaved]);

  const joystick = useJoystick((dir) => {
    if (dir != null) stateRef.current.player.nextDir = dir;
  });

  const status = hud.status;

  return (
    <div className="w-full">
      {/* HUD над канвасом — не перекрывает карту на мобилках */}
      <div className="flex justify-between items-start font-mono text-xs flex-wrap gap-1 mb-1">
        <div className="bg-ink-900/85 border border-toxic px-3 py-1.5 text-toxic">
          SCORE: <span className="text-ink-100 font-bold">{hud.score}</span>
        </div>
        <div className="bg-ink-900/85 border border-ink-600 px-3 py-1.5 text-ink-200">
          LVL <span className="text-toxic font-bold">{hud.level}/{MAX_LEVEL}</span>
          {' · '}
          <span className="text-danger font-bold">{'♥'.repeat(Math.max(0, hud.lives))}</span>
        </div>
        <div className="bg-ink-900/85 border border-ink-600 px-3 py-1.5 text-ink-200">
          ✉ <span className="text-toxic font-bold">{hud.delivered}/3</span>
          {hud.carrying && <span className="text-toxic ml-2">[несёт]</span>}
        </div>
      </div>

    <div ref={wrapRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className="block w-full bg-ink-950 border border-ink-600"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Стартовый экран / Game Over / Victory */}
      {(status === 'idle' || status === 'gameOver' || status === 'victory') && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm">
          <div className="bg-ink-850 border-2 border-toxic corners p-6 text-center max-w-sm">
            <span className="corner-tl" /><span className="corner-br" />
            <div className="font-display font-extrabold text-3xl text-ink-100 mb-2">
              {status === 'idle' ? 'BUG_RUNNER' : status === 'victory' ? 'YOU WIN' : 'GAME OVER'}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-toxic mb-4">
              {status === 'idle'
                ? '[ READY ]'
                : status === 'victory'
                  ? `[ ALL ${MAX_LEVEL} CLEARED · ${hud.score} pts ]`
                  : `[ FINAL: ${hud.score} pts · LVL ${hud.level} ]`}
            </div>
            <p className="font-mono text-xs text-ink-300 mb-5 leading-relaxed">
              {status === 'idle'
                ? 'Стрелки или WASD. Подбери письмо ✉ → отнеси в 📬 → 3 раза за уровень. Беги от котов и смотри под лапы — тапки!'
                : status === 'victory'
                  ? 'Все 5 уровней пройдены. Таракан-чемпион.'
                  : 'Очки сохранены, если ты залогинен.'}
            </p>
            <button onClick={start} className="btn-brutal w-full justify-center">
              {status === 'idle' ? '▶ START' : '↻ RETRY'}
            </button>
            {!loggedIn && (status === 'gameOver' || status === 'victory') && (
              <div className="mt-3 text-[10px] text-ink-400 font-mono">
                Войди в аккаунт чтобы попасть в лидерборд
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'levelClear' && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/70 backdrop-blur-sm pointer-events-none">
          <div className="bg-ink-850 border-2 border-terminal px-6 py-4 text-center">
            <div className="font-display font-extrabold text-2xl text-terminal">LEVEL {hud.level} CLEAR</div>
            <div className="font-mono text-xs text-ink-300 mt-1">
              {hud.level >= MAX_LEVEL ? 'победа…' : `следующий лабиринт →`}
            </div>
          </div>
        </div>
      )}

      {status === 'dying' && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink-900/60 pointer-events-none">
          <div className="bg-ink-850 border-2 border-danger px-6 py-4 text-center">
            <div className="font-display font-extrabold text-2xl text-danger">SQUASHED</div>
            <div className="font-mono text-xs text-ink-300 mt-1">−1 жизнь · очки уровня сброшены</div>
          </div>
        </div>
      )}

    </div>

      {/* Виртуальный D-pad для мобилок */}
      {status === 'playing' && (
        <div className="lg:hidden mt-4 select-none">
          {joystick}
        </div>
      )}
    </div>
  );
}

// ─── ИГРОВАЯ ЛОГИКА ─────────────────────────────────────────────────────

function initialState(): State {
  const cfg = levelConfig(1);
  const s: State = {
    status: 'idle',
    level: 1,
    score: 0,
    scoreAtLevelStart: 0,
    lives: 3,
    player: { x: PLAYER_START.x, y: PLAYER_START.y, dir: 2, nextDir: null, speed: cfg.playerSpeed },
    cats: [],
    crumbs: new Set(),
    letters: [],
    carryingLetter: false,
    lettersDelivered: 0,
    mailboxPulse: 0,
    slippers: [],
    statusTimer: 0,
    lastTime: 0,
    scoreSubmitted: false,
  };
  resetLevel(s);
  return s;
}

function resetLevel(s: State) {
  const cfg = levelConfig(s.level);
  const maze = mazeForLevel(s.level);

  // crumbs во всех точках карты
  s.crumbs = new Set();
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (maze[y][x] === '.') s.crumbs.add(cellKey(x, y));
    }
  }

  s.letters = pickLetterCells(maze, 3);
  s.carryingLetter = false;
  s.lettersDelivered = 0;

  s.player = { x: PLAYER_START.x, y: PLAYER_START.y, dir: 2, nextDir: null, speed: cfg.playerSpeed };
  s.cats = [];
  for (let i = 0; i < cfg.cats; i++) {
    const sp = CAT_SPAWN_POINTS[i % CAT_SPAWN_POINTS.length];
    s.cats.push({
      x: sp.x, y: sp.y,
      dir: (i % 2 === 0 ? 0 : 2) as Dir,
      nextDir: null,
      speed: cfg.catSpeed,
    });
  }

  s.slippers = [];
  for (let i = 0; i < cfg.slipperCount; i++) {
    s.slippers.push({ phase: 'idle', nextAt: performance.now() + rand(...cfg.slipperPeriod) + i * 400 });
  }
}

function respawn(s: State) {
  s.score = s.scoreAtLevelStart;
  // Не сбрасываем доставленные письма / крошки — иначе совсем больно.
  // Но если несли письмо — возвращаем его на карту, иначе уровень станет непроходимым.
  if (s.carryingLetter) {
    const maze = mazeForLevel(s.level);
    const restored = pickLetterCells(maze, 1);
    if (restored.length > 0) s.letters.push(restored[0]);
  }
  s.player.x = PLAYER_START.x; s.player.y = PLAYER_START.y;
  s.player.dir = 2; s.player.nextDir = null;
  s.cats.forEach((c, i) => {
    const sp = CAT_SPAWN_POINTS[i % CAT_SPAWN_POINTS.length];
    c.x = sp.x; c.y = sp.y;
    c.dir = (i % 2 === 0 ? 0 : 2) as Dir;
    c.nextDir = null;
  });
  s.carryingLetter = false;
}

function pickLetterCells(maze: string[], n: number): Cell[] {
  const candidates: Cell[] = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    // Только '.' клетки — не пустоты тоннеля, не стены.
    if (maze[y][x] !== '.') continue;
    // Не в верхних 3 строках (рядом с почтовым ящиком и верхним краем).
    // Не в нижних 2 строках (рядом со стартом игрока).
    if (y < 3 || y > ROWS - 3) continue;
    // Не на старте игрока, не на ящике
    if (x === PLAYER_START.x && y === PLAYER_START.y) continue;
    if (x === MAILBOX.x && y === MAILBOX.y) continue;
    // Не слишком близко к ящику (минимум 5 клеток по манхэттену)
    if (Math.abs(x - MAILBOX.x) + Math.abs(y - MAILBOX.y) < 5) continue;
    candidates.push({ x, y });
  }
  const out: Cell[] = [];
  for (let i = 0; i < n && candidates.length > 0; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    out.push(candidates[idx]);
    candidates.splice(idx, 1);
  }
  return out;
}

function pickRandomDot(maze: string[]): Cell {
  // Случайная клетка-крошка для удара тапка.
  const candidates: Cell[] = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    if (maze[y][x] === '.') candidates.push({ x, y });
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function update(s: State, dt: number, now: number) {
  const cfg = levelConfig(s.level);
  const maze = mazeForLevel(s.level);

  moveMover(maze, s.player, dt);

  for (const c of s.cats) {
    if (atCenter(c)) {
      c.dir = chooseCatDir(maze, c, s.player);
    }
    moveMover(maze, c, dt);
  }

  const px = Math.round(s.player.x);
  const py = Math.round(s.player.y);

  const ck = cellKey(px, py);
  if (s.crumbs.has(ck)) {
    s.crumbs.delete(ck);
    s.score += POINTS_CRUMB;
  }

  // Подбор письма — только если ничего не несёт.
  if (!s.carryingLetter) {
    for (let i = s.letters.length - 1; i >= 0; i--) {
      if (s.letters[i].x === px && s.letters[i].y === py) {
        s.letters.splice(i, 1);
        s.carryingLetter = true;
        s.score += POINTS_LETTER;
        break;
      }
    }
  }

  // Доставка
  if (s.carryingLetter && px === MAILBOX.x && py === MAILBOX.y) {
    s.score += POINTS_DELIVERY;
    s.carryingLetter = false;
    s.lettersDelivered += 1;
    s.mailboxPulse = 1.0;
  }
  if (s.mailboxPulse > 0) s.mailboxPulse = Math.max(0, s.mailboxPulse - dt * 2);

  // Тапки — независимые слоты
  for (let i = 0; i < s.slippers.length; i++) {
    const sl = s.slippers[i];
    switch (sl.phase) {
      case 'idle':
        if (now >= sl.nextAt) {
          s.slippers[i] = { phase: 'warning', at: pickRandomDot(maze), until: now + 1500 };
        }
        break;
      case 'warning':
        if (now >= sl.until) {
          s.slippers[i] = { phase: 'strike', at: sl.at, until: now + 350 };
        }
        break;
      case 'strike':
        if (now >= sl.until) {
          s.slippers[i] = { phase: 'idle', nextAt: now + rand(...cfg.slipperPeriod) };
        }
        break;
    }
  }

  // Коллизии с котами
  for (const c of s.cats) {
    const d = Math.abs(c.x - s.player.x) + Math.abs(c.y - s.player.y);
    if (d < 0.6) { kill(s); return; }
  }
  // Тапок попал
  for (const sl of s.slippers) {
    if (sl.phase === 'strike' && sl.at.x === px && sl.at.y === py) { kill(s); return; }
  }

  // Уровень пройден когда все 3 письма доставлены
  if (s.lettersDelivered >= 3) {
    s.status = 'levelClear';
    s.statusTimer = 1500;
    s.score += POINTS_LEVEL_BONUS;
  }
}

function kill(s: State) {
  s.lives -= 1;
  s.status = 'dying';
  s.statusTimer = 1200;
}

function moveMover(maze: string[], m: Mover, dt: number) {
  if (atCenter(m)) {
    const cx = Math.round(m.x); const cy = Math.round(m.y);
    if (m.nextDir != null && canStepFrom(maze, cx, cy, m.nextDir)) {
      m.dir = m.nextDir;
      m.nextDir = null;
    }
    if (!canStepFrom(maze, cx, cy, m.dir)) return;
  }

  const dx = DX[m.dir]; const dy = DY[m.dir];
  m.x += dx * m.speed * dt;
  m.y += dy * m.speed * dt;

  // При высокой скорости мувер может перескочить центр клетки без проверки стены.
  // Если после шага rounded-позиция упирается в стену — сбрасываем на центр клетки.
  const ncx = Math.round(m.x); const ncy = Math.round(m.y);
  if (!canStepFrom(maze, ncx, ncy, m.dir)) {
    m.x = ncx; m.y = ncy;
  }

  // выравнивание по другой оси
  if (dx !== 0) {
    const ty = Math.round(m.y);
    if (Math.abs(m.y - ty) < 0.05) m.y = ty;
    else m.y += Math.sign(ty - m.y) * Math.min(m.speed * dt, Math.abs(ty - m.y));
  } else if (dy !== 0) {
    const tx = Math.round(m.x);
    if (Math.abs(m.x - tx) < 0.05) m.x = tx;
    else m.x += Math.sign(tx - m.x) * Math.min(m.speed * dt, Math.abs(tx - m.x));
  }

  // Тоннель
  if (Math.round(m.y) === TUNNEL_ROW) {
    if (m.x < -0.5) m.x = COLS - 0.5;
    else if (m.x > COLS - 0.5) m.x = -0.5;
  }
}

function atCenter(m: Mover): boolean {
  return Math.abs(m.x - Math.round(m.x)) < 0.06 && Math.abs(m.y - Math.round(m.y)) < 0.06;
}

function canStepFrom(maze: string[], cx: number, cy: number, dir: Dir): boolean {
  const nx = cx + DX[dir]; const ny = cy + DY[dir];
  if (cy === TUNNEL_ROW && (nx < 0 || nx >= COLS)) return true;
  if (ny < 0 || ny >= ROWS) return false;
  if (nx < 0 || nx >= COLS) return false;
  const cell = cellChar(maze, nx, ny);
  return cell !== '#';
}

function chooseCatDir(maze: string[], c: Mover, target: Mover): Dir {
  const cx = Math.round(c.x); const cy = Math.round(c.y);
  const opposite = ((c.dir + 2) % 4) as Dir;
  let best: Dir = c.dir;
  let bestDist = Infinity;
  for (let d = 0; d < 4; d++) {
    const dd = d as Dir;
    if (dd === opposite) continue;
    if (!canStepFrom(maze, cx, cy, dd)) continue;
    const nx = cx + DX[dd]; const ny = cy + DY[dd];
    const dist = (nx - target.x) ** 2 + (ny - target.y) ** 2;
    const noisy = dist + Math.random() * 0.4;
    if (noisy < bestDist) { bestDist = noisy; best = dd; }
  }
  // Если все направления заблокированы (включая обратное) — едем назад
  if (bestDist === Infinity) return opposite;
  return best;
}

function rand(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function keyToDir(k: string): Dir | null {
  switch (k) {
    case 'arrowright': case 'd': return 0;
    case 'arrowdown':  case 's': return 1;
    case 'arrowleft':  case 'a': return 2;
    case 'arrowup':    case 'w': return 3;
    default: return null;
  }
}

// ─── ОТРИСОВКА ──────────────────────────────────────────────────────────

function draw(canvas: HTMLCanvasElement | null, s: State, tile: number, t: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const maze = mazeForLevel(s.level);

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0c0c10';
  ctx.fillRect(0, 0, W, H);

  // Стены
  ctx.fillStyle = '#1a1a22';
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (maze[y][x] === '#') {
        ctx.fillRect(x * tile, y * tile, tile, tile);
        ctx.strokeStyle = 'rgba(236,232,26,0.35)';
        ctx.lineWidth = Math.max(1, Math.floor(tile * 0.07));
        ctx.strokeRect(x * tile + 1, y * tile + 1, tile - 2, tile - 2);
      }
    }
  }

  // Крошки
  ctx.fillStyle = '#a3a3a3';
  for (const k of s.crumbs) {
    const [xs, ys] = k.split(',');
    const x = Number(xs); const y = Number(ys);
    ctx.beginPath();
    ctx.arc(x * tile + tile / 2, y * tile + tile / 2, Math.max(1.5, tile * 0.08), 0, Math.PI * 2);
    ctx.fill();
  }

  // Почтовый ящик
  ctx.font = `${Math.floor(tile * 0.85)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (s.mailboxPulse > 0) {
    ctx.fillStyle = `rgba(236,232,26,${s.mailboxPulse * 0.5})`;
    ctx.fillRect(MAILBOX.x * tile, MAILBOX.y * tile, tile, tile);
  }
  ctx.fillText('📬', MAILBOX.x * tile + tile / 2, MAILBOX.y * tile + tile / 2 + 1);

  // Письма
  ctx.font = `${Math.floor(tile * 0.7)}px sans-serif`;
  for (const l of s.letters) {
    const dy = Math.sin(t / 250 + l.x + l.y) * tile * 0.08;
    ctx.fillText('✉️', l.x * tile + tile / 2, l.y * tile + tile / 2 + dy);
  }

  // Тапки: предупреждения / удары
  for (const sl of s.slippers) {
    if (sl.phase === 'warning') {
      const blink = Math.sin(t / 80) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255,77,77,${blink})`;
      ctx.beginPath();
      ctx.arc(sl.at.x * tile + tile / 2, sl.at.y * tile + tile / 2, tile * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff4d4d';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (sl.phase === 'strike') {
      ctx.font = `${Math.floor(tile * 1.1)}px sans-serif`;
      ctx.fillText('🥿', sl.at.x * tile + tile / 2, sl.at.y * tile + tile / 2);
    }
  }

  // Игрок
  ctx.font = `${Math.floor(tile * 0.9)}px sans-serif`;
  ctx.save();
  const px = s.player.x * tile + tile / 2;
  const py = s.player.y * tile + tile / 2;
  ctx.translate(px, py);
  const rot = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][s.player.dir];
  ctx.rotate(rot);
  ctx.fillText('🪳', 0, 1);
  ctx.restore();

  if (s.carryingLetter) {
    ctx.strokeStyle = `rgba(236,232,26,${0.5 + 0.3 * Math.sin(t / 200)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, tile * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    // Маленькая иконка письма над тараканом
    ctx.font = `${Math.floor(tile * 0.4)}px sans-serif`;
    ctx.fillText('✉', px, py - tile * 0.5);
  }

  // Коты
  ctx.font = `${Math.floor(tile * 0.85)}px sans-serif`;
  for (const c of s.cats) {
    const cx = c.x * tile + tile / 2;
    const cy = c.y * tile + tile / 2;
    ctx.fillText('🐈', cx, cy + 1);
  }

  if (s.status === 'dying') {
    ctx.fillStyle = 'rgba(255,77,77,0.15)';
    ctx.fillRect(0, 0, W, H);
  }
}

// ─── ВИРТУАЛЬНЫЙ D-PAD ─────────────────────────────────────────────────

function useJoystick(onDir: (d: Dir | null) => void): JSX.Element {
  const press = (d: Dir) => onDir(d);
  return (
    <div className="flex justify-center">
      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-44 h-44 select-none">
        <div />
        <PadButton label="▲" onPress={() => press(3)} />
        <div />
        <PadButton label="◀" onPress={() => press(2)} />
        <div className="bg-ink-850 border border-ink-600" />
        <PadButton label="▶" onPress={() => press(0)} />
        <div />
        <PadButton label="▼" onPress={() => press(1)} />
        <div />
      </div>
    </div>
  );
}

function PadButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onTouchStart={(e) => { e.preventDefault(); onPress(); }}
      onMouseDown={(e) => { e.preventDefault(); onPress(); }}
      className="bg-ink-850 border-2 border-toxic text-toxic font-mono text-xl flex items-center justify-center active:bg-toxic active:text-ink-900 transition"
    >
      {label}
    </button>
  );
}
