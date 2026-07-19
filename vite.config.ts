import { defineConfig, transformWithEsbuild } from 'vite';
import { resolve } from 'path';
import fs from 'fs-extra';

export default defineConfig({
  server: {
    open: '/src/workspace.html',
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ABCJS',
      formats: ['umd'],
      fileName: () => 'abcjs-basic.js',
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
  },
  plugins: [
    {
      name: 'abcjs-bundle-plugin',
      resolveId(id) {
        if (id.endsWith('src/index.ts') || id.endsWith('src/index.js')) {
          return resolve(__dirname, 'src/index.ts');
        }
      },
      async load(id) {
        if (id === resolve(__dirname, 'src/index.ts')) {
          const indexContent = fs.readFileSync(id, 'utf-8');
          
          // 使用正則表達式尋找所有的 import './xxx' 或 import { ... } from './xxx'
          const importRegex = /import\s+(?:(?:\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+)?['"]\.\/([^'"]+)['"];?/g;
          let match;
          let bundledContent = '';
          
          // 為了保持導入順序，我們遍歷匹配項
          while ((match = importRegex.exec(indexContent)) !== null) {
            const relativePath = match[1];
            let filePath = resolve(__dirname, 'src', relativePath);
            if (!fs.existsSync(filePath)) {
              if (fs.existsSync(filePath + '.ts')) {
                filePath += '.ts';
              } else if (fs.existsSync(filePath + '.js')) {
                filePath += '.js';
              }
            }
            
            let fileContent = fs.readFileSync(filePath, 'utf-8');
            // 移除可能存在的 BOM 字符
            if (fileContent.charCodeAt(0) === 0xfeff) {
              fileContent = fileContent.slice(1);
            }
            bundledContent += `\n// --- BUNDLED FILE: ${relativePath} ---\n`;
            bundledContent += fileContent;
            bundledContent += ';\n';
          }
          
          // 加上剩餘的 indexContent 中非 import './xxx' 的部分（即變數宣告與掛載邏輯）
          const nonImportContent = indexContent.replace(importRegex, '');
          const finalContent = bundledContent + '\n' + nonImportContent;
          
          // 使用 Vite 內建的 esbuild 轉譯器，將 TypeScript 編譯為 JavaScript
          const result = await transformWithEsbuild(finalContent, 'src/index.ts', {
            loader: 'ts',
            sourcemap: true,
          });
          
          return {
            code: result.code,
            map: result.map,
          };
        }
      },
    },
    {
      name: 'copy-workspace-assets',
      closeBundle() {
        // 處理 workspace.html
        const htmlPath = resolve(__dirname, 'src/workspace.html');
        let html = fs.readFileSync(htmlPath, 'utf-8');

        // 將 <script type="module" src="./index.ts"></script> 替換成 <script src="./abcjs-basic.js"></script>
        const timestamp = Date.now();
        html = html.replace(
          /<script type="module" src=".\/index.ts"><\/script>/g,
          `<script src="./abcjs-basic.js?v=${timestamp}"></script>`
        );
        
        fs.ensureDirSync(resolve(__dirname, 'dist'));
        fs.writeFileSync(resolve(__dirname, 'dist/workspace.html'), html, 'utf-8');

        // 複製 src 目錄下的 css, txt 與其他 html 檔案（不複製 ts 與 index.ts / main.ts）
        fs.copySync(resolve(__dirname, 'src'), resolve(__dirname, 'dist'), {
          filter: (src, dest) => {
            if (src.endsWith('.vs') || src.endsWith('.git')) return false;
            
            const stat = fs.lstatSync(src);
            if (stat.isDirectory()) return true;

            const name = src.toLowerCase();
            if (
              name.endsWith('workspace.html') || 
              name.endsWith('main.ts') || 
              name.endsWith('index.ts') || 
              name.endsWith('.ts')
            ) {
              return false;
            }
            return (
              name.endsWith('.txt') ||
              name.endsWith('.css') ||
              name.endsWith('.html') ||
              name.endsWith('.js')
            );
          },
        });
        console.log('Copied workspace assets to dist successfully.');
      },
    },
  ],
});
