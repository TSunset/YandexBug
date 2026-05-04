'use client';

import { useEffect, useRef, useCallback } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface Props {
  onAuth: (data: TelegramUser) => void;
  botUsername: string;
}

export default function TelegramLoginButton({ onAuth, botUsername }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const stableOnAuth = useCallback(onAuth, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ref.current || !botUsername) return;

    // Attach callback to window so Telegram widget can call it
    (window as unknown as Record<string, unknown>).onTelegramAuth = stableOnAuth;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    ref.current.innerHTML = '';
    ref.current.appendChild(script);

    return () => {
      delete (window as unknown as Record<string, unknown>).onTelegramAuth;
    };
  }, [stableOnAuth, botUsername]);

  if (!botUsername) return null;

  return <div ref={ref} className="flex justify-center" />;
}
