# Walkthrough Log

---
## [2026-07-09 18:06:00] 將建置工具遷移至 Vite (完成)

### 變更摘要 (Change Summary)
1. **依賴管理**：安裝了 `vite` 開發依賴，並從專案移除了 `esbuild` 相關直接編譯任務。
2. **打包進入點**：
   - 建立 `src/main.ts` 作為進入點，引用了虛擬模組 `virtual:abcjs-basic.ts`。
3. **Vite 配置 (`vite.config.ts`)**：
   - 配置 UMD 格式打包，輸出為 `abcjs-basic.js`。
   - 使用自訂的虛擬模組插件把所有 JS/TS 原始碼依照順序串聯，避免了為每個檔案加上 export/import 的繁雜重構，並在尾端掛載 `ABCEditor` 等到全域 `window` 上。
   - 在 `resolveId` 時強制返回 `.ts` 後綴，讓 Vite 正確使用 TypeScript 轉譯器處理虛擬模組，解決了 BOM 與 TS 關鍵字解析錯誤。
   - 在 closeBundle 階段自動將 `workspace.html` 複製到 `dist/` 且替換 script 引用的同時，加上了防止瀏覽器快取的 `?v=[timestamp]` 時間戳參數。
   - 自動拷貝 `src/` 中的 CSS、TXT 和其他 HTML 到 `dist/`。
4. **原始碼修正**：
   - **`src/Maestro_500.js`**：加上 `if (typeof Raphael !== 'undefined')` 防護，解決在沒有 Raphael 的 HTML 中載入時的 JS 報錯。
   - **`src/scalefont.ts`**：加上對全域 `Raphael` 的存在性檢查防護。
   - **`src/abc_plugin.ts`**：
     - 修正 `getABCContainingElements` 中的無窮遞迴錯誤（當遇到 ELEMENT_NODE 時應 recurse 其 childNodes，而非 recurse 同一個 node）。
     - 在 `start` 中對 `convertToDivs` 的結果進行 `filter(div => div !== null)`，解決在無效內容時的 `Cannot read properties of null (reading 'getAttribute')` 錯誤。
   - **`src/abc_tune.ts`**：修正 `appendStartingElement` 的參數順序，使選填參數不影響必填參數，消除了 TypeScript 語法錯誤。

### 驗證與測試日誌 (Verification & Test Log)
1. 執行 `pnpm run build` 成功建置未壓縮與已壓縮（當 minify 開啟時）的 `dist/abcjs-basic.js`，大小分別約為 495 kB 與 224 kB，且無任何編譯期錯誤。
2. 啟動 `vite preview` 伺服器並使用瀏覽器自動化測試，在修正了 BOM、Raphael 參考、recurse 遞迴 and null element check 後，所有主控台 JavaScript 錯誤均已被清除。

---
## [2026-07-09 18:09:00] 支援舊版 Vite (Vite 6 / Rollup 4) 相容性

### 變更摘要 (Change Summary)
1. **問題診斷**：在 Vite 6 / Rollup 4 環境下，由於虛擬模組不在實體磁碟上，Vite 內建的 esbuild 轉譯器未被觸發，直接將含有 TypeScript 語法（如 `interface` 等）的虛擬模組交給 Rollup 內建的 Acorn JS 解析器，造成語法解析錯誤。
2. **技術方案**：
   - 修改 `vite.config.ts` 中的 `load` 鉤子為 `async load`。
   - 使用 Vite 的 `transformWithEsbuild` 函數，在虛擬模組被返回給 Rollup 之前，手動將其 TypeScript 代碼編譯為 JavaScript。
   - 這消除了對 Rollup 4 Acorn 解析器的型別阻礙，使該虛擬模組在不同 Vite 版本（Vite 6 與 Vite 8）間皆能完美支援。

### 驗證與測試日誌 (Verification & Test Log)
1. 執行 `pnpm run build` 成功建置未壓縮的 `dist/abcjs-basic.js`，無任何解析與轉譯錯誤，且成功複製 HTML 與相關資產到 `dist/`。

---
## [2026-07-10 13:08:00] 解決嚴格模式下的 JSONSchema ReferenceError 錯誤

### 變更摘要 (Change Summary)
1. **問題診斷**：在 Vite 打包後，JS 會在嚴格模式 (`"use strict";`) 下執行。原先 `src/jsonschema-b4.js` 中的全域變數 `JSONSchema = { ... }` 由於沒有宣告關鍵字（`var` / `let`），在嚴格模式下被視為非法賦值，引發了 `Uncaught ReferenceError: JSONSchema is not defined` 錯誤。這進一步阻斷了後續 `ABCEditor` 等變數的掛載。
2. **技術方案**：
   - 修改 `src/jsonschema-b4.js`，加上 `var` 宣告關鍵字（`var JSONSchema = { ... }`），使其在 module scope 中合法宣告，並能透過尾端的掛載邏輯安全暴露給全域的 `window` 物件。

### 驗證與測試日誌 (Verification & Test Log)
1. 執行 `pnpm run build` 成功建置。
2. 啟動 `vite preview` 進行瀏覽器自動化測試，確認 Console 中沒有任何 JavaScript 錯誤，且預設的樂譜已成功渲染（DOM 中顯示 `No errors` 狀態）。
