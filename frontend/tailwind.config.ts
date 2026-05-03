import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Тёмный пост-апокалиптический cyberpunk: основа — графит,
        // акцент — ядовито-жёлтый "тревожной ленты", вторичный — токсичный лайм для терминала.
        ink: {
          0:   '#000000',
          900: '#08080a',  // фон
          850: '#0d0d10',  // подложка
          800: '#15151a',  // карточки
          700: '#1f1f26',  // карточки hover
          600: '#2a2a33',  // границы
          500: '#3d3d4a',
          400: '#5b5b6b',
          300: '#8a8a99',  // приглушённый текст
          200: '#b8b8c4',
          100: '#e6e6ed',  // основной текст
          50:  '#f5f5f8',
        },
        toxic: {
          DEFAULT: '#ECE81A',  // основной акцент — ядовито-жёлтый
          dim:     '#c9c615',
          glow:    '#fffcc4',
        },
        terminal: {
          DEFAULT: '#7CFFB2',  // зелёный терминальный для статусов "ok"
          dim:     '#43b97a',
        },
        danger: {
          DEFAULT: '#ff4d6d',
          dim:     '#cc3852',
        },
      },
      fontFamily: {
        sans:    ['var(--font-display)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        // Резкий смещённый shadow — "хард" эстетика брутализма.
        brutal:    '6px 6px 0 0 #ECE81A',
        brutalSm:  '3px 3px 0 0 #ECE81A',
        brutalInk: '4px 4px 0 0 #08080a',
        glow:      '0 0 32px rgba(236,232,26,0.35), 0 0 4px rgba(236,232,26,0.6)',
        glowSoft:  '0 0 60px rgba(236,232,26,0.18)',
        innerLine: 'inset 0 0 0 1px rgba(236,232,26,0.25)',
      },
      letterSpacing: {
        'tightest': '-0.04em',
      },
      animation: {
        'flicker':  'flicker 4s infinite',
        'scanline': 'scanline 8s linear infinite',
        'cursor':   'cursor 1s steps(1) infinite',
      },
      keyframes: {
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '1' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.55' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        cursor: {
          '0%, 50%':  { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
