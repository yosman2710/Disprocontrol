import type { AppProps } from 'next/app';
import '../app/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="main-scale-wrapper">
      <Component {...pageProps} />
    </div>
  );
}
