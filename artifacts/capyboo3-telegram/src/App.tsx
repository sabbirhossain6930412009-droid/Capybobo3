import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  onEvent?: (
    eventType: 'viewportChanged',
    eventHandler: () => void,
  ) => void;
  offEvent?: (
    eventType: 'viewportChanged',
    eventHandler: () => void,
  ) => void;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

function Home() {
  const [showAirdropPage, setShowAirdropPage] = useState(false);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;
    telegram?.ready();
    telegram?.expand();

    const updateViewport = () => {
      const height =
        telegram?.viewportStableHeight ??
        telegram?.viewportHeight ??
        window.innerHeight;
      document.documentElement.style.setProperty(
        '--tg-viewport-height',
        `${height}px`,
      );
    };

    updateViewport();
    telegram?.onEvent?.('viewportChanged', updateViewport);
    window.addEventListener('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      telegram?.offEvent?.('viewportChanged', updateViewport);
    };
  }, []);

  return (
    <main className="telegram-mini-app" data-testid="page-telegram-mini-app">
      {showAirdropPage ? (
        <section className="airdrop-page" aria-label="Airdrop page">
          <div
            className="airdrop-message-box"
            role="status"
            aria-live="polite"
            data-testid="airdrop-coming-soon"
          >
            <p>Airdrop Coming Soon</p>
          </div>
        </section>
      ) : (
        <video
          className="telegram-loading-video"
          autoPlay
          muted
          playsInline
          preload="auto"
          poster="/capyboo3-loading-poster.jpg"
          aria-label="Capyboo3 loading animation"
          data-testid="video-capyboo3-loading"
          onEnded={() => setShowAirdropPage(true)}
          onError={() => setShowAirdropPage(true)}
        >
          <source src="/capyboo3-loading.mp4" type="video/mp4" />
        </video>
      )}
    </main>
  );
}

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
