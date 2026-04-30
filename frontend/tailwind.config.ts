import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          yellow: '#FFCE2E',
          yellowDark: '#F2B900',
          black: '#0A0A0A',
          gray: {
            50: '#FAFAFA',
            100: '#F4F4F4',
            200: '#E8E8E8',
            300: '#D1D1D1',
            500: '#7A7A7A',
            700: '#3A3A3A',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        cardHover: '0 4px 8px rgba(0,0,0,0.06), 0 12px 24px rgba(0,0,0,0.08)',
        popular: '0 0 0 2px #FFCE2E, 0 8px 24px rgba(255,206,46,0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
