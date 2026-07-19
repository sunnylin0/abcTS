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

---
## [2026-07-19 13:17:00] 解決 pnpm run dev 啟動錯誤

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **修改 HTML 的 DOCTYPE**
   - 將 `src/workspace.html` 的第一、二行變更為標準 HTML5 DOCTYPE。
2. **清除專案中 JSON 的 BOM 字符**
   - 撰寫一小段 Node.js 程式碼，讀取 `package.json`、`tsconfig.json`、`ts_2JS.json`，若檢測到開頭有 UTF-8 BOM 簽名（`0xEF, 0xBB, 0xBF`），則將其移除並重新寫入。
3. **重啟開發伺服器驗證**
   - 執行 `pnpm run dev`，確保伺服器能夠正常啟動且不會有 runtime 解析報錯。

### 影響檔案 (Affected Files)
- `src/workspace.html` (修改)
- `package.json` (移除 BOM)
- `tsconfig.json` (移除 BOM)
- `ts_2JS.json` (移除 BOM)

### 風險評估 (Risks & Mitigations)
- 更改 DOCTYPE 可能微幅影響舊版 IE 的相容模式，但在現代開發環境（Vite 6 開發階段）這是必須的，且對現代瀏覽器無負面影響。

---
## [2026-07-19 14:57:00] 重構打包入口與配置分離至 index.ts

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **建立新入口檔 `src/index.ts`**
   - 列出所有原本在 `vite.config.ts` 中的 `filesToBundle` 作為 ES 靜態 `import`。
   - 在底部聲明全域變數（以 `declare const` 避免 IDE 報紅線），並實作 `window` 全域變數的掛載邏輯。
2. **重構 `vite.config.ts`**
   - 將 UMD 入口修改為 `src/index.ts`。
   - 簡化 Vite 插件 `abcjs-bundle-plugin`。當載入 `src/index.ts` 時，利用正則表達式提取出裡面的 `import './xxx'` 語句，並動態將這些檔案的內容拼接起來，而不需要在設定檔中維護硬編碼的陣列。
   - 調整 `copy-workspace-assets` 插件，在替換 html 時針對 `./index.ts` 進行取代，並在排除打包清單中移除 `index.ts` 與 `main.ts`。
3. **更動 HTML 配置與清理舊檔**
   - 修改 `src/workspace.html` 將載入的腳本更換為 `index.ts`。
   - 刪除已無作用 of `src/main.ts` 檔案。

### 影響檔案 (Affected Files)
- `src/index.ts` (新增)
- `src/workspace.html` (修改)
- `vite.config.ts` (修改)
- `src/main.ts` (刪除)

### 風險評估 (Risks & Mitigations)
- 虛擬模組從 `virtual:abcjs-basic` 轉變為直接替換 `src/index.ts` 的載入。
  - *對策*：確認編譯後的代碼依然包含了全部的變數掛載，且 `pnpm run build` 成功。

---
## [2026-07-19 15:06:00] 將 TS 模組更換為具名導入

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **導出原有 TS 類別與變數**
   - 修改 `src/abc_parser_lint.ts`：為 `class AbcParserLint` 加上 `export`。
   - 修改 `src/play_embedded.ts`：為 `class PlayEmbedded` 加上 `export`.
   - 修改 `src/application.ts`：為 `abcParser` 與 `processAbc` 加上 `export`。
2. **在 `src/index.ts` 中切換為具名載入**
   - 移除 `declare const ABCEditor`, `AbcTuneBook`, `AbcParse`, `AbcParserLint`, `PlayEmbedded`, `abcParser`, `processAbc` 等全域聲明。
   - 變更為對應 TS 模組的具名 `import { ... }` 導入。
   - 純 JS 的 `jsonschema-b4.js` 模組不使用 `export`，故在 `src/index.ts` 保留 `declare const JSONSchema: any;` 以消除 IDE 報錯。
3. **優化 `vite.config.ts` 中的拼接正則**
   - 將 `importRegex` 修改為 `/import\s+(?:(?:\{[^}]+\}|\w+|\*\s+as\s+\w+)\s+from\s+)?['"]\.\/([^'"]+)['"];?/g`，使它能同時識別無副作用導入以及具名模組導入，確保動態文件拼接在打包時不遺漏任何檔案。

