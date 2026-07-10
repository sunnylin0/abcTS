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
