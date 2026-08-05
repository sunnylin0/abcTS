# Context: abcTS Testing & Verification

這份文件記錄了 `abcTS` 專案比對測試核心系統的領域模型與術語表（Glossary），以確保開發、測試與維護過程中使用統一且精準的語言（Ubiquitous Language）。

## Glossary

### Browser Sandbox (瀏覽器沙盒)
- **定義**：利用 Node.js 原生的 `vm` (Virtual Machine) 模組，建立的獨立且物理隔離的 DOM/SVG 虛擬執行上下文。
- **職責**：
  - 隔絕舊版 JavaScript 代碼中的全域 `Prototype.js` 對全域原型鏈（如 `Array.prototype`、`String.prototype` 等）的污染。
  - 模擬 `window`、`document`、`SVGElement` 等瀏覽器特有 API，確保樂譜解析器與繪圖庫在無真實瀏覽器環境（如 Node 執行期）下依然能正常運行。
- **生命週期與狀態隔離**：目前已實作狀態重置機制（透過 `MockElement.prototype.clear()` 方法），於每次測試案例渲染及比對完畢後，強制清空 `document.body` 中殘留的 DOM 節點，以規避跨測試案例的 DOM 污染與記憶體洩漏。

### AST (Abstract Syntax Tree, 抽象語法樹)
- **定義**：解析 ABC 樂譜後，由 `AbcTuneBook` 及 `AbcParse` 生成的樹狀數據結構。
- **驗證**：比對引擎會遞迴走訪舊版與新版產生的語法樹（ Stage A & B ），比對所有 Key/Value 的 100% 精準度。

### DrawLog (繪圖日誌)
- **定義**：在 Mock 繪圖表面（`mockPaper`）上執行的 SVG/Raphael 繪圖指令序列（如 `path`、`text`、`setSize`）。
- **驗證**：比對引擎在經過坐標四捨五入、路徑格式對齊與樣式轉換等「正規化 (Normalization)」處理後，遞迴比對新舊兩版（ Stage D ），確保繪圖指令序列 100% 一致。