### 影響檔案 (Affected Files)
- `src/abc_parser_lint.ts` (修改)
- `src/play_embedded.ts` (修改)
- `src/application.ts` (修改)
- `src/index.ts` (修改)
- `vite.config.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 更改正則可能會影響打包拼接的檔案解析。
  - *對策*：運行 `pnpm run build` 確認 UMD bundle 包含全部 class 且大小正常。

---
## [2026-07-19 17:15:00] 分析 ABCJS 專案架構與渲染機制

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **源碼研讀與追蹤**
   - 從前端 HTML (`workspace.html`) 到核心控制器 (`abc_editor.ts`)，追蹤數據綁定與 Debounce 渲染邏輯。
   - 分析 AST 解析管道，梳理 `abc_tunebook.ts`、`abc_tokenizer.ts`、`abc_parse.ts` 與 `abc_tune.ts` 的職責。
   - 梳理繪圖引擎與排版佈局的互動（`abc_layout.ts`、`svg.ts`、`abc_glyphs.ts` 與 `abc_write.ts`）。
2. **輸出分析成果**
   - 建立並撰寫 `analysis_results.md`，提供完整的功能對照表、樂譜參數傳遞時序流、模組職責以及針對效能、架構與音訊播放器的優化建議。

### 影響檔案 (Affected Files)
- `analysis_results.md` (新增)

### 風險評估 (Risks & Mitigations)
- 無代碼修改風險。

---
## [2026-07-19 17:25:00] 解決 ABCElement 與 NoteElement 型別衝突

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **分析兩介面的欄位衝突**
   - `chord`: `NoteElement` 與 `BarElement` 宣告為 `string`，而 `ABCElement` 宣告為 `Chord`。
     - *方案*：依據 `abc_parse.ts` 中和弦解析的邏輯 `el.chord = { name: ..., position: ... }`，將所有 `chord` 統一改為 `Chord` 介面型別。
   - `decoration`: `NoteElement` 使用 `Decoration[]`，而 `ABCElement` 使用 `string[]`。
     - *方案*：將所有的裝飾線 `decoration` 統一改為 `string[]` 以提供最大相容性。
   - `gracenotes`: `NoteElement` 使用 `NoteElement[]`，而 `ABCElement` 與 `Voice_Staff_voices` 使用 `GraceNote[]`。
     - *方案*：考慮到裝飾音同樣擁有完整音符屬性與計算，將兩者統一修改為 `NoteElement[]`。
   - `pitches`: `NoteElement` 使用硬編碼的 inline 物件陣列，而 `ABCElement` 使用 `Pitch[]`。
     - *方案*：統一改為 `Pitch[]`。
   - `startSlur` / `endSlur`: 因為在 `abc_tune.ts` 的 `cleanUp` 執行前後，這兩個屬性會從 `number` 被轉換成 `number[]`。
     - *方案*：在 `Pitch`、`NoteElement` 和 `ABCElement` 介面中將其類型統一為 `number | number[]`。

### 影響檔案 (Affected Files)
- `src/all.d.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 變更欄位型別可能導致其他檔案有新的 TS 錯誤。
  - *對策*：運行 `pnpm run build` 確認打包編譯無任何語法與構建問題。

---
## [2026-07-20 01:50:00] abc_parse.ts & abc_tune.ts 型別精煉與 any 清理

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **分析 `el` 型別**：
   - 經分析，`el` 被廣泛用於接收 note 和 bar 解析後的特質屬性，最終在 1248 行被寫入為樂譜的元素。其目標參數型別為 `ABCElement`。因此將 `el` 從 `any` 提升為 `ABCElement`。
2. **重構 `all.d.ts` 定義專屬解析介面**：
   - 定義 `ParseStaff` 與 `ParseVoice` 以承載解析器專用的屬性結構，解除 `staves: any[]` 和 `voices: { [key: string]: any }` 的泛型限制。
   - 定義 `SlursAndTriplets` 介面，以精確表示連音與三連音解析函數 `letter_to_open_slurs_and_triplets` 的傳回型別。
3. **消除 `abc_tune.ts` 與 `abc_parse.ts` 內的 any 宣告**：
   - 清理 `pushNote(hp)` 裡的 `any`，並對 `pitches` & `gracenotes` 屬性賦值增加預防性 Fallback (型別防禦)。
   - 清理 `addEndSlur` 與 `addStartSlur` 內的 `any`。
   - 將 `word_list: any` 更換為 `Lyric[]`，將 `gracenotes: any` 更換為 `NoteElement[]`。

