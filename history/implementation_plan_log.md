# Implementation Plan Log

---
## [2026-07-09 17:56:00] 將建置工具遷移至 Vite

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **安裝 Vite 依賴**
   - 執行 `pnpm install -D vite` 來安裝開發依賴。
2. **建立進入點 `src/main.ts`**
   - 將原本 `esbuild.js` 的 `entryPoints` 所指定的檔案依序 import。
   - 將 `ABCEditor` 等可能被全域存取的類別掛載至 `window`，以維持 HTML 舊有邏輯相容性。
3. **建立 `vite.config.ts`**
   - 設定建置格式為 `umd`，檔名為 `abcjs-basic.js`。
   - 實作自訂的 Vite 插件，在打包完成後自動將 `workspace.html` 複製到 `dist/`，並改為引用 `abcjs-basic.js`。
   - 拷貝 `src` 目錄下的 `.css` 及其他必要靜態檔案至 `dist/`。
4. **修改 `package.json`**
   - 將 `dev` 腳本替換成 `vite`，新增 `build` 腳本為 `vite build`。
5. **重構 `src/workspace.html`**
   - 將引入 20 多個獨立 script 檔案的部分替換成 `<script type="module" src="./main.ts"></script>`。

### 影響檔案 (Affected Files)
- `package.json` (修改)
- `src/workspace.html` (修改)
- `vite.config.ts` (新增)
- `src/main.ts` (新增)

### 風險評估 (Risks & Mitigations)
- **全域變數遺失**：由於 ES 模組有獨立的作用域，在 Vite 打包後全域變數可能不會自動掛在 `window` 上。
  - *對策*：在 `main.ts` 中手動做 `(window as any).ABCEditor = ABCEditor` 等掛載。

---
## [2026-07-19 13:17:00] 解決 pnpm run dev 啟動錯誤

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **修改 HTML 的 DOCTYPE**
   - 將 `src/workspace.html` 的第一、二行變更為標準 HTML5 DOCTYPE。
2. **清除專案中 JSON 的 BOM 字符**
   - 撰寫一小段 Node.js 程式碼，讀取 `package.json`、`tsconfig.json`、`ts_2JS.json`，若檢測到開頭有 UTF-8 BOM 簽名（`0xEF, 0xBB, 0xBF`），則將其移除並重新寫入。
3. **重啟開發伺服器驗證**
   - 執行 `pnpm run dev`，確保伺服器能夠正常啟動且不會有 runtime 解析報錯。

### 影響檔案 (Affected Files)
- `src/workspace.html` (修改)
- `package.json` (移除 BOM)
- `tsconfig.json` (移除 BOM)
- `ts_2JS.json` (移除 BOM)

### 風險評估 (Risks & Mitigations)
- 更改 DOCTYPE 可能微幅影響舊版 IE 的相容模式，但在現代開發環境（Vite 6 開發階段）這是必須的，且對現代瀏覽器無負面影響。

---
## [2026-07-19 14:57:00] 重構打包入口與配置分離至 index.ts

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **建立新入口檔 `src/index.ts`**
   - 列出所有原本在 `vite.config.ts` 中的 `filesToBundle` 作為 ES 靜態 `import`。
   - 在底部聲明全域變數（以 `declare const` 避免 IDE 報紅線），並實作 `window` 全域變數的掛載邏輯。
2. **重構 `vite.config.ts`**
   - 將 UMD 入口修改為 `src/index.ts`。
   - 簡化 Vite 插件 `abcjs-bundle-plugin`。當載入 `src/index.ts` 時，利用正則表達式提取出裡面的 `import './xxx'` 語句，並動態將這些檔案的內容拼接起來，而不需要在設定檔中維護硬編碼的陣列。
   - 調整 `copy-workspace-assets` 插件，在替換 html 時針對 `./index.ts` 進行取代，並在排除打包清單中移除 `index.ts` 與 `main.ts`。
3. **更動 HTML 配置與清理舊檔**
   - 修改 `src/workspace.html` 將載入的腳本更換為 `index.ts`。
   - 刪除已無作用 of `src/main.ts` 檔案。

### 影響檔案 (Affected Files)
- `src/index.ts` (新增)
- `src/workspace.html` (修改)
- `vite.config.ts` (修改)
- `src/main.ts` (刪除)

### 風險評估 (Risks & Mitigations)
- 虛擬模組從 `virtual:abcjs-basic` 轉變為直接替換 `src/index.ts` 的載入。
  - *對策*：確認編譯後的代碼依然包含了全部的變數掛載，且 `pnpm run build` 成功。

---
## [2026-07-19 15:06:00] 將 TS 模組更換為具名導入

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **導出原有 TS 類別與變數**
   - 修改 `src/abc_parser_lint.ts`：為 `class AbcParserLint` 加上 `export`。
   - 修改 `src/play_embedded.ts`：為 `class PlayEmbedded` 加上 `export`.
   - 修改 `src/application.ts`：為 `abcParser` 與 `processAbc` 加上 `export`。
2. **在 `src/index.ts` 中切換為具名載入**
   - 移除 `declare const ABCEditor`, `AbcTuneBook`, `AbcParse`, `AbcParserLint`, `PlayEmbedded`, `abcParser`, `processAbc` 等全域聲明。
   - 變更為對應 TS 模組的具名 `import { ... }` 導入。
   - 純 JS 的 `jsonschema-b4.js` 模組不使用 `export`，故在 `src/index.ts` 保留 `declare const JSONSchema: any;` 以消除 IDE 報錯。
3. **優化 `vite.config.ts` 中的拼接正則**
   - 將 `importRegex` 修改為 `/import\s+(?:(?:\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+)?['"]\.\/([^'"]+)['"];?/g`，使它能同時識別無副作用導入以及具名模組導入，確保動態文件拼接在打包時不遺漏任何檔案。

### 影響檔案 (Affected Files)
- `src/abc_parser_lint.ts` (修改)
- `src/play_embedded.ts` (修改)
- `src/application.ts` (修改)
- `src/index.ts` (修改)
- `vite.config.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 更改正則可能會影響打包拼接的檔案解析。
  - *對策*：運行 `pnpm run build` 確認 UMD bundle 包含全部 class 且大小正常。
