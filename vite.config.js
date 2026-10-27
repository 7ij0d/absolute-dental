import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateSpaRoutesPlugin() {
  return {
    name: 'generate-spa-routes',
    closeBundle() {
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');
      if (!fs.existsSync(indexHtmlPath)) return;

      const html = fs.readFileSync(indexHtmlPath, 'utf-8');
      const routes = [
        'study-tools',
        'accessories',
        'box-manager',
        'boxes-manager',
        'box-studio',
        'boxes',
        'dental-boxes',
        'donations',
        'track',
        'about',
        'faq',
        'shipping-returns',
        'contact',
        'admin/boxes',
        'admin/accessories',
        'admin'
      ];

      routes.forEach(route => {
        const routeDir = path.join(distDir, route);
        fs.mkdirSync(routeDir, { recursive: true });
        fs.writeFileSync(path.join(routeDir, 'index.html'), html);
      });

      fs.writeFileSync(path.join(distDir, 'box-manager.html'), html);
      fs.writeFileSync(path.join(distDir, 'boxes.html'), html);
      console.log('✨ [SPA Plugin] Generated static direct route HTML copies for zero-delay hosting.');
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), generateSpaRoutesPlugin()],
  base: './',
});
