// pages/_app.tsx
import { AppProps } from 'next/app';
import Layout from '@/components/Layout';
import '@/styles/globals.css'; // Global CSS or Tailwind imports

const MyApp = ({ Component, pageProps }: AppProps) => {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
};

export default MyApp;
