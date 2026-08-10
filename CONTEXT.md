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

---

## Glossary — 簡譜 (Jianpu) 渲染子系統

### Jianpu Voice（簡譜聲部）
- **定義**：在 ABC 樂譜中，以 `V:N clef=jianpu` 宣告的聲部。`clef=jianpu` 是一個新增的合法 `ClefType`，與 `treble`、`bass` 並列。
- **與 Treble 聲部的關係**：同一首曲中，`clef=treble` 為五線譜聲部，`clef=jianpu` 為對應的簡譜聲部。兩者共享同一個 Layout 引擎（x 座標、間距、小節線位置完全對齊），僅在 Write 層輸出不同的 SVG 元素。
- **垂直排列**：依照 `V:N` 的宣告順序決定，`V:2 clef=jianpu` 繪製在 `V:1` 的下方。

### Scale Degree（級數，1–7）
- **定義**：簡譜中音符的數字表示，`1`=Do, `2`=Re, `3`=Mi, `4`=Fa, `5`=Sol, `6`=La, `7`=Si。
- **計算規則**：由 Write 層根據音符的 `pitch` 值（C=0, D=1, ... B=6）與 `KeySigElement.root`（大調主音）計算。採用**首調唱名法**（Moveable Do）：主音 root 對應 `1`，其餘音名依 diatonic 順序遞增。
- **Minor Key 規則**：小調（如 `K:Am`）的 `do=1` 以**相對大調主音**為準（`Am` → 相對大調 `C` → `do=C`，A 音顯示為 `6`）。
- **Chromatic Accidental（調外臨時記號）**：調號內的音不加任何符號；調外的臨時升降音在數字前以 SVG 繪製真正的 ♯ / ♭ glyph。

### KeySigElement.root（調根）
- **定義**：在 `abc_parse_header.ts` 解析 `K:` 欄位時，計算並附加到 `KeySigElement` 上的大調主音音名（如 `'C'`, `'G'`, `'F'`）。
- **用途**：Write 層計算 Scale Degree 的基準；不影響 Layout 或 MIDI 生成。

### Octave Dots（八度點）
- **定義**：簡譜中標示音高八度的圓點：數字上方加點為高一個八度（每點+1個八度），下方加點為低一個八度。
- **基準八度（Reference Octave）**：預設以 `pitch 0–6`（大字組 C–B）為無點區。若 `V:N clef=jianpu octave=4` 有明確指定，則以該 MIDI 八度為基準計算偏移。

### Duration Line（時值線）
- **定義**：SVG `path` / `line` 元素，用以表示時值：
  - **延音橫線** (`-`)：全音符/二分音符後方的橫線。
  - **底線（Beam Underline）**：八分音符及更短音符下方的橫線；十六分音符有兩條底線。
- **連梁規則**：同一 beam group（ABC 原文無空白分隔）的音符共享一條連貫底線；有空白分隔的獨立畫底線。依 AST 中既有的 `startBeam` / `endBeam` 旗標判斷。

### Jianpu Staff Header（簡譜行首標記）
- **定義**：每行簡譜聲部開頭的 SVG 文字，顯示調名（如 `1=G`）與拍號（如 `4/4`）。
- **繪製規則**：在 Write 層的 `ABCVoiceElement.draw()` 中，jianpu voice 自行在本聲部 y 座標位置插入 SVG text 元素；不畫五線譜的 clef 圖形。小節線 x 與 treble 聲部完全對齊。
