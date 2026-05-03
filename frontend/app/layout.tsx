import type { Metadata } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';

// Display-шрифт: Bricolage Grotesque — переменный, с характерными глифами,
// гораздо интереснее общеупотребимых Inter/Roboto.
const display = Bricolage_Grotesque({
  subsets: ['latin', 'cyrillic-ext'],
  variable: '--font-display',
  display: 'swap',
});

// Моноширинный — JetBrains Mono для технологичной "терминальной" типографики.
const mono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'YandexBug // OFFLINE-MAIL.PROTOCOL',
  description:
    'YandexBug — сервис офлайн-доставки сообщений по городу с помощью летающих тараканов во время отключений интернета.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${mono.variable}`}>
      <body className="font-sans bg-ink-900 text-ink-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
