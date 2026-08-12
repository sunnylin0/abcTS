# 規格書：重構解析函式元組回傳為具名強型別物件

## Problem Statement

目前 `abcTS` 的 ABC 樂譜解析與 Tokenizer 模組中，許多核心解析函式（例如和弦、小節線、裝飾音、空白與節奏等解析函式）回傳值均採用無語意、無型別標註的元組 (tuples，例如 `[number, string, boolean]`)。

這導致：
1. 開發者在呼叫這些解析函式時，必須使用無語意的陣列索引（如 `ret[0]`, `ret[1]`）存取屬性，極易混淆與寫錯。
2. TypeScript compiler 無法提供準確的屬性名稱與型別補全，增加了開發與後續維護的型別安全風險。
3. 代碼的可讀性大幅下降，增加了新開發者或 AI 代理人理解核心解析邏輯的門檻。

---

## Solution

將這 9 個核心解析函式的回傳型別，從無語意的元組全部重構為具有明確屬性名稱、附帶詳盡 JSDoc/TSDoc 註解的強型別物件（Interfaces），並重構對應模組的所有呼叫點，以提升程式碼的型別安全性、可維護性與可讀性。

---

## User Stories

1. 身為一名 abcTS 的維護開發者，我希望在呼叫 `getBrackettedSubstring` 等 tokenizer 函式時能夠獲得 `.len` 與 `.token` 的型別自動補全，以便我能以最低的認知負載撰寫解析代碼。
2. 身為一名 abcTS 的維護開發者，我希望和弦解析函式回傳一個具備 `len`、`name` 與 `position` 的物件，使我不用死記 `ret[0]` 代表長度、`ret[1]` 代表名稱、`ret[2]` 代表位置。
3. 身為一名 abcTS 的維護開發者，我希望在 IDE 中將滑鼠懸停於新介面屬性上時，能看到詳盡的中文註解，使我能立即理解該屬性在 ABC 語法中所代表的含義。
4. 身為一個自動化測試引擎，我希望重構後的程式碼能夠 100% 通過與舊版解析器的 AST 結構比對，確保這次的型別重構沒有引入任何功能性退化 (Regression)。

---

## Implementation Decisions

### 1. 新增具名強型別介面
定義以下 9 個具備詳細說明註解的介面：
- `BrackettedSubstringResult`：括號子字串提取結果（包含 `len`、`token`、`closed`）。
- `ChordParseResult`：和弦標註解析結果（包含 `len`、`name`、`position`）。
- `AccentParseResult`：音符裝飾記號解析結果（包含 `len`、`accent`）。
- `SpacerParseResult`：空白 spacer 消耗結果（包含 `len`）。
- `BarParseResult`：小節線解析結果（包含 `len`、`barType`、`ending`）。
- `BrokenRhythmResult`：折分節奏解析結果（包含 `len`、`factor1`、`factor2`）。
- `GraceParseResult`：裝飾音符解析結果（包含 `len`、`notes`）。
- `InlineHeaderResult`：行內中括號欄位解析結果（包含 `len`、`headerLetter`、`content`）。
- `BodyHeaderResult`：行首與主體欄位解析結果（包含 `len`、`headerLetter`、`content`）。

### 2. 重構底層解析函式
- 將相關的 tokenizer 與 parser 內部解析函式簽章，改為回傳上述具名物件。
- 去除 `letter_to_accent` 中未曾使用的 `boolean` 聯集回傳宣告，統一型別。
- 在每個屬性上加上 JSDoc/TSDoc 的繁體中文註解。

### 3. 重構上層呼叫處與屬性存取
- 修改所有呼叫這 9 個解析函式的程式碼，將原先使用 `ret[0]`, `ret[1]`, `ret[2]` 的索引取值，全數改為更具語意的屬性取值（如 `result.len`, `result.token`, `result.ending`）。

---

## Testing Decisions

### 1. 什麼是好的測試
- **外部行為一致性驗證**：本次重構完全是「內部重構（Internal Refactoring）」，不應改變任何外部樂譜解析與繪圖的輸出行為。
- **Seam 的使用**：透過 AST 比對與 SVG 繪圖日誌 (DrawLog) 兩個最高層級的 Seams 進行驗證，不對個別重構後的內部屬性寫 ad-hoc 測試。

### 2. 被驗證的模組與測試先例
- **AST 解析一致性測試**：執行 `node test/compare_ast.js`。該測試會將新編譯 UMD 與舊版 JS 的 AST 樹狀結構進行 100% 精準度遞迴比對。這能防範任何在重構 `getBrackettedSubstring` 等核心 Tokenizer 時引起的解析退化。
- **簡譜 TDD 測試與五線譜回歸測試**：執行 `node test.js` 及 `test-jianpu-01.js` 到 `test-jianpu-07.js`，確認在引入新介面後，簡譜與五線譜渲染依舊完好工作。

---

## Out of Scope

- **不新增任何解析功能**：本次重構僅限於元組回傳型別與變數存取的改動，不包含對 ABC 標準 2.0/2.1 的任何新語意支援。
- **不重構其他與此 9 個函式無關的 Tuple**：例如 MIDI 音軌寫入時的臨時 tuples，不在本次範圍內。

---

## Further Notes

- 重構完成後，執行 `pnpm run build` 確認 TypeScript 靜態型別編譯無錯誤，且 UMD 打包正常輸出。