### 影響檔案 (Affected Files)
- `src/all.d.ts` (修改)
- `src/abc_tune.ts` (修改)
- `src/abc_parse.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 泛型改強型別可能帶來額外的屬性缺漏報錯。
  - *對策*：在 TypeScript 編譯期進行全面的 `pnpm run build` 打包與語法靜態檢查。

---
## [2026-07-20 02:00:00] ABCElement & NoteElement 繼承結構重構與優化

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **建立繼承鏈**：
   - 將 `ABCElement` 聲明修改為 `interface ABCElement extends ElementBase`。
   - 自 `ABCElement` 內刪除已在 `ElementBase` 中宣告的 `startChar?: number` 與 `endChar?: number`。
2. **極簡化 `NoteElement` 定義**：
   - 將 `NoteElement` 修改為 `interface NoteElement extends ABCElement`。
   - 將 `accidental?: NoteAccidental` 與 `verticalPos?: number` 欄位移至 `ABCElement` 中，確保屬性全集覆蓋。
   - 清空 `NoteElement` 內部重複的所有屬性，僅保留 `el_type?: "note"`。
3. **驗證相容性**：
   - 運行 TypeScript 項目編譯測試。

### 影響檔案 (Affected Files)
- `src/all.d.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 無編譯風險，屬性集與修改前 100% 等價。

---
## [2026-07-20 02:05:00] 精煉 all.d.ts 下屬元素繼承關係與隱患修正

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **排查隱性衝突**：
   - `BarElement.startEnding` 原宣告為 `boolean`，但程式實際賦值與 `abc_layout` 排版使用的是 `string`。
   - `RestElement.chord` 原宣告為 `string`，但程式內部和弦統一以 `{ name, position }` 物件（即 `Chord`）傳遞。
2. **統一繼承主幹**：
   - 將 `RestElement`、`BarElement`、`ClefElement`、`KeySigElement`、`MeterElement` 改為繼承自 `ABCElement`。
   - 藉由繼承，自動收納與對齊了 `ABCElement` 中早已正確定義的 `startEnding?: string`、`chord?: Chord`、`decoration?: string[]` 等共用屬性。
   - 清除各子元素中重複且過時的屬性宣告。
3. **編譯測試**：
   - 執行建置，確保渲染及播音代碼無報錯。

### 影響檔案 (Affected Files)
- `src/all.d.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 無編譯風險。

---
## [2026-07-20 02:10:00] 修復 abc_tune.ts 中的型別紅線與重大邏輯隱患

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **修正邏輯與引數錯誤**：
   - 將 `cleanUp` 內的 `cleanUpSlursInLine(this.lines[this.lineNum])` 改為 `cleanUpSlursInLine(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum])`，確保 slur 清理邏輯實際在聲部陣列上被執行。
   - 修正 clef 判定屬性 `el.type` 為 `el.el_type`，並使用 `as unknown as ClefElement` 型別斷言以消除 IDE 對 `fixClefPlacement(el)` 參數的報錯。
2. **修正變數型別混淆**：
   - 修正 `potentialStartBeam` 與 `potentialEndBeam` 的型別為 `ABCElement`，因為這兩者是 Note 實體而非 Beam 圖形元素。
   - 修正 `getDuration(el)` 參數型別為 `ABCElement`。
3. **消除 Optional 造成的 Undefined 報錯**：
   - 在 `appendElement` 內以 `hashParams2 || {}` 進行賦值，保證 `hashParams` 不是 `undefined`。

### 影響檔案 (Affected Files)
- `src/abc_tune.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 改動涉及變數型別對齊與重構，無破壞性變更，已成功編譯。

---
## [2026-07-20 04:30:00] 修復 abc_parse.ts 內與 all.d.ts 的型別紅線與大小寫/拼寫錯誤

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **修正全域型別不一致 (all.d.ts)**：
   - 擴充 `Lyric` 介面，使其支援 `skip?: boolean` 與 `to?: 'next' | 'slur' | 'bar'` 屬性。
   - 修正 `NoteAccidental` 列舉，移去底線，統一為：`'flat' | 'natural' | 'sharp' | 'dblsharp' | 'dblflat' | 'quarterflat' | 'quartersharp' | 'none'`。
   - 修正 `ParamsOther` 內 `bracket` 與 `brace` 的型別為 `string`，與 `Staff` 一致。
   - 擴展 `ABCElement` 中 `rest` 的定義，以支援 slur 與 tie 連線。
   - 修正 `barNumber` 型別為 `number | string`。
2. **修復 abc_parse.ts 的拼寫與型別宣告**：
   - 修改 `MultilineVars.key` 型別為 `KeySigElement`。
   - 將 size-effect 的 `grace_notes` 與 `graceNotes` 修正為小寫 `gracenotes`。
   - 在 `pitch.startSlur`、`pitch.endSlur` 等自增/加法算式上，以型別斷言指明其在解析當下的 `number` 型別。

