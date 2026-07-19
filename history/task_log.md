# Task Log

---
## [2026-07-09 17:56:00] 將建置工具遷移至 Vite

### 目標 (Objectives)
- 將建置工具由 `esbuild` 遷移至 `Vite`。
- `src/workspace.html` 作為開發及執行進入點。
- 封包打包格式為 `umd`，檔名為 `abcjs-basic.js`。

### 需求 (Requirements)
1. 使用 `pnpm` 管理套件。
2. 建立 `src/main.ts` 作為打包進入點。
3. 修改 `package.json` 中的腳本，換成 `vite` 與 `vite build`。
4. 修改 `src/workspace.html` 以導入 `src/main.ts`。
5. 確保打包後的 UMD `abcjs-basic.js` 能夠被 `dist/workspace.html` 正確引入，且全域變數（如 `ABCEditor`）正常運作。

### 驗收條件 (Acceptance Criteria)
- 執行 `pnpm run build` 能產出 `dist/abcjs-basic.js` 且不報錯。
- `dist/workspace.html` 引入 `abcjs-basic.js` 後，能正常在瀏覽器中渲染並編輯 ABC 樂譜。
- 執行 `pnpm run dev` 能啟動 Vite 開發伺服器，並順利運行樂譜編輯頁面。

---
## [2026-07-19 13:17:00] 解決 pnpm run dev 啟動錯誤

### 目標 (Objectives)
- 排除 `pnpm run dev` 啟動時的 HTML 解析與 PostCSS 配置載入錯誤。

### 需求 (Requirements)
1. 修正 `src/workspace.html` 的 DOCTYPE 與 `html` 標籤，使其符合標準 HTML5 規範以通過 Vite 6 的 parse5 嚴格解析。
2. 檢查並移除專案內 JSON 檔案（如 `package.json`, `tsconfig.json` 等）所包含的 UTF-8 BOM 字符，避免 Vite 載入設定時報錯。

### 驗收條件 (Acceptance Criteria)
- `pnpm run dev` 能夠順利啟動，無任何 HTML 解析或 JSON 格式錯誤，且伺服器能正常運行於本機埠。

---
## [2026-07-19 14:57:00] 重構打包入口與配置分離至 index.ts

### 目標 (Objectives)
- 將 `vite.config.ts` 中過多的打包檔案清單與全域掛載邏輯，整理分類至 `src/index.ts`。

### 需求 (Requirements)
1. 建立 `src/index.ts` 作為新的打包入口。
2. 將 `vite.config.ts` 中的 `filesToBundle`（檔案清單）改以 ES `import` 形式移入 `src/index.ts`。
3. 將全域變數的 `window` 掛載邏輯移入 `src/index.ts` 底部。
4. 簡化 `vite.config.ts`，利用正則表達式在載入 `src/index.ts` 時動態解析並拼接檔案。
5. 刪除原有的 `src/main.ts`。
6. 更新 `src/workspace.html` 以導入 `src/index.ts`。

### 驗收條件 (Acceptance Criteria)
- 執行 `pnpm run build` 可以順利編譯出 UMD 格式的 `abcjs-basic.js`。
- 執行 `pnpm run dev` 可以正常啟動 Vite 開發伺服器。
- 整個過程中沒有型別或載入錯誤。

---
## [2026-07-19 15:06:00] 將 TS 模組更換為具名導入

### 目標 (Objectives)
- 將 `src/index.ts` 內的所有 TypeScript 檔案替換為具名的 `import { ClassName }` 導入以消除 IDE 型別紅線，並理順純 JS 檔案與 TS 模組的混用架構。

### 需求 (Requirements)
1. 在原本沒有 export 的 TS 檔案（`abc_parser_lint.ts`, `play_embedded.ts`, `application.ts`）中加入 `export` 關鍵字。
2. 修改 `src/index.ts`，將所有 TS 模組皆變更為具名載入，完全移除它們的 `declare const` 宣告。
3. 對於純 JS 的 `jsonschema-b4.js`（無導出），在 `src/index.ts` 中保留 `declare const JSONSchema: any;` 聲明。
4. 修改 `vite.config.ts` 中的 `importRegex` 正則表達式，使其能完美匹配並拼接具名載入（`import { ... } from './...'`）與無副作用導入。

### 驗收條件 (Acceptance Criteria)
- `index.ts` 中所有 TS 類別與變數皆已更換為具名載入且無型別紅線。
- `pnpm run build` 與 `pnpm run dev` 正常運作無解析錯誤。
