import { defineConfig } from 'vite';
import { cpSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Os quadros e miniaturas são pedidos por URL em tempo de execução, então o Vite
// não os enxerga no build: copiamos assets/<sabor>/{frames,web} para dist/.
function copiarAssets() {
  return {
    name: 'copiar-assets',
    apply: 'build',
    closeBundle() {
      for (const sabor of readdirSync('assets')) {
        for (const pasta of ['frames', 'web']) {
          const origem = resolve('assets', sabor, pasta);
          if (existsSync(origem)) cpSync(origem, resolve('dist/assets', sabor, pasta), { recursive: true });
        }
      }
    },
  };
}

export default defineConfig({
  build: {
    assetsDir: 'static', // "assets/" fica para os quadros
    rollupOptions: {
      input: { main: resolve('index.html'), conferencia: resolve('conferencia.html') },
    },
  },
  plugins: [copiarAssets()],
});
