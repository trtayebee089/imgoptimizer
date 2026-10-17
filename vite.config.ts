import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Public marketing routes listed in the sitemap. Private routes are disallowed in robots.txt.
const PUBLIC_ROUTES = ['/', '/privacy', '/terms'];
const PRIVATE_PREFIXES = ['/app', '/signin', '/signup', '/login', '/forgot-password', '/reset-password'];

/** Canonical URL, Open Graph URL, robots.txt and sitemap.xml from APP_URL (all optional). */
const seo = (appUrl: string): Plugin => ({
  name: 'op-seo',
  transformIndexHtml(html) {
    const tags = appUrl
      ? `<link rel="canonical" href="${appUrl}/" />\n    <meta property="og:url" content="${appUrl}/" />\n    <meta property="og:image" content="${appUrl}/og-image.png" />\n    <meta name="twitter:image" content="${appUrl}/og-image.png" />`
      : '';
    return html.replace('<!--seo-tags-->', tags);
  },
  generateBundle() {
    const robots = ['User-agent: *', ...PRIVATE_PREFIXES.map(p => `Disallow: ${p}`), 'Allow: /'];
    if (appUrl) robots.push('', `Sitemap: ${appUrl}/sitemap.xml`);
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' });
    if (appUrl) {
      const urls = PUBLIC_ROUTES.map(r => `  <url><loc>${appUrl}${r}</loc></url>`).join('\n');
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n` });
    }
  },
});

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, '.', ''), ...process.env };
  const appUrl = (env.APP_URL || '').replace(/\/+$/, '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), seo(appUrl)],
    define: {
      // Only these two values are exposed to the browser bundle. Never add server secrets here.
      __APP_URL__: JSON.stringify(appUrl),
      __SUPPORT_EMAIL__: JSON.stringify(env.SUPPORT_EMAIL || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