### 影響檔案 (Affected Files)
- `src/all.d.ts` (修改)
- `src/abc_parse.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 屬於型別對齊與拼寫糾正，無破壞性變更，已成功編譯打包。

---
## [2026-07-20 04:35:00] 統一與對齊 deepCopyKey、addPosToKey 及 startNewLine 的型別簽章

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **修正 AbcParseHeader 輔助方法型別**：
   - 將 `deepCopyKey` 的參數改為音符陣列，返回型別定義為 `KeySigElement`。
   - 將 `addPosToKey` 和 `fixKey` 的調號參數由強約束的 `{ accidentals: ... }` 放寬為 `KeySigElement`，以適配 `params.key` 的輸入。
2. **統一 startNewLine 介面簽章**：
   - 在 `abc_tune.ts` 中將 `startNewLine` 的參數由行內展開型別改為使用全域 `ParamsOther`，使 `abc_parse.ts` 調用時的 `params: ParamsOther` 不再產生 any 型別衝突。

### 影響檔案 (Affected Files)
- `src/abc_parse_header.ts` (修改)
- `src/abc_tune.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 纯型別定義修正，已通過 `npx tsc --noEmit` 驗證。

---
## [2026-07-20 04:42:00] 修復 M: (Meter) 拍號與 origMeter 的型別宣告

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **修正 MeterElement 屬性定義**：
   - 由於拍號可能包含括號等字串型態的複雜表示，且解析器本身也提取出 token 字串來做賦值，因此在 `all.d.ts` 內將 `MeterElement.value` 中的 `num` 與 `den` 型別自 `number` 更改為 `string`。
2. **清除 MultilineVars 剩餘的 any 欄位**：
   - 將 `abc_parse.ts` 內 `origMeter` 的 `any` 型別指定為 `MeterElement | null`。

### 影響檔案 (Affected Files)
- `src/all.d.ts` (修改)
- `src/abc_parse.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 屬於型別修正，已通過 `npx tsc --noEmit` 驗證。

---
## [2026-07-20 04:45:00] 修復 abc_parse_header.ts 中的模組與類別型別錯誤

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **補齊模組導入**：
   - 由於 `abc_parse_header.ts` 中使用了導出的模組類別 `AbcTokenizer` 與 `AbcTune`，在未導入的情況下，雖然全局編譯可解析，但在模組型編輯器中會報出 `Cannot find name` 紅色警報。因此在其頂部補上 `import { AbcTune } from "./abc_tune"` 與 `import { AbcTokenizer } from "./abc_tokenizer"`。
2. **擴充 KeySignature 選項**：
   - 於 `all.d.ts` 中為 `KeySignature.acc` 型別補齊支援 `"natural"`、`"dblsharp"`、`"dblflat"`、`"quarterflat"` 以及 `"quartersharp"`，消除調號定義不相符警告。
3. **擴展全域 Array prototype 宣告**：
   - 於 `all.d.ts` 全域宣告 `interface Array<T> { last(): T; }`，避免 IDE 對程式中大量使用的 `.last()` 方法發出型別警告。

### 影響檔案 (Affected Files)
- `src/abc_parse_header.ts` (修改)
- `src/all.d.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 屬於型別對齊與環境宣告修正，已通過實測並保證正常打包。

---
## [2026-07-20 04:52:00] 修復 abc_parse_header.ts 第二階段之類別與屬性型別錯誤

### 步驟與技術方案 (Step-by-step Technical Plans)
1. **補齊屬性結構與欄位**：
   - 於 `all.d.ts` 內的 `KeySigElement.accidentals` 陣列元素補上 `verticalPos?: number;`。
   - 於 `all.d.ts` 中的 `ParseStaff` 補上 `index`、`spacing_below_offset` 與 `verticalPos`，在 `ParseVoice` 中補上 `suppressChords`，以符合 header 解析時的物件操作。
2. **清除 Header 標記的 Token 警告**：
   - 在 `abc_parse_header.ts` 當中建立專門的 `HeaderToken` 介面，並在 tokenize 時將其轉型為 `HeaderToken[]`，確保其 properties 在編譯時是非選填且型別安全的。
3. **對齊 TempoInfo 陣列宣告**：
   - 由於 tempo 在計算乘積時使用陣列，將 `all.d.ts` 中的 `TempoInfo.duration` 修正為 `number[]`。
4. **方法介面解耦與型別斷言**：
   - 將 `abc_tune.ts` 中的 `appendElement` 第四個參數型別調整為 `NOTES_Element` 聯集。
   - 於 `abc_parse_header.ts` 對 `appendElement` 的呼叫以 `as unknown as TempoElement` 進行斷言，解決 type-mismatch。

### 影響檔案 (Affected Files)
- `src/all.d.ts` (修改)
- `src/abc_parse_header.ts` (修改)
- `src/abc_tune.ts` (修改)
- `src/abc_parse.ts` (修改)

### 風險評估 (Risks & Mitigations)
- 無功能邏輯破壞，僅提升型別覆蓋率，且 `pnpm run build` 通過。
