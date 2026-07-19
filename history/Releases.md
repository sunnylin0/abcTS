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

---
## [2026-07-19] 修正 Vite 6 啟動與 PostCSS 配置載入錯誤 (v1.1.3)
- 修正 `src/workspace.html` 的 DOCTYPE，將舊版 XHTML DOCTYPE 更改為標準 HTML5 DOCTYPE，解決 Vite 6 的 parse5 解析器報錯。
- 移除了 `package.json`、`tsconfig.json` 和 `ts_2JS.json` 中的 UTF-8 BOM 字符，解決 Vite 在載入 CSS/PostCSS 配置時讀取 package.json 導致 JSON.parse 失敗的崩潰問題。

---
## [2026-07-19] 重構打包入口與配置分離至 index.ts (v1.2.0)
- 新增 `src/index.ts` 作為新的打包進入點，將打包檔案清單（以 ES `import` 宣告）與 `window` 全域掛載變數移入其中，達成配置與建置工具的完美抽離。
- 重構 `vite.config.ts` 中的自訂插件，自動讀取並正則解析 `src/index.ts` 的 `import` 語句，並在編譯時於記憶體內動態拼接。
- 移除了舊的、不再需要的 `src/main.ts`。
- 修改 `src/workspace.html` 以引用新的 `src/index.ts` 檔案。

---
## [2026-07-19] 將 TS 模組切換為具名導入，理順混合架構 (v1.2.1)
- 為 `abc_parser_lint.ts`、`play_embedded.ts` 和 `application.ts` 加上 `export`，使其實作 TS 模組導出。
- 在 `src/index.ts` 中以具名 `import { ... }` 導入所有 TS 變數與類別，消除了 IDE 的 TypeScript 型別紅線。
- 保留 `declare const JSONSchema: any;` 以正確宣告純 JS 資源（無 `export` 聲明）。
- 升級 `vite.config.ts` 中的 `importRegex` 正規表達式，使其完美相容具名導入的靜態拼接。
