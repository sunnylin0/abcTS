import { defineConfig, transformWithEsbuild } from 'vite';
import { resolve } from 'path';
import fs from 'fs-extra';

const filesToBundle = [
  'src/jsonschema-b4.js',
  'src/string_extension.ts',
  'src/svg.ts',
  'src/proto.ts',
  'src/sprintf.ts',
  'src/abc_glyphs.ts',
  'src/abc_graphelements.ts',
  'src/abc_layout.ts',
  'src/abc_write.ts',
  'src/abc_tunebook.ts',
  'src/abc_parse_header.ts',
  'src/abc_tune.ts',
  'src/abc_tokenizer.ts',
  'src/abc_parse.ts',
  'src/abc_parser_lint.ts',
  'src/wav_generator.ts',
  'src/play_embedded.ts',
  'src/application.ts',
  'src/abc_editor.ts',
  'src/abc_midiwriter.ts',
  'src/abc_plugin.ts',
  'src/Maestro_500.js',
  'src/scalefont.ts',
];

export default defineConfig({
  server: {
    open: '/src/workspace.html',
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
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
      name: 'abcjs-virtual-bundle',
      resolveId(id) {
        if (id === 'virtual:abcjs-basic') {
          return '\0' + id + '.ts';
        }
      },
      async load(id) {
        if (id === '\0virtual:abcjs-basic.ts') {
          let content = '';
          for (const file of filesToBundle) {
            const filePath = resolve(__dirname, file);
            let fileContent = fs.readFileSync(filePath, 'utf-8');
            // 移除可能存在的 BOM 字符
            if (fileContent.charCodeAt(0) === 0xfeff) {
              fileContent = fileContent.slice(1);
            }
            content += `\n// --- BUNDLED FILE: ${file} ---\n`;
            content += fileContent;
            content += ';\n';
          }

          // 掛載全域變數
          content += `
            if (typeof window !== 'undefined') {
              (window as any).ABCEditor = ABCEditor;
              (window as any).JSONSchema = JSONSchema;
              (window as any).AbcTuneBook = AbcTuneBook;
              (window as any).AbcParse = AbcParse;
              (window as any).AbcParserLint = AbcParserLint;
              (window as any).PlayEmbedded = PlayEmbedded;
              if (typeof abcParser !== 'undefined') (window as any).abcParser = abcParser;
              if (typeof processAbc !== 'undefined') (window as any).processAbc = processAbc;
            }
          `;

          // 使用 Vite 內建的 esbuild 轉譯器，將 TypeScript 編譯為 JavaScript
          const result = await transformWithEsbuild(content, 'virtual:abcjs-basic.ts', {
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

        // 將 <script type="module" src="./main.ts"></script> 替換成 <script src="./abcjs-basic.js"></script>
        const timestamp = Date.now();
        html = html.replace(
          /<script type="module" src=".\/main.ts"><\/script>/g,
          `<script src="./abcjs-basic.js?v=${timestamp}"></script>`
        );

        // 如果還有其他多餘的 script，例如之前被引入的個別 js，我們會在接下來修改 src/workspace.html 時將它們移除，只留下 main.ts 的載入。
        
        fs.ensureDirSync(resolve(__dirname, 'dist'));
        fs.writeFileSync(resolve(__dirname, 'dist/workspace.html'), html, 'utf-8');

        // 複製 src 目錄下的 css, txt 與其他 html 檔案（不複製 ts 與 main.ts）
        fs.copySync(resolve(__dirname, 'src'), resolve(__dirname, 'dist'), {
          filter: (src, dest) => {
            if (src.endsWith('.vs') || src.endsWith('.git')) return false;
            
            const stat = fs.lstatSync(src);
            if (stat.isDirectory()) return true;

            const name = src.toLowerCase();
            if (name.endsWith('workspace.html') || name.endsWith('main.ts') || name.endsWith('.ts')) {
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
