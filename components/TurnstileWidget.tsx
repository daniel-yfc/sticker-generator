import { useEffect, useRef } from 'react';

interface TurnstileWidgetProps {
  onToken: (token: string) => void;
  onExpire?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // fallback = always-pass test key

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({ onToken, onExpire }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const scriptId = 'cf-turnstile-script';

    function mount() {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return; // already mounted
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onToken(token),
        'expired-callback': () => {
          if (onExpire) onExpire();
        },
        theme: 'light',
        size: 'normal',
      });
    }

    if (window.turnstile) {
      mount();
    } else if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.onload = mount;
      document.head.appendChild(script);
    } else {
      // Script tag exists but not yet loaded — poll
      const interval = setInterval(() => {
        if (window.turnstile) { clearInterval(interval); mount(); }
      }, 100);
      return () => clearInterval(interval);
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="mt-2" />;
};

export default TurnstileWidget;
