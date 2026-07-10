# Releases

---
## [2026-07-09] 遷移至 Vite 建置系統 (v1.1.0)
- 將建置腳本由 `esbuild.js` 遷移至 `vite`。
- 新增 UMD 格式打包配置，輸出檔案命名為 `abcjs-basic.js`。
- 修改 `workspace.html` 以支援 Vite 的開發伺服器與打包後的 `abcjs-basic.js`。
- 修正原始碼中多處在打包時暴露的 JavaScript 與 TypeScript 錯誤：
  - 修正了 `abc_plugin.ts` 中 DOM 節點遍歷的無窮遞迴與 null 物件參考。
  - 修正了 `scalefont.ts` 與 `Maestro_500.js` 對全域 `Raphael` 未定義的執行錯誤。
  - 修正了 `abc_tune.ts` 中 `appendStartingElement` 的參數宣告語法錯誤。

---
## [2026-07-09] 支援 Vite 6 降版與相容性修正 (v1.1.1)
- 修正 Vite 6 / Rollup 4 環境下虛擬模組未經 TS 轉譯就交給 JS 解析器 Acorn 的問題。
- 引入 Vite 內建的 `transformWithEsbuild` 工具，手動在 `load` 鉤子中執行虛擬模組的 TS 轉譯，提高對舊版 Vite 與 Rollup 的跨版本相容性。
- 用戶已手動將 Vite 降版至 `^6.2.0`。

---
## [2026-07-10] 修正嚴格模式下 JSONSchema 未定義錯誤 (v1.1.2)
- 修正 `jsonschema-b4.js` 中全域變數 `JSONSchema` 沒有使用 `var`/`let` 宣告，導致在打包後的嚴格模式下引發 `ReferenceError: JSONSchema is not defined` 執行期崩潰的問題。
- 將 `JSONSchema` 加上 `var` 宣告，確保其能被正確編譯並掛載至全域 `window` 物件。
