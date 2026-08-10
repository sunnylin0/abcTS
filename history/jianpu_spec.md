# Spec: 簡譜（Jianpu）渲染子系統

## Problem Statement

abcTS 目前只能輸出五線譜（`clef=treble`）。台灣/中國的音樂教育與流行歌曲出版大量使用**簡譜**（數字譜），樂手希望在同一份 ABC notation 樂曲中，讓五線譜與簡譜並排呈現，或單獨輸出簡譜聲部。現有 parser 在遇到 `V:N clef=jianpu` 時直接產生 "Unknown clef" 警告，完全無法渲染。

---

## Solution

在 ABC notation 中正式支援 `V:N clef=jianpu` 聲部宣告，使 abcTS 能在 **Write 層**輸出標準中文簡譜 SVG。簡譜聲部與五線譜聲部共用同一個 Layout 引擎（x 座標、間距、小節線位置完全對齊），僅在最終 SVG 輸出階段走不同的繪圖路徑。

---

## User Stories

### 基礎宣告

1. 作為樂譜排版者，我想在 ABC 樂譜的 `V:` 行加上 `clef=jianpu`，讓該聲部以簡譜呈現，這樣我不需要額外轉換工具。
2. 作為樂譜排版者，我想讓 `V:2 clef=jianpu` 自動排列在 `V:1 clef=treble` 的正下方，這樣五線譜和簡譜可以對照閱讀。
3. 作為樂譜排版者，我想省略五線譜聲部，只宣告 `V:1 clef=jianpu`，就能輸出純簡譜，這樣適合入門學生使用。

### 音符數字（Scale Degree）

4. 作為讀譜者，我想看到簡譜音符以 `1`–`7` 的數字顯示，而不是音符頭圖形，這樣我可以不認五線譜就能讀譜。
5. 作為讀譜者，我想讓數字根據當前調號自動計算（首調唱名法），例如 `K:G` 時 G 音顯示為 `1`，這樣我不用自己換算。
6. 作為讀譜者，我想讓小調樂曲（如 `K:Am`）以相對大調主音為 `do=1`（A 音顯示為 `6`），符合台灣簡譜教育慣例。

### 臨時記號

7. 作為讀譜者，我想讓調號內的音（如 `K:G` 中的 F♯）直接顯示為 `4`，不帶任何附加符號，這樣版面乾淨。
8. 作為讀譜者，我想讓調外的臨時升降音在數字前顯示真正的 SVG ♯ 或 ♭ glyph（而非文字符號），這樣視覺上清晰專業。

### 八度點（Octave Dots）

9. 作為讀譜者，我想讓高一個八度的音在數字上方顯示一個圓點，低一個八度在數字下方顯示一個圓點，這樣我能立即辨識音高範圍。
10. 作為讀譜者，我想讓高兩個八度的音顯示兩個圓點，以此類推，支援多個八度。
11. 作為排版者，我想在 `V:N clef=jianpu octave=4` 指定基準八度，讓八度點計算以 MIDI 八度 4 為無點區，這樣我能控制整體音域顯示。
12. 作為排版者，若我沒指定 `octave=`，我想讓系統預設以大字組 C–B（pitch 0–6）為無點區，這樣大多數旋律不需要調整就能正確顯示。

### 時值（Duration）

13. 作為讀譜者，我想讓四分音符只顯示數字，二分音符後面接一條橫線 `─`，全音符後接三條橫線，這樣符合標準簡譜時值標記。
14. 作為讀譜者，我想讓八分音符在數字下方顯示一條底線，十六分音符顯示兩條底線，均以 SVG path 繪製，確保精確對齊。
15. 作為讀譜者，我想讓 ABC 原文中相連的八分音符（如 `E/F/C/D/`）共用一條連貫底線，視覺上形成「連梁」，符合簡譜書寫慣例。
16. 作為讀譜者，我想讓 ABC 原文中以空白分隔的音符（如 `C/ D/ E/`）各自獨立顯示底線，不形成連梁。
17. 作為讀譜者，我想讓附點音符在數字右側顯示一個圓點（`.`），這樣我能識別附點時值。

### 行首標記（Jianpu Staff Header）

18. 作為讀譜者，我想在每行簡譜聲部開頭看到調名標記（如 `1=G`），這樣我知道當前的 do 是哪個音。
19. 作為讀譜者，我想在行首標記中看到拍號（如 `4/4`），這樣我知道節拍結構。
20. 作為讀譜者，我想讓簡譜的小節線 x 位置與同行五線譜聲部完全對齊，方便兩譜對照。

### 聲部高度

21. 作為排版者，我想讓簡譜聲部的高度根據實際出現的最大八度偏移動態調整，這樣上下方的八度點有足夠空間，不與相鄰聲部重疊。

---

## Implementation Decisions

### Type 系統

- `ClefType` 新增 `"jianpu"` 成員，使其成為 parser 合法接受的譜號類型。
- `KeySigElement` 新增 `root?: string` 欄位（大調主音音名，如 `'C'`、`'G'`、`'Bb'`），由 parse header 階段填入，Write 層讀取。此欄位不影響 Layout 或 MIDI 生成。

### Parser 層

