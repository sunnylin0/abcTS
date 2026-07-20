import { defineConfig, transformWithEsbuild } from 'vite';
import { resolve } from 'path';
import fs from 'fs-extra';

export default defineConfig({
	server: {
		open: '/src/workspace.html',
	}, resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		}
	},
	build: {
		lib: {
			entry: resolve(__dirname, 'src/index.ts'),
			name: 'ABCJS',			// 全域變數名稱，舊程式碼可用 window.ABCJS 存取
			formats: ['umd'],
			fileName: () => 'abcjs-basic.js',
		},
		outDir: 'dist',
		emptyOutDir: true,
		sourcemap: true,
		minify: false,
	},
    plugins: [
        // 獨立處理靜態資源與 HTML 的插件
        {
            name: 'copy-workspace-assets',
            closeBundle() {
                const htmlPath = resolve(__dirname, 'src/workspace.html');
                if (!fs.existsSync(htmlPath)) return;

                let html = fs.readFileSync(htmlPath, 'utf-8');

                // 將模組化 script 標籤替換成打包後的單一基本 UMD 檔案
                const timestamp = Date.now();
                html = html.replace(
                    /<script type="module" src=".*index\.ts"><\/script>/g,
                    `<script src="./abcjs-basic.js?v=${timestamp}"></script>`
                );

                fs.ensureDirSync(resolve(__dirname, 'dist'));
                fs.writeFileSync(resolve(__dirname, 'dist/workspace.html'), html, 'utf-8');

                // 複製其他的靜態檔案 (css, txt 等)
                fs.copySync(resolve(__dirname, 'src'), resolve(__dirname, 'dist'), {
                    filter: (src) => {
                        if (src.endsWith('.vs') || src.endsWith('.git')) return false;

                        const stat = fs.lstatSync(src);
                        if (stat.isDirectory()) return true;

                        const name = src.toLowerCase();
                        // 跳過所有源碼檔案，只留靜態資產
                        if (name.endsWith('.ts') || name.endsWith('workspace.html')) {
                            return false;
                        }
                        return (
                            name.endsWith('.txt') ||
                            name.endsWith('.css') ||
                            name.endsWith('.html') ||
                            name.endsWith('.json')
                        );
                    },
                });
            },
        },
    ],
});