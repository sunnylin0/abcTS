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