- `getClef()` 新增 `jianpu` 分支，使 `clef=jianpu` 不再產生 "Unknown clef" 警告。
- 解析 `K:` 欄位後，根據升降號數量（五度圈規則）計算大調主音並填入 `KeySigElement.root`。小調/modal key 取其相對大調主音（`K:Am` → root=`'C'`）。
- 解析 `V:` 行時，辨識 `octave=N` 參數並存入 voice metadata。

### Layout 層

- `ABCVoiceElement` 新增 `clef: ClefType`（預設 `'treble'`）與 `jianpuOctave?: number` 兩個屬性，由 Layout 層建立 voice 時從 staff 資訊填入。
- jianpu voice 的 layout 計算（x 座標、間距、`startBeam`/`endBeam`）與 treble 完全相同，**不做特殊處理**。

### Write 層（核心渲染）

- **渲染分流點**：在 `ABCVoiceElement.draw()` 開頭判斷 `this.clef === 'jianpu'`，若是則走 jianpu 專屬繪圖路徑並提前 return，不執行五線譜繪製邏輯。
- **五線不繪製**：jianpu staff 不繪製五條五線；`ABCStaffGroupElement.draw()` 對 jianpu staff 跳過 `printStave()` 呼叫。
- **pitch → Scale Degree 演算法**（純函數，無副作用）：
  - `diatonicPitch = pitch % 7`（取音名，去八度）
  - `octaveDelta = Math.floor(pitch / 7) - refOctave`（相對基準八度的偏移）
  - `degree = ((diatonicPitch - rootDiatonic + 7) % 7) + 1`
  - Chromatic 判斷：note 的 `accidental` 不為空且不在當前 `KeySigElement.accidentals` 列表中。
- **SVG 元素類型**：數字以 `text` 元素繪製；♯/♭ glyph 複用現有 `abc_glyphs.ts` 的 Emmentaler glyph 路徑；八度點、延音線、底線均以 `path` 元素繪製。
- **連梁判斷**：遍歷 children 時，收集 `startBeam` 到 `endBeam` 之間的 x 範圍，繪製共用底線；非 beam group 的短音符各自繪製獨立底線。
- **Jianpu Staff Header**：每行首個 element 前，在 jianpu voice 自己的 y 座標位置插入 `1=G`（由 `KeySigElement.root` 推算）及拍號文字。

### 和弦音符

- `[CEG]` 等和弦在 jianpu 中**只顯示最高音**（`pitches` 陣列最後一個元素）。此為台灣簡譜旋律聲部慣例，以簡潔為主。

---

## Testing Decisions

### 什麼是好的測試

- 只測**外部行為**（SVG 輸出是否正確），不測 class 內部狀態或私有方法。
- 對 `pitchToJianpu()` 這個純函數做獨立單元測試——輸入 `(pitch, root, refOctave)`，驗證輸出的 `degree`、`octaveDelta`、`isChromatic` 三個值，因為這是整個功能的核心演算法。

### 測試接縫（Seams）

1. **DrawLog / Stage D**（最高接縫，優先）：使用現有 `mockPaper` 基礎設施，捕捉 `ABCVoiceElement.draw()` 輸出的完整 SVG 指令序列，與 golden snapshot 比對。此接縫已涵蓋整個 jianpu 渲染 pipeline，且與現有回歸測試結構完全一致。
2. **`pitchToJianpu()` 純函數**（低層單元）：直接 import 呼叫，不需要任何 mock，用 table-driven 測試覆蓋所有邊界情況。

### Golden Snapshot 測試案例清單

- `K:C` 大調：C D E F G A B c（度數 1–7 + 高八度 1̄）
- `K:G` 大調：G A B c d e f# g（度數 1–7，f# 不加記號）
- `K:G` 大調 + chromatic：`F♮`（顯示 ♮4）
- `K:Am` 小調：A B c d（顯示 6 7 1̄ 2̄）
- 時值：全音符、二分、四分、八分（連梁 vs 獨立）、十六分、附點
- 多八度：跨 3 個八度，驗證點數正確

### 回歸（不可破壞）

- 所有現有 Stage A/B（AST）測試必須 100% pass，確認 parser 新增 `root` 欄位不影響現有結構。
- 所有現有 Stage D（DrawLog）無 jianpu 的測試案例，SVG 輸出必須 0 差異。

---

## Out of Scope

- **歌詞（Lyrics）對齊**：簡譜聲部的歌詞排版不在本 spec 範圍。
- **MIDI 輸出**：jianpu 聲部不影響 MIDI 生成，`abc_midiwriter.ts` 不需修改。
- **裝飾音（Grace Notes）**：小音符的簡譜呈現暫不實作。
- **多聲部和弦縱向疊放**：複雜和聲在 jianpu 的垂直疊放數字顯示不在本 spec。
- **連音線（Slurs / Ties）**：jianpu 的弧線渲染留待後續。
- **重複記號（Endings）**：`[1` `[2` 等反覆記號的 jianpu 視覺處理不在本 spec。

---

## Further Notes

- `abc_parser_lint.ts` 的 schema 驗證中，clef 欄位的合法值列表需同步加入 `"jianpu"`，否則 Stage B lint 驗證會誤報 error。
- `calcMiddle('jianpu', 0)` 應回傳 `0`（與 treble 同），因 layout 層不依賴 jianpu 的 `verticalPos` 計算音符位置。
- 術語定義以 [CONTEXT.md — 簡譜渲染子系統](file:///c:/Users/sunny/Desktop/abcMain/abcTS/CONTEXT.md#L24) 為準。
