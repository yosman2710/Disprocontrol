import type { AppProps } from 'next/app';
import '../app/globals.css';
import { AuthGuard } from '../components/AuthGuard';
import { Toaster } from 'sonner';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <AuthGuard>
      <Toaster position="top-right" richColors />
      <div className="main-scale-wrapper">
        <Component {...pageProps} />
      </div>
    </AuthGuard>
  );
}
