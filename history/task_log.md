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

---
## [2026-07-19 13:17:00] 解決 pnpm run dev 啟動錯誤

### 目標 (Objectives)
- 排除 `pnpm run dev` 啟動時的 HTML 解析與 PostCSS 配置載入錯誤。

### 需求 (Requirements)
1. 修正 `src/workspace.html` 的 DOCTYPE 與 `html` 標籤，使其符合標準 HTML5 規範以通過 Vite 6 的 parse5 嚴格解析。
2. 檢查並移除專案內 JSON 檔案（如 `package.json`, `tsconfig.json` 等）所包含的 UTF-8 BOM 字符，避免 Vite 載入設定時報錯。

### 驗收條件 (Acceptance Criteria)
- `pnpm run dev` 能夠順利啟動，無任何 HTML 解析或 JSON 格式錯誤，且伺服器能正常運行於本機埠。

---
## [2026-07-19 14:57:00] 重構打包入口與配置分離至 index.ts

### 目標 (Objectives)
- 將 `vite.config.ts` 中過多的打包檔案清單與全域掛載邏輯，整理分類至 `src/index.ts`。

### 需求 (Requirements)
1. 建立 `src/index.ts` 作為新的打包入口。
2. 將 `vite.config.ts` 中的 `filesToBundle`（檔案清單）改以 ES `import` 形式移入 `src/index.ts`。
3. 將全域變數的 `window` 掛載邏輯移入 `src/index.ts` 底部。
4. 簡化 `vite.config.ts`，利用正則表達式在載入 `src/index.ts` 時動態解析並拼接檔案。
5. 刪除原有的 `src/main.ts`。
6. 更新 `src/workspace.html` 以導入 `src/index.ts`。

### 驗收條件 (Acceptance Criteria)
- 執行 `pnpm run build` 可以順利編譯出 UMD 格式的 `abcjs-basic.js`。
- 執行 `pnpm run dev` 可以正常啟動 Vite 開發伺服器。
- 整個過程中沒有型別或載入錯誤。

---
## [2026-07-19 15:06:00] 將 TS 模組更換為具名導入

### 目標 (Objectives)
- 將 `src/index.ts` 內的所有 TypeScript 檔案替換為具名的 `import { ClassName }` 導入以消除 IDE 型別紅線，並理順純 JS 檔案與 TS 模組的混用架構。

### 需求 (Requirements)
1. 在原本沒有 export 的 TS 檔案（`abc_parser_lint.ts`, `play_embedded.ts`, `application.ts`）中加入 `export` 關鍵字。
2. 修改 `src/index.ts`，將所有 TS 模組皆變更為具名載入，完全移除它們的 `declare const` 宣告。
3. 對於純 JS 的 `jsonschema-b4.js`（無導出），在 `src/index.ts` 中保留 `declare const JSONSchema: any;` 聲明。
4. 修改 `vite.config.ts` 中的 `importRegex` 正則表達式，使其能完美匹配並拼接具名載入（`import { ... } from './...'`）與無副作用導入。

### 驗收條件 (Acceptance Criteria)
- `index.ts` 中所有 TS 類別與變數皆已更換為具名載入且無型別紅線。
- `pnpm run build` 與 `pnpm run dev` 正常運作無解析錯誤。

---
## [2026-07-19 17:15:00] 分析 ABCJS 專案架構與渲染機制

### 目標 (Objectives)
- 分析 `workspace.html` 的 ABC 渲染結構、數據傳遞與各模組職責，並針對專案提供重構與優化建議。

### 需求 (Requirements)
1. 深入分析 `select` 下拉選單中樂譜參數如何傳遞至 ABC AST，並繪製成 SVG 的流向。
2. 梳理各 TS/JS 檔案在系統中的定位、職責與各自渲染的 DOM 元件。
3. 撰寫一份結構化、易於理解的專案架構分析報告。

### 驗收條件 (Acceptance Criteria)
- 完成 `analysis_results.md` 分析報告並交付使用者。

---
## [2026-07-19 17:25:00] 解決 ABCElement 與 NoteElement 型別衝突

### 目標 (Objectives)
- 重構並解決 `src/all.d.ts` 中 `ABCElement` 與 `NoteElement` 因欄位定義不一致所引起的型別衝突。

### 需求 (Requirements)
1. 梳理 `ABCElement` 與 `NoteElement` 重疊的屬性，如 `decoration`、`gracenotes`、`pitches`、`chord`、`startSlur`、`endSlur`。
2. 統一修改其型別，確保兩者互相相容且與專案邏輯一致（如 `chord` 改為 `Chord` 物件，連音線 `startSlur`/`endSlur` 改為 `number | number[]` 以相容前後期轉換）。
3. 確保 `abc_graphelements.ts`、`abc_layout.ts`、`abc_tune.ts`、`abc_parse.ts`、`abc_midiwriter.ts` 不再有因上述兩者不相容而產生的型別衝突。

### 驗收條件 (Acceptance Criteria)
- 修改 `src/all.d.ts` 中的介面宣告。
- `pnpm run build` 與開發伺服器均正常運作。

---
## [2026-07-20 01:50:00] abc_parse.ts & abc_tune.ts 型別精煉與 any 清理

### 目標 (Objectives)
- 分析 `abc_parse.ts:L910` 變數 `el` 之設計意圖並對其強型別化，清除並重構 `abc_parse.ts` 與 `abc_tune.ts` 內的大量 `any` 宣告，全面提昇代碼型別安全與健壯性。

### 需求 (Requirements)
1. 經分析 `el` 在 `abc_parse.ts` 內的生命週期，確認其主要承載 Note 元素屬性並被傳入 `appendElement`，將其型別明確改為 `ABCElement`。
2. 尋找並清除 `abc_parse.ts` 和 `abc_tune.ts` 中的 `any` 型別：
   - 清除並重構 `abc_tune.ts` 裡的 `hp`、`cleanUpSlursInLine` 的 `obj` 與 `num`、`appendStartingElement` 的 `hashParams`、`setCurrentStaff` 的 `opt`。
   - 在 `all.d.ts` 內定義 `ParseStaff` 與 `ParseVoice` 介面，以替換 `abc_parse.ts` 內 `staves`、`voices`、`currentVoice` 和 `inTieChord` 等處的 `any` 宣告。
   - 將 `letter_to_open_slurs_and_triplets`、`addWords`、`letter_to_grace` 內的變數（如 `ret`、`word_list`、`gracenotes`）完全強型別化。

### 驗收條件 (Acceptance Criteria)
- 清理所有指定 `any` 宣告。
- `pnpm run build` 通過無誤。

---
## [2026-07-20 02:00:00] ABCElement & NoteElement 繼承結構重構與優化

### 目標 (Objectives)
- 重構 `ABCElement` 與 `NoteElement` 的宣告，消除欄位重複定義，建立清晰的 TypeScript 繼承階層。

### 需求 (Requirements)
1. 讓 `ABCElement` 繼承 `ElementBase`，並移除 `ABCElement` 中手寫重複的 `startChar`、`endChar` 屬性。
2. 讓 `NoteElement` 直接繼承 `ABCElement`，並鎖定其 `el_type?: "note"`。
3. 移除 `NoteElement` 內部與 `ABCElement` 100% 重複的屬性定義，使代碼精簡，防止未來型別不同步。
4. 確保 `abc_parse.ts`、`abc_tune.ts` 等使用到這些型別的程式碼能完美編譯。

### 驗收條件 (Acceptance Criteria)
- `NoteElement` 的定義成功簡化為只鎖定 `el_type?: "note"`。
- `pnpm run build` 建置成功通過。

---
## [2026-07-20 02:05:00] 精煉 all.d.ts 下屬元素繼承關係與隱患修正

### 目標 (Objectives)
- 分析 `all.d.ts` 內各元素型別的屬性一致性，解決其在 `abc_tune.ts`、`abc_parse.ts`、`abc_layout.ts` 與 `abc_write.ts` 內的潜在型別隱患。

### 需求 (Requirements)
1. 經排查，找出 `BarElement.startEnding?: boolean` 與 `RestElement.chord?: string` 的歷史遺留錯誤宣告，將其修正為正確的 `string` 與 `Chord` 物件型別。
2. 讓 `RestElement`、`BarElement`、`ClefElement`、`KeySigElement` 與 `MeterElement` 全部統一直接繼承 `ABCElement`。
3. 確保專案中這 4 個核心檔案能安全編譯，達成型別的完全對齊。

### 驗收條件 (Acceptance Criteria)
- `RestElement` 等元素均正確繼承 `ABCElement`。
- `pnpm run build` 通過無誤。

---
## [2026-07-20 02:10:00] 修復 abc_tune.ts 中的型別紅線與重大邏輯隱患

### 目標 (Objectives)
- 清理 `abc_tune.ts` 內的 IDE 警告紅線，消除潛在的型別安全盲區。

### 需求 (Requirements)
1. 修復 `cleanUpSlursInLine` 呼叫傳入 `ABCLine` 而非其下聲部（`NoteElement[]`）的重大邏輯錯誤。
2. 修正 `fixClefPlacement(el)` 判定中使用 `el.type === 'clef'` 為 `el.el_type === 'clef'`，並使用轉型確保型別匹配。
3. 將 `potentialStartBeam` 與 `potentialEndBeam` 型別自 `ABCBeamElem` 糾正為 `ABCElement`。
4. 解除 `appendElement` 的 `hashParams?: ABCElement` 的可選型別造成可能為 `undefined` 的警告。
5. 確保 TypeScript 編譯無誤。

### 驗收條件 (Acceptance Criteria)
- `abc_tune.ts` 內的所有紅線消除.
- `pnpm run build` 通過。

---
## [2026-07-20 04:30:00] 修復 abc_parse.ts 內與 all.d.ts 的型別紅線與大小寫/拼寫錯誤

### 目標 (Objectives)
- 清理 `abc_parse.ts` 內的 IDE 警告紅線，統一屬性大小寫與正確繼承欄位。

### 需求 (Requirements)
1. 修正 `MultilineVars.key` 型別為 `KeySigElement`，以適應 L87 的初始化。
2. 擴充全域 `Lyric` 介面，支援 `skip?: boolean` 與 `to?: 'next' | 'slur' | 'bar'` 屬性，消除歌詞解析時的物件推入報錯。
3. 修正 accidental 字串列舉在代碼中使用無底線格式（如 `'dblsharp'`），在 `all.d.ts` 的 `NoteAccidental` 予以統一。
4. 修復大小寫不一致及拼寫錯誤，如將 `grace_notes` 與 `graceNotes` 全數修正為 `gracenotes`。
5. 擴充 `rest` 型別定義，增加 `endSlur`、`endTie`、`startSlur`、`startTie` 等連線屬性。
6. 修正 `brace` 與 `bracket` 型別在 `ParamsOther` 與 `Staff` 之間的不一致（皆改為 `string`）。
7. 將 `pitch.startSlur`、`pitch.endSlur` 等 `++` / `+=` 運算添加合適的型別斷言。

### 驗收條件 (Acceptance Criteria)
- `abc_parse.ts` 與 `all.d.ts` 內無任何紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 04:35:00] 統一與對齊 deepCopyKey、addPosToKey 及 startNewLine 的型別簽章

### 目標 (Objectives)
- 優化及對齊 `deepCopyKey`、`addPosToKey` 與 `startNewLine` 跨模組呼叫時的型別宣告。

### 需求 (Requirements)
1. 修正 `deepCopyKey` 的參數型別為 `{ acc?: any, note?: any, verticalPos?: number }[]`，回傳型別為 `KeySigElement`。
2. 修正 `addPosToKey` 參數，將其傳入的 `key` 宣告為 `KeySigElement`。
3. 修正 `startNewLine` 的參數簽章，直接採用全域的 `ParamsOther`，消除行參數散落各檔案重複宣告造成的型別不一致。

### 驗收條件 (Acceptance Criteria)
- `abc_parse.ts` 與 `abc_tune.ts` 間的型別呼叫對接無紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 04:42:00] 修復 M: (Meter) 拍號與 origMeter 的型別宣告

### 目標 (Objectives)
- 修正拍號 `value.num` 與 `value.den` 型別定義，以適配字串賦值並移除 `origMeter` 的 `any` 宣告。

### 需求 (Requirements)
1. 將 `all.d.ts` 中的 `MeterElement.value` 屬性定義從數值 `number` 改為字串 `string`。
2. 將 `abc_parse.ts` 內的 `origMeter` 型別從 `any` 修正為 `MeterElement | null`。

### 驗收條件 (Acceptance Criteria)
- `abc_parse.ts` (L87-L89) 對拍號賦值為 `'4'` 時無紅線報錯。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 04:45:00] 修復 abc_parse_header.ts 中的模組與類別型別錯誤

### 目標 (Objectives)
- 清除 `abc_parse_header.ts` 在編輯器中的所有紅色波浪虛線警告。

### 需求 (Requirements)
1. 在 `abc_parse_header.ts` 頂部加入 `import { AbcTune } from "./abc_tune"` 與 `import { AbcTokenizer } from "./abc_tokenizer"`，修復 IDE 無法解析外部導出類別的問題。
2. 擴充 `KeySignature.acc` 型別支援 `"natural"`、`"dblsharp"` 等更多調號表示，避免屬性指派錯誤。
3. 全域擴展 `Array<T>` 介面，宣告 `last(): T` 方法，修復陣列使用 `.last()` 時的 IDE 型別警報。

### 驗收條件 (Acceptance Criteria)
- IDE 內 `abc_parse_header.ts` 檔案內無 any 紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 04:52:00] 修復 abc_parse_header.ts 第二階段之類別與屬性型別錯誤

### 目標 (Objectives)
- 清除 `abc_parse_header.ts` 當中因 index-signature 缺失、型別不相符、可選型別運算及屬性遺漏所引起的所有紅色波浪線警告。

### 需求 (Requirements)
1. 修正 `all.d.ts` 中 `KeySigElement.accidentals` 陣列元素定義，補上 `verticalPos?: number;` 欄位。
2. 於 `abc_parse_header.ts` 中為 `HeaderToken` 宣告專用介面，並將指令 `tokens` 進行強型別轉換以清除其成員屬性（`type`、`token`）可能為 `undefined` 的波浪線。
3. 修正 `all.d.ts` 中的 `ParseStaff` 與 `ParseVoice`，補上 `index`、`spacing_below_offset`、`verticalPos` 與 `suppressChords` 等屬性，使 voice/staff 初始化 `{}` 與賦值安全無虞。
4. 修正 `all.d.ts` 中 `TempoInfo.duration` 定義為 `number[]`（陣列），修復其 `.length` 呼叫錯誤。
5. 修改 `abc_tune.ts` 中的 `appendElement` 的第四個參數為 `NOTES_Element`，並在 `abc_parse_header.ts` 中呼叫時，將 `TempoInfo` 斷言為 `unknown as TempoElement` 以相容於聯集型別。

### 驗收條件 (Acceptance Criteria)
- 所有列舉行在編輯器內皆無紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 11:15:00] 生成功能移植任務之頂級提示詞與測試機制

### 目標 (Objectives)
- 產出一份用於指導後續 AI 進行 `abcjs_20100604` 功能移植至 `abcTS` 任務的「頂級提示詞」Markdown 檔。
- 設計並在提示詞中提供完整的測試與驗證機制（包含靜態編譯、自動化 AST 深度比對腳本、瀏覽器手動測試）。

### 需求 (Requirements)
1. 提示詞需引導 AI 自行使用本地 Git (`git diff --no-index`) 比對原始 JavaScript 同名檔案的差異。
2. 移植時必須採取「最少變更的直譯」原則。
3. 移植時必須確保 TypeScript 強型別化，不得使用 `any`，並在 `all.d.ts` 補齊型別。
4. 移植順序需採用「分檔案/分模組」逐步進行。
5. 需保留並更新 `abcTS/history/` 下的四大歷史紀錄檔案。

### 驗收條件 (Acceptance Criteria)
- 在 `c:\github\abcMain\migration_prompt.md` 產出對應提示詞，且內容完整、規格清晰。

---
## [2026-07-20 11:20:00] 移植 abc_tune.ts 及 all.d.ts 功能與 bug 修正

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_tune.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組。

### 需求 (Requirements)
1. 重構 `cleanUpSlursInLine` 算法，改用 `number[]` 型態的 `currSlur`，並為連音線計算傳入 `chordPos` 以實現多聲部與和弦的獨立連音線處理。
2. 在 `appendElement` 的 beam 結束邏輯中，新增對 `force_end_beam_last` 的判定，以支援強制在「上一個音符」結束 beam 的行為，並在結尾處清除該臨時變數。
3. 在 `all.d.ts` 擴充 `ABCElement` 屬性 `force_end_beam_last?: boolean;`。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過。
- 自動化對比測試 `node test/compare_ast.js` 100% 通過，確保與新版 JS 的 AST 解析輸出完全一致。

---
## [2026-07-20 13:50:00] 移植 abc_parse.ts 及型別調整

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_parse.js` 功能與 bug 修正至 `abcTS`，並微調 `abc_layout.ts` 保持編譯相容。

### 需求 (Requirements)
1. 擴展和弦（Annotations）解析以支援多個和弦（改用 `Chord[]` 陣列），並支援 `<` (left) 與 `>` (right) 方向定位。
2. 當和弦解析後若有空格，設定 `el.force_end_beam_last = true` 以在上一音符正確結束 Beam。
3. 擴展裝飾音符號（Accent），在 `letter_to_accent` 中新增快捷鍵 `L`（accent）與 `P`（pralltriller）。
4. 優化續行符（Line Continuation）正則，用與註解同等長度的空格填充（引進 `continuationReplacement`），避免定位索引（iChar）偏移。
5. 在 `all.d.ts` 擴充 `Chord` 的 `position` 支援左/右方向，並將 `ABCElement.chord` 修改為 `Chord[]`。
6. 同步修改 `abc_layout.ts` 以遍歷 `elem.chord` 陣列，維持專案型別相容與建置編譯成功。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過。
- 分離 context 沙盒後的自動化 AST 對比測試 `node test/compare_ast.js` 100% 通過，確認與新版 JS 解析輸出完全對齊。

---
## [2026-07-20 14:10:00] 移植 abc_parse_header.ts 功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_parse_header.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組。

### 需求 (Requirements)
1. 修正低音譜號 (Bass Clef) 下的調號預設升降音符 (accidentals) 的八度 (octave) 調整邏輯。
2. 在 `metaTextHeaders` 詮釋資料欄位對照中，新增 `'G'` 字元對應 `'group'`。
3. 在 `all.d.ts` 的 `MetaText` 介面中加入 `group?: string;` 欄位以支援型別檢查。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過且無編譯錯誤。
- 專案程式碼邏輯與新版 JS 完全對齊。

---
## [2026-07-20 17:15:00] 移植 abc_graphelements.ts 功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_graphelements.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組，並修正 `abc_layout.ts` 保持編譯與打包一致性。

### 需求 (Requirements)
1. 實作 `ABCVoiceElement.getDurationIndex()` 並於 `ABCStaffGroupElement.layout` 中呼叫，調整多聲部無時值元素（如譜號、調號等）排版優先對齊邏輯。
2. 補齊 `ABCStaffGroupElement.addVoice` 雙引數 `(voice, staffnumber)` 並以 `StaffLayoutInfo` 保存最高與最低音高，且在 `ABCVoiceElement.layoutOneItem` 內動態累計更新邊界。
### 驗收條件 (Acceptance Criteria)
- `NoteElement` 的定義成功簡化為只鎖定 `el_type?: "note"`。
- `pnpm run build` 建置成功通過。

---
## [2026-07-20 02:05:00] 精煉 all.d.ts 下屬元素繼承關係與隱患修正

### 目標 (Objectives)
- 分析 `all.d.ts` 內各元素型別的屬性一致性，解決其在 `abc_tune.ts`、`abc_parse.ts`、`abc_layout.ts` 與 `abc_write.ts` 內的潜在型別隱患。

### 需求 (Requirements)
1. 經排查，找出 `BarElement.startEnding?: boolean` 與 `RestElement.chord?: string` 的歷史遺留錯誤宣告，將其修正為正確的 `string` 與 `Chord` 物件型別。
2. 讓 `RestElement`、`BarElement`、`ClefElement`、`KeySigElement` 與 `MeterElement` 全部統一直接繼承 `ABCElement`。
3. 確保專案中這 4 個核心檔案能安全編譯，達成型別的完全對齊。

### 驗收條件 (Acceptance Criteria)
- `RestElement` 等元素均正確繼承 `ABCElement`。
- `pnpm run build` 通過無誤。

---
## [2026-07-20 02:10:00] 修復 abc_tune.ts 中的型別紅線與重大邏輯隱患

### 目標 (Objectives)
- 清理 `abc_tune.ts` 內的 IDE 警告紅線，消除潛在的型別安全盲區。

### 需求 (Requirements)
1. 修復 `cleanUpSlursInLine` 呼叫傳入 `ABCLine` 而非其下聲部（`NoteElement[]`）的重大邏輯錯誤。
2. 修正 `fixClefPlacement(el)` 判定中使用 `el.type === 'clef'` 為 `el.el_type === 'clef'`，並使用轉型確保型別匹配。
3. 將 `potentialStartBeam` 與 `potentialEndBeam` 型別自 `ABCBeamElem` 糾正為 `ABCElement`。
4. 解除 `appendElement` 的 `hashParams?: ABCElement` 的可選型別造成可能為 `undefined` 的警告。
5. 確保 TypeScript 編譯無誤。

### 驗收條件 (Acceptance Criteria)
- `abc_tune.ts` 內的所有紅線消除.
- `pnpm run build` 通過。

---
## [2026-07-20 04:30:00] 修復 abc_parse.ts 內與 all.d.ts 的型別紅線與大小寫/拼寫錯誤

### 目標 (Objectives)
- 清理 `abc_parse.ts` 內的 IDE 警告紅線，統一屬性大小寫與正確繼承欄位。

### 需求 (Requirements)
1. 修正 `MultilineVars.key` 型別為 `KeySigElement`，以適應 L87 的初始化。
2. 擴充全域 `Lyric` 介面，支援 `skip?: boolean` 與 `to?: 'next' | 'slur' | 'bar'` 屬性，消除歌詞解析時的物件推入報錯。
3. 修正 accidental 字串列舉在代碼中使用無底線格式（如 `'dblsharp'`），在 `all.d.ts` 的 `NoteAccidental` 予以統一。
4. 修復大小寫不一致及拼寫錯誤，如將 `grace_notes` 與 `graceNotes` 全數修正為 `gracenotes`。
5. 擴充 `rest` 型別定義，增加 `endSlur`、`endTie`、`startSlur`、`startTie` 等連線屬性。
6. 修正 `brace` 與 `bracket` 型別在 `ParamsOther` 與 `Staff` 之間的不一致（皆改為 `string`）。
7. 將 `pitch.startSlur`、`pitch.endSlur` 等 `++` / `+=` 運算添加合適的型別斷言。

### 驗收條件 (Acceptance Criteria)
- `abc_parse.ts` 與 `all.d.ts` 內無任何紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 04:35:00] 統一與對齊 deepCopyKey、addPosToKey 及 startNewLine 的型別簽章

### 目標 (Objectives)
- 優化及對齊 `deepCopyKey`、`addPosToKey` 與 `startNewLine` 跨模組呼叫時的型別宣告。

### 需求 (Requirements)
1. 修正 `deepCopyKey` 的參數型別為 `{ acc?: any, note?: any, verticalPos?: number }[]`，回傳型別為 `KeySigElement`。
2. 修正 `addPosToKey` 參數，將其傳入的 `key` 宣告為 `KeySigElement`。
3. 修正 `startNewLine` 的參數簽章，直接採用全域的 `ParamsOther`，消除行參數散落各檔案重複宣告造成的型別不一致。

### 驗收條件 (Acceptance Criteria)
- `abc_parse.ts` 與 `abc_tune.ts` 間的型別呼叫對接無紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 04:42:00] 修復 M: (Meter) 拍號與 origMeter 的型別宣告

### 目標 (Objectives)
- 修正拍號 `value.num` 與 `value.den` 型別定義，以適配字串賦值並移除 `origMeter` 的 `any` 宣告。

### 需求 (Requirements)
1. 將 `all.d.ts` 中的 `MeterElement.value` 屬性定義從數值 `number` 改為字串 `string`。
2. 將 `abc_parse.ts` 內的 `origMeter` 型別從 `any` 修正為 `MeterElement | null`。

### 驗收條件 (Acceptance Criteria)
- `abc_parse.ts` (L87-L89) 對拍號賦值為 `'4'` 時無紅線報錯。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 04:45:00] 修復 abc_parse_header.ts 中的模組與類別型別錯誤

### 目標 (Objectives)
- 清除 `abc_parse_header.ts` 在編輯器中的所有紅色波浪虛線警告。

### 需求 (Requirements)
1. 在 `abc_parse_header.ts` 頂部加入 `import { AbcTune } from "./abc_tune"` 與 `import { AbcTokenizer } from "./abc_tokenizer"`，修復 IDE 無法解析外部導出類別的問題。
2. 擴充 `KeySignature.acc` 型別支援 `"natural"`、`"dblsharp"` 等更多調號表示，避免屬性指派錯誤。
3. 全域擴展 `Array<T>` 介面，宣告 `last(): T` 方法，修復陣列使用 `.last()` 時的 IDE 型別警報。

### 驗收條件 (Acceptance Criteria)
- IDE 內 `abc_parse_header.ts` 檔案內無 any 紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 04:52:00] 修復 abc_parse_header.ts 第二階段之類別與屬性型別錯誤

### 目標 (Objectives)
- 清除 `abc_parse_header.ts` 當中因 index-signature 缺失、型別不相符、可選型別運算及屬性遺漏所引起的所有紅色波浪線警告。

### 需求 (Requirements)
1. 修正 `all.d.ts` 中 `KeySigElement.accidentals` 陣列元素定義，補上 `verticalPos?: number;` 欄位。
2. 於 `abc_parse_header.ts` 中為 `HeaderToken` 宣告專用介面，並將指令 `tokens` 進行強型別轉換以清除其成員屬性（`type`、`token`）可能為 `undefined` 的波浪線。
3. 修正 `all.d.ts` 中的 `ParseStaff` 與 `ParseVoice`，補上 `index`、`spacing_below_offset`、`verticalPos` 與 `suppressChords` 等屬性，使 voice/staff 初始化 `{}` 與賦值安全無虞。
4. 修正 `all.d.ts` 中 `TempoInfo.duration` 定義為 `number[]`（陣列），修復其 `.length` 呼叫錯誤。
5. 修改 `abc_tune.ts` 中的 `appendElement` 的第四個參數為 `NOTES_Element`，並在 `abc_parse_header.ts` 中呼叫時，將 `TempoInfo` 斷言為 `unknown as TempoElement` 以相容於聯集型別。

### 驗收條件 (Acceptance Criteria)
- 所有列舉行在編輯器內皆無紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 11:15:00] 生成功能移植任務之頂級提示詞與測試機制

### 目標 (Objectives)
- 產出一份用於指導後續 AI 進行 `abcjs_20100604` 功能移植至 `abcTS` 任務的「頂級提示詞」Markdown 檔。
- 設計並在提示詞中提供完整的測試與驗證機制（包含靜態編譯、自動化 AST 深度比對腳本、瀏覽器手動測試）。

### 需求 (Requirements)
1. 提示詞需引導 AI 自行使用本地 Git (`git diff --no-index`) 比對原始 JavaScript 同名檔案的差異。
2. 移植時必須採取「最少變更的直譯」原則。
3. 移植時必須確保 TypeScript 強型別化，不得使用 `any`，並在 `all.d.ts` 補齊型別。
4. 移植順序需採用「分檔案/分模組」逐步進行。
5. 需保留並更新 `abcTS/history/` 下的四大歷史紀錄檔案。

### 驗收條件 (Acceptance Criteria)
- 在 `c:\github\abcMain\migration_prompt.md` 產出對應提示詞，且內容完整、規格清晰。

---
## [2026-07-20 11:20:00] 移植 abc_tune.ts 及 all.d.ts 功能與 bug 修正

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_tune.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組。

### 需求 (Requirements)
1. 重構 `cleanUpSlursInLine` 算法，改用 `number[]` 型態的 `currSlur`，並為連音線計算傳入 `chordPos` 以實現多聲部與和弦的獨立連音線處理。
2. 在 `appendElement` 的 beam 結束邏輯中，新增對 `force_end_beam_last` 的判定，以支援強制在「上一個音符」結束 beam 的行為，並在結尾處清除該臨時變數。
3. 在 `all.d.ts` 擴充 `ABCElement` 屬性 `force_end_beam_last?: boolean;`。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過。
- 自動化對比測試 `node test/compare_ast.js` 100% 通過，確保與新版 JS 的 AST 解析輸出完全一致。

---
## [2026-07-20 13:50:00] 移植 abc_parse.ts 及型別調整

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_parse.js` 功能與 bug 修正至 `abcTS`，並微調 `abc_layout.ts` 保持編譯相容。

### 需求 (Requirements)
1. 擴展和弦（Annotations）解析以支援多個和弦（改用 `Chord[]` 陣列），並支援 `<` (left) 與 `>` (right) 方向定位。
2. 當和弦解析後若有空格，設定 `el.force_end_beam_last = true` 以在上一音符正確結束 Beam。
3. 擴展裝飾音符號（Accent），在 `letter_to_accent` 中新增快捷鍵 `L`（accent）與 `P`（pralltriller）。
4. 優化續行符（Line Continuation）正則，用與註解同等長度的空格填充（引進 `continuationReplacement`），避免定位索引（iChar）偏移。
5. 在 `all.d.ts` 擴充 `Chord` 的 `position` 支援左/右方向，並將 `ABCElement.chord` 修改為 `Chord[]`。
6. 同步修改 `abc_layout.ts` 以遍歷 `elem.chord` 陣列，維持專案型別相容與建置編譯成功。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過。
- 分離 context 沙盒後的自動化 AST 對比測試 `node test/compare_ast.js` 100% 通過，確認與新版 JS 解析輸出完全對齊。

---
## [2026-07-20 14:10:00] 移植 abc_parse_header.ts 功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_parse_header.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組。

### 需求 (Requirements)
1. 修正低音譜號 (Bass Clef) 下的調號預設升降音符 (accidentals) 的八度 (octave) 調整邏輯。
2. 在 `metaTextHeaders` 詮釋資料欄位對照中，新增 `'G'` 字元對應 `'group'`。
3. 在 `all.d.ts` 的 `MetaText` 介面中加入 `group?: string;` 欄位以支援型別檢查。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過且無編譯錯誤。
- 專案程式碼邏輯與新版 JS 完全對齊。

---
## [2026-07-20 17:15:00] 移植 abc_graphelements.ts 功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_graphelements.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組，並修正 `abc_layout.ts` 保持編譯與打包一致性。

### 需求 (Requirements)
1. 實作 `ABCVoiceElement.getDurationIndex()` 並於 `ABCStaffGroupElement.layout` 中呼叫，調整多聲部無時值元素（如譜號、調號等）排版優先對齊邏輯。
2. 補齊 `ABCStaffGroupElement.addVoice` 雙引數 `(voice, staffnumber)` 並以 `StaffLayoutInfo` 保存最高與最低音高，且在 `ABCVoiceElement.layoutOneItem` 內動態累計更新邊界。
3. 修正 `ABCVoiceElement.draw` 中對 `otherchildren` 繪製的偏移參數為 `this.startx + 10`。
4. 支援 `ABCTieElem.force` 的 `'up' | 'down'` 強制方向與音高位移偏量處理。
5. 補齊 `ABCRelativeElement.draw` 在 `'symbol'` 繪製時對 `printSymbol` 的 `scalex`/`scaley` 縮放引數傳遞。
6. 修改 `abc_layout.ts` 中對 `addVoice` 的呼叫為 `addVoice(this.voice, this.s)`。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功，順利編譯出 UMD 格式 bundle。

---
## [2026-07-20 17:30:00] 移植 abc_layout.ts 剩餘功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_layout.js` 剩餘核心排版功能至 `abcTS` 的對應 TS 模組。

### 需求 (Requirements)
1. 宣告 `roomtakenright` 屬性，並在 `printNote` 初始化為 `0`。
2. 重構休止符音高適配，並更新 `this.roomtakenright` 最值空間，支援依據 `this.stemdir` 的 Y 軸音高動態調整。
3. 修正 slur 判定，使其整合 `this.stemdir` 與 `dir` 以正確放置連音線。
4. 修正歌詞 debugLow 元素繪圖從 `addChild` 改為 `addRight` 並賦予寬度估計值 `lyricStr.length * 5`。
5. 重構 `elem.chord` 多重和弦與 annotations 定位渲染，支援 `left`/`right`/`below` 及預設定位排版。
6. 修正 `printNoteHead` 屬性中的 `extreme` 方向，並在其中累計 `dotshiftx` 寬度。
7. 修正 `startTie`、`endSlur`、`startSlur` 當中 `ABCTieElem` 的強制方向引數傳入。
8. 在 `printBarLine` 內新增 `bar_invisible` 隱形小節線支持，並修正 `thick` 粗體小節線的 linewidth 為 `4`。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功，順利編譯出 UMD 格式 bundle，未產生 regression。

---
## [2026-07-20 17:40:00] 移植 abc_write.ts 功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_write.js` 性能優化路徑合併與邊界控制至 `abcTS` 的對應 TS 模組，並修正 `abc_graphelements.ts` 以實現 stave 行高 Y 軸座標的正確指派與累計。

### 需求 (Requirements)
1. 在 `ABCPrinter` 中宣告並實作 `beginGroup`, `addPath`, `endGroup` 進行性能優化之 SVG 路徑合併，修正大寫 "M" 不應重複累加相對坐標增量的 Bug。
2. 於 `printStem` 中補齊 `dx < 0` 的手性校正，使符幹與其它元素求交集時 handedness 正確。
3. 微調 `drawArc` 最大拱拱度由 `35` 降為 `25`，使長連音線渲染美觀。
4. 修正 `debugMsgLow` 調試文字對齊靠左並以 `this.staffbottom` 定位代替絕對值 Y 軸位移。
5. 修改 `printABC` 預設紙張寬度由 `700` 改為 `740`。修正 `printABCLine` 呼叫為單引數。
6. 修改縱向 staff 佈局間距公式為 `this.y = staffgroup.y + staffgroup.height; this.y += AbcSpacing.STAVEHEIGHT * 0.2;` 動態累加。
7. 重構 `abc_graphelements.ts` 當中的 `ABCStaffGroupElement.draw` 以接收 `y` 座標並正確初始化 `this.staffs[i].y`（解決五線譜高度不指派、重疊在 y=0 處的 Bug）。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功。

---
## [2026-07-20 18:30:00] 修復 AST 與繪圖對比 Mismatches，實現 100% 對齊

### 目標 (Objectives)
- 排查並修正新舊版在黑箱對比測試 `compare_ast.js` 執行時產生的繪圖日誌（DrawLog）mismatches。
- 修復 `abcTS` 自研 SVG 封裝與 `abc_write.ts`、`abc_glyphs.ts` 模組的底層相容性缺陷，防範引用污染 Bug。

### 需求 (Requirements)
1. **防止 Glyphs 引用污染**：在 `abc_glyphs.ts` 當中，將 `printSymbol` 取用 `d` 屬性時以 `JSON.parse(JSON.stringify(...))` 進行深度拷貝，防止多次調用時 x, y 偏移量被無限累加修改原始資料。
2. **對齊紙張與繪圖對比格式**：將 `abc_glyphs.ts` 中的 `paper.path({...})` 改回無引數 `paper.path().attr(...)`，並將 `abc_write.ts` 中的五線譜與連音線的 `sprintf` 格式從高精度 `%.3f` 還原為 `%f`，以保證與舊版 JS 的 MockPaper 比對日誌字串完全一致。
3. **實作 SVG toBack 方法**：擴充 `_svg.d.ts` 與 `svg.ts` 中 `SVGElement` 的 `toBack()` 宣告與實作，並在 `abc_write.ts` 中恢復 stave line 及連音線繪製時被註解掉的 `.toBack()` 呼叫。
4. **重構 Stave 縱向高度與定位計算**：將 `abc_graphelements.ts` 中 `ABCStaffGroupElement.draw` 寫死的 40 像素高度更新，恢復舊版基於 `highest` / `lowest` 音高、`STEP` 及 `STAVEHEIGHT` 的動態計算，修復 Y 座標與 setSize 高度少 53.875 像素的 Bug。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功且無報錯。
- 繪圖日誌中的 `toBack: true` 遺失、`path` 陣列轉字串格式不一致、Y 軸與 setSize 高度不匹配等 mismatches 全數解決。

---
## [2026-07-20 18:40:00] 移植 abc_midiwriter.ts 功能與 bug 修正

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_midiwriter.js` 核心多軌 MIDI 生成功能至 `abcTS` 的對應 TS 模組。
- 修復目前 TS 版在多聲部/譜表遍歷、三連音判定、和弦多音高寫入、以及風笛專用調號處理上的嚴重功能退化。

### 需求 (Requirements)
1. **重構 Midi 軌道控制**：於 `Midi` 類別補齊 `trackstrings` 與 `trackcount` 屬性，實作 `setTempo`, `startTrack`, `endTrack` 以拼裝多軌 MIDI 檔。
2. **NoteOn 狀態碼與 Rest 累加**：在 `Midi.startNote` 中，當為軌道首個音符時正確追加 NoteOn `"%90"` 位元組。在 `Midi.addRest` 中，將休止符時值改為 `this.silencelength += length` 累加而非直接字串覆蓋。
3. **多聲部/譜表雙重外層迴圈遍歷**：在 `ABCMidiWriter.writeABC` 中補回 staff 和 voice 的雙重外層遍歷迴圈以建構正確的 multi-track。
4. **修正 getter 越界與 base 參數**：
   - 修正 `getStaff` 對 `staff` 的索引為 `this.mark.staff`（此前筆誤為 `this.mark.voice`）。
   - 將 `baseduration` 還原為定值 `1920` (480*4)，並移除與 `wholeduration` 重複相乘的錯誤。
5. **遍歷和弦多音高與風笛調號**：
   - 在 `writeNote` 當中遍歷所有 `elem.pitches`，一次性寫入該和弦下的所有 MIDI notes，並在一般/連線結束時發送對應的 NoteOff。
   - 修正三連音結束判定為 `elem.endTriplet`。
   - 在 `setKeySignature` 中，當 `abctune.formatting.bagpipes` 存在時將調號複寫為風笛專用升降號。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功且無型別報錯。
- 順利生成多軌與和弦音符無誤的 MIDI 序列。

---
## [2026-07-23 14:08:00] 測試沙盒環境重設優化與 DOM 狀態隔離

### 目標 (Objectives)
- 優化比對測試中的瀏覽器沙盒，確保測試案例之間的 DOM 狀態是隔離且會重設的，避免記憶體洩漏與跨案例的 DOM 干擾。

### 需求 (Requirements)
1. 擴充 `MockElement` 使其支援清空子節點與文字內容的方法 `clear()`。
2. 在比對測試流程中，當每個測試案例渲染與比對完成後，對舊版與新版沙盒的 `document.body` 執行 `clear()` 方法，完成 DOM 清理。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 執行 `node abcTS/test/compare_ast.js` 通過所有測試，無 DOM 狀態干擾。

---
## [2026-08-11 02:40:00] 簡譜 (Jianpu) 支援 - Ticket 01 Type 系統與 Parser 基礎實作

### 目標 (Objectives)
- 讓 abcTS 能夠識別簡譜 `clef=jianpu` 譜號宣告，並在解析調號時計算並附帶大調主音 `KeySigElement.root` 資訊，為後續首調唱名法奠定基礎。

### 需求 (Requirements)
1. 擴充 `ClefType` 支援 `"jianpu"`。
2. 更新 `getClef()` tokenizer 與 `calcMiddle()` 處理以支援 `"jianpu"`，避免噴出 "Unknown clef" 警告。
3. `KeySigElement` 新增 `root?: string` 屬性。
### 需求 (Requirements)
1. 修正 `all.d.ts` 中 `KeySigElement.accidentals` 陣列元素定義，補上 `verticalPos?: number;` 欄位。
2. 於 `abc_parse_header.ts` 中為 `HeaderToken` 宣告專用介面，並將指令 `tokens` 進行強型別轉換以清除其成員屬性（`type`、`token`）可能為 `undefined` 的波浪線。
3. 修正 `all.d.ts` 中的 `ParseStaff` 與 `ParseVoice`，補上 `index`、`spacing_below_offset`、`verticalPos` 與 `suppressChords` 等屬性，使 voice/staff 初始化 `{}` 與賦值安全無虞。
4. 修正 `all.d.ts` 中 `TempoInfo.duration` 定義為 `number[]`（陣列），修復其 `.length` 呼叫錯誤。
5. 修改 `abc_tune.ts` 中的 `appendElement` 的第四個參數為 `NOTES_Element`，並在 `abc_parse_header.ts` 中呼叫時，將 `TempoInfo` 斷言為 `unknown as TempoElement` 以相容於聯集型別。

### 驗收條件 (Acceptance Criteria)
- 所有列舉行在編輯器內皆無紅線。
- `npx tsc --noEmit` 除外部依賴外，`src/` 底下 0 錯誤。
- `pnpm run build` 通過。

---
## [2026-07-20 11:15:00] 生成功能移植任務之頂級提示詞與測試機制

### 目標 (Objectives)
- 產出一份用於指導後續 AI 進行 `abcjs_20100604` 功能移植至 `abcTS` 任務的「頂級提示詞」Markdown 檔。
- 設計並在提示詞中提供完整的測試與驗證機制（包含靜態編譯、自動化 AST 深度比對腳本、瀏覽器手動測試）。

### 需求 (Requirements)
1. 提示詞需引導 AI 自行使用本地 Git (`git diff --no-index`) 比對原始 JavaScript 同名檔案的差異。
2. 移植時必須採取「最少變更的直譯」原則。
3. 移植時必須確保 TypeScript 強型別化，不得使用 `any`，並在 `all.d.ts` 補齊型別。
4. 移植順序需採用「分檔案/分模組」逐步進行。
5. 需保留並更新 `abcTS/history/` 下的四大歷史紀錄檔案。

### 驗收條件 (Acceptance Criteria)
- 在 `c:\github\abcMain\migration_prompt.md` 產出對應提示詞，且內容完整、規格清晰。

---
## [2026-07-20 11:20:00] 移植 abc_tune.ts 及 all.d.ts 功能與 bug 修正

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_tune.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組。

### 需求 (Requirements)
1. 重構 `cleanUpSlursInLine` 算法，改用 `number[]` 型態的 `currSlur`，並為連音線計算傳入 `chordPos` 以實現多聲部與和弦的獨立連音線處理。
2. 在 `appendElement` 的 beam 結束邏輯中，新增對 `force_end_beam_last` 的判定，以支援強制在「上一個音符」結束 beam 的行為，並在結尾處清除該臨時變數。
3. 在 `all.d.ts` 擴充 `ABCElement` 屬性 `force_end_beam_last?: boolean;`。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過。
- 自動化對比測試 `node test/compare_ast.js` 100% 通過，確保與新版 JS 的 AST 解析輸出完全一致。

---
## [2026-07-20 13:50:00] 移植 abc_parse.ts 及型別調整

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_parse.js` 功能與 bug 修正至 `abcTS`，並微調 `abc_layout.ts` 保持編譯相容。

### 需求 (Requirements)
1. 擴展和弦（Annotations）解析以支援多個和弦（改用 `Chord[]` 陣列），並支援 `<` (left) 與 `>` (right) 方向定位。
2. 當和弦解析後若有空格，設定 `el.force_end_beam_last = true` 以在上一音符正確結束 Beam。
3. 擴展裝飾音符號（Accent），在 `letter_to_accent` 中新增快捷鍵 `L`（accent）與 `P`（pralltriller）。
4. 優化續行符（Line Continuation）正則，用與註解同等長度的空格填充（引進 `continuationReplacement`），避免定位索引（iChar）偏移。
5. 在 `all.d.ts` 擴充 `Chord` 的 `position` 支援左/右方向，並將 `ABCElement.chord` 修改為 `Chord[]`。
6. 同步修改 `abc_layout.ts` 以遍歷 `elem.chord` 陣列，維持專案型別相容與建置編譯成功。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過。
- 分離 context 沙盒後的自動化 AST 對比測試 `node test/compare_ast.js` 100% 通過，確認與新版 JS 解析輸出完全對齊。

---
## [2026-07-20 14:10:00] 移植 abc_parse_header.ts 功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_parse_header.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組。

### 需求 (Requirements)
1. 修正低音譜號 (Bass Clef) 下的調號預設升降音符 (accidentals) 的八度 (octave) 調整邏輯。
2. 在 `metaTextHeaders` 詮釋資料欄位對照中，新增 `'G'` 字元對應 `'group'`。
3. 在 `all.d.ts` 的 `MetaText` 介面中加入 `group?: string;` 欄位以支援型別檢查。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 通過且無編譯錯誤。
- 專案程式碼邏輯與新版 JS 完全對齊。

---
## [2026-07-20 17:15:00] 移植 abc_graphelements.ts 功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_graphelements.js` 功能與 bug 修正至 `abcTS` 的對應 TS 模組，並修正 `abc_layout.ts` 保持編譯與打包一致性。

### 需求 (Requirements)
1. 實作 `ABCVoiceElement.getDurationIndex()` 並於 `ABCStaffGroupElement.layout` 中呼叫，調整多聲部無時值元素（如譜號、調號等）排版優先對齊邏輯。
2. 補齊 `ABCStaffGroupElement.addVoice` 雙引數 `(voice, staffnumber)` 並以 `StaffLayoutInfo` 保存最高與最低音高，且在 `ABCVoiceElement.layoutOneItem` 內動態累計更新邊界。
3. 修正 `ABCVoiceElement.draw` 中對 `otherchildren` 繪製的偏移參數為 `this.startx + 10`。
4. 支援 `ABCTieElem.force` 的 `'up' | 'down'` 強制方向與音高位移偏量處理。
5. 補齊 `ABCRelativeElement.draw` 在 `'symbol'` 繪製時對 `printSymbol` 的 `scalex`/`scaley` 縮放引數傳遞。
6. 修改 `abc_layout.ts` 中對 `addVoice` 的呼叫為 `addVoice(this.voice, this.s)`。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功，順利編譯出 UMD 格式 bundle。

---
## [2026-07-20 17:30:00] 移植 abc_layout.ts 剩餘功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_layout.js` 剩餘核心排版功能至 `abcTS` 的對應 TS 模組。

### 需求 (Requirements)
1. 宣告 `roomtakenright` 屬性，並在 `printNote` 初始化為 `0`。
2. 重構休止符音高適配，並更新 `this.roomtakenright` 最值空間，支援依據 `this.stemdir` 的 Y 軸音高動態調整。
3. 修正 slur 判定，使其整合 `this.stemdir` 與 `dir` 以正確放置連音線。
4. 修正歌詞 debugLow 元素繪圖從 `addChild` 改為 `addRight` 並賦予寬度估計值 `lyricStr.length * 5`。
5. 重構 `elem.chord` 多重和弦與 annotations 定位渲染，支援 `left`/`right`/`below` 及預設定位排版。
6. 修正 `printNoteHead` 屬性中的 `extreme` 方向，並在其中累計 `dotshiftx` 寬度。
7. 修正 `startTie`、`endSlur`、`startSlur` 當中 `ABCTieElem` 的強制方向引數傳入。
8. 在 `printBarLine` 內新增 `bar_invisible` 隱形小節線支持，並修正 `thick` 粗體小節線的 linewidth 為 `4`。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功，順利編譯出 UMD 格式 bundle，未產生 regression。

---
## [2026-07-20 17:40:00] 移植 abc_write.ts 功能

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_write.js` 性能優化路徑合併與邊界控制至 `abcTS` 的對應 TS 模組，並修正 `abc_graphelements.ts` 以實現 stave 行高 Y 軸座標的正確指派與累計。

### 需求 (Requirements)
1. 在 `ABCPrinter` 中宣告並實作 `beginGroup`, `addPath`, `endGroup` 進行性能優化之 SVG 路徑合併，修正大寫 "M" 不應重複累加相對坐標增量的 Bug。
2. 於 `printStem` 中補齊 `dx < 0` 的手性校正，使符幹與其它元素求交集時 handedness 正確。
3. 微調 `drawArc` 最大拱拱度由 `35` 降為 `25`，使長連音線渲染美觀。
4. 修正 `debugMsgLow` 調試文字對齊靠左並以 `this.staffbottom` 定位代替絕對值 Y 軸位移。
5. 修改 `printABC` 預設紙張寬度由 `700` 改為 `740`。修正 `printABCLine` 呼叫為單引數。
6. 修改縱向 staff 佈局間距公式為 `this.y = staffgroup.y + staffgroup.height; this.y += AbcSpacing.STAVEHEIGHT * 0.2;` 動態累加。
7. 重構 `abc_graphelements.ts` 當中的 `ABCStaffGroupElement.draw` 以接收 `y` 座標並正確初始化 `this.staffs[i].y`（解決五線譜高度不指派、重疊在 y=0 處的 Bug）。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功。

---
## [2026-07-20 18:30:00] 修復 AST 與繪圖對比 Mismatches，實現 100% 對齊

### 目標 (Objectives)
- 排查並修正新舊版在黑箱對比測試 `compare_ast.js` 執行時產生的繪圖日誌（DrawLog）mismatches。
- 修復 `abcTS` 自研 SVG 封裝與 `abc_write.ts`、`abc_glyphs.ts` 模組的底層相容性缺陷，防範引用污染 Bug。

### 需求 (Requirements)
1. **防止 Glyphs 引用污染**：在 `abc_glyphs.ts` 當中，將 `printSymbol` 取用 `d` 屬性時以 `JSON.parse(JSON.stringify(...))` 進行深度拷貝，防止多次調用時 x, y 偏移量被無限累加修改原始資料。
2. **對齊紙張與繪圖對比格式**：將 `abc_glyphs.ts` 中的 `paper.path({...})` 改回無引數 `paper.path().attr(...)`，並將 `abc_write.ts` 中的五線譜與連音線的 `sprintf` 格式從高精度 `%.3f` 還原為 `%f`，以保證與舊版 JS 的 MockPaper 比對日誌字串完全一致。
3. **實作 SVG toBack 方法**：擴充 `_svg.d.ts` 與 `svg.ts` 中 `SVGElement` 的 `toBack()` 宣告與實作，並在 `abc_write.ts` 中恢復 stave line 及連音線繪製時被註解掉的 `.toBack()` 呼叫。
4. **重構 Stave 縱向高度與定位計算**：將 `abc_graphelements.ts` 中 `ABCStaffGroupElement.draw` 寫死的 40 像素高度更新，恢復舊版基於 `highest` / `lowest` 音高、`STEP` 及 `STAVEHEIGHT` 的動態計算，修復 Y 座標與 setSize 高度少 53.875 像素的 Bug。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功且無報錯。
- 繪圖日誌中的 `toBack: true` 遺失、`path` 陣列轉字串格式不一致、Y 軸與 setSize 高度不匹配等 mismatches 全數解決。

---
## [2026-07-20 18:40:00] 移植 abc_midiwriter.ts 功能與 bug 修正

### 目標 (Objectives)
- 移植 `abcjs_20100604` 的 `abc_midiwriter.js` 核心多軌 MIDI 生成功能至 `abcTS` 的對應 TS 模組。
- 修復目前 TS 版在多聲部/譜表遍歷、三連音判定、和弦多音高寫入、以及風笛專用調號處理上的嚴重功能退化。

### 需求 (Requirements)
1. **重構 Midi 軌道控制**：於 `Midi` 類別補齊 `trackstrings` 與 `trackcount` 屬性，實作 `setTempo`, `startTrack`, `endTrack` 以拼裝多軌 MIDI 檔。
2. **NoteOn 狀態碼與 Rest 累加**：在 `Midi.startNote` 中，當為軌道首個音符時正確追加 NoteOn `"%90"` 位元組。在 `Midi.addRest` 中，將休止符時值改為 `this.silencelength += length` 累加而非直接字串覆蓋。
3. **多聲部/譜表雙重外層迴圈遍歷**：在 `ABCMidiWriter.writeABC` 中補回 staff 和 voice 的雙重外層遍歷迴圈以建構正確的 multi-track。
4. **修正 getter 越界與 base 參數**：
   - 修正 `getStaff` 對 `staff` 的索引為 `this.mark.staff`（此前筆誤為 `this.mark.voice`）。
   - 將 `baseduration` 還原為定值 `1920` (480*4)，並移除與 `wholeduration` 重複相乘的錯誤。
5. **遍歷和弦多音高與風笛調號**：
   - 在 `writeNote` 當中遍歷所有 `elem.pitches`，一次性寫入該和弦下的所有 MIDI notes，並在一般/連線結束時發送對應的 NoteOff。
   - 修正三連音結束判定為 `elem.endTriplet`。
   - 在 `setKeySignature` 中，當 `abctune.formatting.bagpipes` 存在時將調號複寫為風笛專用升降號。

### 驗收條件 (Acceptance Criteria)
- 專案靜態編譯與 UMD 打包 `pnpm run build` 成功且無型別報錯。
- 順利生成多軌與和弦音符無誤的 MIDI 序列。

---
## [2026-07-23 14:08:00] 測試沙盒環境重設優化與 DOM 狀態隔離

### 目標 (Objectives)
- 優化比對測試中的瀏覽器沙盒，確保測試案例之間的 DOM 狀態是隔離且會重設的，避免記憶體洩漏與跨案例的 DOM 干擾。

### 需求 (Requirements)
1. 擴充 `MockElement` 使其支援清空子節點與文字內容的方法 `clear()`。
2. 在比對測試流程中，當每個測試案例渲染與比對完成後，對舊版與新版沙盒的 `document.body` 執行 `clear()` 方法，完成 DOM 清理。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 執行 `node abcTS/test/compare_ast.js` 通過所有測試，無 DOM 狀態干擾。

---
## [2026-08-11 02:40:00] 簡譜 (Jianpu) 支援 - Ticket 01 Type 系統與 Parser 基礎實作

### 目標 (Objectives)
- 讓 abcTS 能夠識別簡譜 `clef=jianpu` 譜號宣告，並在解析調號時計算並附帶大調主音 `KeySigElement.root` 資訊，為後續首調唱名法奠定基礎。

### 需求 (Requirements)
1. 擴充 `ClefType` 支援 `"jianpu"`。
2. 更新 `getClef()` tokenizer 與 `calcMiddle()` 處理以支援 `"jianpu"`，避免噴出 "Unknown clef" 警告。
3. `KeySigElement` 新增 `root?: string` 屬性。
4. 解析 `K:` 欄位時，依照升降號數量與大/小調屬性，推算其相對大調之主音（如 `K:Am` -> `root: "C"`，`K:G` -> `root: "G"`），並填入 `KeySigElement.root`。
5. 在 `abc_parse.ts` 行首與行重置處，確保 `KeySigElement.root` 被複製至 `params.key` 中，保留到 AST。
6. `abc_parser_lint.ts` 的 schema 對應加入 `"jianpu"`，避免 Stage B lint 報錯。

### 驗收條件 (Acceptance Criteria)
- 執行 `pnpm run build` 打包編譯成功。
- 新增的 TDD 測試檔案 `test-jianpu-01.js` 執行無誤（18 個 Key 根音與譜號測試全部通過）。
- 所有現有的測試案例（compare_ast）皆能 100% 通過無 regression。

---
## [2026-08-11 02:54:00] 簡譜 (Jianpu) 支援 - Ticket 02 Layout 到 Write 橋接管線

### 目標 (Objectives)
- 建立 jianpu 譜號資訊從 AST 經過 Layout 傳遞至 Write 繪圖層的通道，並讓 jianpu 聲部預設渲染為空白（無五線譜線）。

### 需求 (Requirements)
1. 在 `ABCVoiceElement` 上定義 `clef`、`jianpuOctave`、`jianpuKey` 屬性。
2. `abc_parse.ts` 在 `startNewLine` 時把 `jianpuOctave` 拷貝至 `params`。
3. `abc_tune.ts` 在 `createStaff` 時把 `jianpuOctave` 存入 `Staff` 結構。
4. `abc_layout.ts` 在 `printABCStaff` 建立 `ABCVoiceElement` 時，從 `Staff` 結構把屬性複製給該 voice。
5. `ABCStaffGroupElement.draw()` 遇到該 staff 下有 `clef === 'jianpu'` 的 voice 時，跳過該 staff 的 `printStave` 呼叫（即不繪製五線）。
6. `ABCVoiceElement.draw()` 在 `this.clef === 'jianpu'` 時分流呼叫 `drawJianpu()` 空 stub 並提前返回。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 新增的 TDD 測試檔案 `test-jianpu-02.js` 執行無誤。
- Cooley's 等傳統五線譜測試（regression）在 `test.js` 跑過後，SVG 繪圖筆數與表現無任何變化。

---
## [2026-08-11 03:00:00] 簡譜 (Jianpu) 支援 - Ticket 03 Scale Degree 數字渲染

### 目標 (Objectives)
- 實作簡譜數字唱名音高的計算核心，並在簡譜聲部繪圖時將音符與休止符渲染為對應的數字字元 `0`-`7`。

### 需求 (Requirements)
1. 建立 `src/abc_jianpu_write.ts` 模組，實作純函數 `pitchToJianpu` 以根據 key root 和基準八度，將 diatonic pitch 轉換為首調簡譜數字 `1`-`7` 與八度偏置。
2. 於 `src/index.ts` 導出 `pitchToJianpu` 並掛載至全域 `window` 供單元測試使用。
3. `ABCVoiceElement` 實作 `drawJianpuNote()` 方法：
   - 識別 rest 休止符，渲染字元 `"0"`。
   - 識別 note 音符，對於和弦 `[CEG]` 僅取其最高音的 `pitch`，傳入 `pitchToJianpu` 計算後，渲染對應數字 `"1"`-`"7"`。
   - 以 `sans-serif` 粗體、字級 22 的 SVG 文字繪製於 `child.x` 與 `this.y` 處，並附加 mouseup select 監聽事件。
4. `ABCVoiceElement.drawJianpu()` 遍歷子節點，渲染小節線、拍號，並透過 `drawJianpuNote()` 渲染音符和休止符。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 新增的 TDD 測試檔案 `test-jianpu-03.js` 執行無誤（12 個單元測試與音高數字渲染斷言全部通過）。
- 所有現有的測試（compare_ast、Cooley's 渲染）皆能 100% 通過無 regression。

---
## [2026-08-11 03:05:00] 簡譜 (Jianpu) 支援 - Ticket 04 Octave Dots 八度點

### 目標 (Objectives)
- 實作高低八度音符在簡譜數字上方或下方的八度圓點標記繪製。

### 需求 (Requirements)
1. 擴充 `Svg` 類別，新增並實作 `circle(cx, cy, r)` 方法以支持繪製圓點。
2. 於 `ABCVoiceElement.drawJianpuNote()` 讀取 `pitchToJianpu` 的 `octaveDelta`：
   - 若 `octaveDelta > 0`，繪製 `octaveDelta` 個八度圓點在數字上方（第一個點在 `y - 12` 處，往上每個點 Y 軸減 4px）。
   - 若 `octaveDelta < 0`，繪製 `|octaveDelta|` 個八度圓點在數字下方（第一個點在 `y + 10` 處，往下每個點 Y 軸加 4px）。
   - 使用圓點半徑 `r = 1.5`，填充顏色 `fill = "#000000"`，並為其附加與數字一致的 mouseup select 監聽事件。
3. 修正先前 Ticket 02 與 Ticket 03 測試腳本中的 `MockPaper`，使其支援 `circle` 空 stub 方法以維持測試相容性。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 新增的 TDD 測試檔案 `test-jianpu-04.js` 執行無誤（高/低八度圓點渲染數量與座標斷言全數通過）。
- 所有先前與傳統的測試（compare_ast、Cooley's 渲染）皆能 100% 通過無 regression。

---
## [2026-08-11 03:10:00] 簡譜 (Jianpu) 支援 - Ticket 05 Duration Lines 時值線

### 目標 (Objectives)
- 實作簡譜時值輔助線，包含長音的延音橫線（dashes）、短音的底線（underlines，支援連梁 beam 共享與獨立底線）以及附點圓點。

### 需求 (Requirements)
1. 於 `src/abc_jianpu_write.ts` 新增並導出 `decomposeDuration` 函數，用於從相對時值分解出基準時值與附點個數。
2. 於 `src/index.ts` 導出 `decomposeDuration` 並掛載至全域。
3. `ABCVoiceElement.drawJianpuNote` 實作：
   - 繪製延音橫線：當基準時值為二分音符 (`0.5`) 時，繪製 1 條橫線；當為全音符 (`1.0`) 時，繪製 3 條橫線。
   - 繪製附點：若包含附點（`dots > 0`），在數字右側以 `y - 6` 為高度、圓半徑 `r = 1.5` 繪製實心點。
4. `ABCVoiceElement` 實作底線與連梁繪製：
   - `getUnderlineCount(el)`：時值為八分/十六分/三記二分音符時，回傳底線層數 1 / 2 / 3。
   - `drawJianpuUnderlines(printer)`：遍歷子音符。若音符包含 `child.beam` 且尚未處理，將同 beam 組的所有 elements 取出進行 `drawUnderlineGroup` 連續繪製；若無 beam，則作為獨立音符傳入。
   - `drawUnderlineGroup` 在每層底線（1-3）掃描連續需要該層底線的子區段（Run），呼叫 `drawUnderlineSegment` 繪製從區段首音符 `x1 - 8` 到尾音符 `x2 + 8` 的橫線。
   - 橫線 Y 軸高度為防止與低八度點重合，取區段內最大低八度點數 `maxDotsBelow` 動態向下偏移：`y + 10 + (maxDotsBelow > 0 ? maxDotsBelow * 4 + 2 : 0) + (L - 1) * 4`。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 新增的 TDD 測試檔案 `test-jianpu-05.js` 執行無誤（長音橫線數量、底線寬度與連續連梁、附點 Y 軸座標等斷言全數通過）。
- 所有先前與傳統的測試（compare_ast、Cooley's 渲染）皆能 100% 通過無 regression。

---
## [2026-08-11 03:15:00] 簡譜 (Jianpu) 支援 - Ticket 06 臨時記號 Glyph + 行首標記

### 目標 (Objectives)
- 實作調外臨時升降音與還原記號在簡譜數字左側的繪製，並於每行簡譜聲部行首輸出「1=Key」調名標記與拍號文字。

### 需求 (Requirements)
1. 擴充 `pitchToJianpu()` 實作 `isChromatic` 檢測邏輯：當音符有臨時升降號且與調號在該音名上的升降規則不一致時判定為 chromatic，並返回對應 `acc`（'sharp' | 'flat' | 'natural'）。
2. 在 `ABCVoiceElement.drawJianpuNote` 中利用 `isChromatic` 進行繪製。若為調外升降音，在數字左側 12px 處複用 `printer.glyphs.printSymbol` 機制繪製 Emmentaler 的 `'accidentals.sharp'`、`'accidentals.flat'` 或 `'accidentals.natural'` 向量路徑。
3. `ABCVoiceElement.drawJianpu` 實作行首標記：
   - 取得當前大調主音 `1=Key`（如 `1=G`），並以 16 級粗體字級在 X 軸 `20` 座標繪製文字。
   - 檢測並從 `MeterElement` 中讀取當前拍號（如 `4/4`、`2/2`），以 16 級粗體字級緊接於 X 軸 `55` 座標繪製文字。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 新增的 TDD 測試檔案 `test-jianpu-06.js` 執行無誤（11 個臨時記號與行首調號拍號字元/座標斷言全部通過）。
- 所有先前與傳統的測試（compare_ast、Cooley's 鋪渲染）皆能 100% 通過無 regression。

---
## [2026-08-11 10:18:00] 評估 codebase 架構與深化機會

### 目標 (Objectives)
- 分析 abcTS 當前程式碼庫，尋找模組深化機會（Deepening Opportunities），提升代碼的 Locality 與測試性。
- 生成包含 before/after 架構圖的自我包含 HTML 報告，供開發者審查。

### 需求 (Requirements)
1. 掃描最近變更頻繁的簡譜（Jianpu）子系統與相關 graphelements/write 類別。
2. 識別出 Shallow Module 與缺乏 Locality 的問題點，並提出 Deep Module 的重構候選方案。
3. 產生 `architecture-review-<timestamp>.html` 檔案至系統暫存目錄，並自動使用預設瀏覽器開啟。

### 驗收條件 (Acceptance Criteria)
- HTML 報告成功生成，包含解耦簡譜渲染與互動元件化兩個候選方案，且有 Mermaid 架構圖。
- 順利在使用者瀏覽器中開啟報告。

---
## [2026-08-11 16:18:00] 簡譜 (Jianpu) 支援 - 方案 2 互動選取元件化

### 目標 (Objectives)
- 重構五線譜與簡譜渲染中的互動選取邏輯，消除重複綁定，實作集中式的 `bindInteraction` 介面與高效的全域事件委託機制。

### 需求 (Requirements)
1. **建立 bindInteraction Seam 介面**：
   - 於 `ABCPrinter` (位於 `src/abc_write.ts`) 中實作 `bindInteraction(svgEl, absEl)`。
   - 用於取代原本直接在 SVG 節點上註冊 mouseup 事件的做法，改為在 SVG 元素物件上標記 `_abcElement` 指針。
2. **實作全域事件委託 (Event Delegation)**：
   - 在 `ABCPrinter.printABC()` 的末尾，於最外層畫布 `targetEl` 上動態監聽唯一的 `mouseup` 事件。
   - 監聽器被觸發時，向上冒泡尋找帶有 `_abcElement` 屬性的節點，一旦找到則呼叫 `notifySelect(absEl)` 觸發選取。
3. **消除冗餘事件註冊**：
   - 移除 `ABCAbsoluteElement.draw` (位於 `src/abc_graphelements.ts`) 及 `JianpuVoiceRenderer` (位於 `src/abc_jianpu_renderer.ts`) 中所有的 `mouseup` 事件註冊代碼，統一改為調用 `printer.bindInteraction`。
4. **單元測試與驗證擴充**：
   - 修改 `test-jianpu-07.js`。提供 `bindInteraction` 的 mock 實作，並新增 `Seam G` 互動選取氣泡冒泡解析斷言測試。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 所有的 7 個簡譜 TDD 測試（包含新增的 Seam G）皆 100% 綠燈通過。
- Cooley's 回歸測試不受任何影響。

---
## [2026-08-12 03:55:00] 修復多聲部下簡譜 Y 座標偏移與重疊 Bug

### 目標 (Objectives)
- 修正多聲部排版時，簡譜（jianpu）聲部 Y 座標偏上且與上方五線譜重疊的問題，使其能動態對齊正確的實質渲染高度 `voice.staff.y`。

### 需求 (Requirements)
1. **修正繪圖前 Y 座標初始化**：
   - 於 `ABCVoiceElement.draw()` (位於 `src/abc_graphelements.ts`) 中，在簡譜譜號分流渲染呼叫前，先執行 `printer.y` 及 `printer.staffbottom` 的指派，並設定 `this.barbottom = printer.calcY(2);`，且將 `this.y = printer.y;` 同步更新，確保簡譜的實質渲染 Y 座標與外部測試屬性一致。
2. **改用 printer.y 進行渲染**：
   - 於 `JianpuVoiceRenderer` (位於 `src/abc_jianpu_renderer.ts`) 中，將所有使用 `voice.y` 作為 Y 座標繪圖的部分改為 `printer.y`。
   - 在 `render()` 開頭對 `printer.y` 做防禦性初始化（當其為 `undefined` 時，設為 `voice.y`），以保持與獨立 renderer 測試 (如 `test-jianpu-07.js`) 的相容性。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- 專門建立的 `test-jianpu-bug.js` 測試通過：驗證簡譜的文字與行首調號宣告的 Y 座標在多聲部時能正確大於第一聲部並與 `v2.staff.y` 完美對齊。
- 所有的 7 個既有簡譜單元測試 (`test-jianpu-01` 至 `07`) 與 `test.js` 傳統回歸測試均 100% 綠燈通過。

---
## [2026-08-12 05:55:00] 簡譜 Note 佈局與渲染解耦重構

### 目標 (Objectives)
- 重構簡譜 Note 的生成與渲染架構，將簡譜的音符細節（數字、橫線、圓點、臨時升降記號）的創建從渲染期提前至佈局期，消除冗餘繪圖邏輯，實作高度內聚與完美的 X 軸佈局。

### 需求 (Requirements)
1. **擴充相對繪圖型別**：在 `ABCRelativeElement.type` 聲明與 `draw()` 中，新增 `"jianpuNote"` (22px唱名數字)、`"jianpuDash"` (延音橫線) 及 `"jianpuDot"` (八度點與附點) 支援。
2. **Layout 分流與元素生成**：在 `abc_layout.ts` 中新增 `printJianpuNote` 和 `printJianpuNoteHead`。當為簡譜聲部時，在 `printBeam()` 進行分流呼叫，並根據拍數計算橫線與附點數量，以 `addRight` 將元素加進 `abselem`，使佈局期自動精確累加音符實質寬度。
3. **過濾調內升降記號**：在 `printJianpuNoteHead` 中僅對調外臨時記號（`res.isChromatic` 為真時）繪製升降號，防止調內音符被重繪臨時記號。
4. **渲染器瘦身**：將 `JianpuVoiceRenderer` 中的 `_drawNote` 刪除，`_drawNotes` 改為一行 `child.draw(printer, bartop)` 委託調用，底線 `_drawUnderlines` 與行首 `_drawHeader` 保持在 renderer 端繪製。
5. **事件委託與高亮**：藉由 RelativeElement 自動收集至音符的 `elemset` 中，使全域選取高亮與點擊互動氣泡冒泡自動生效。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯成功。
- `test-jianpu-01.js` 到 `test-jianpu-07.js` 的 7 個測試腳本全數 PASS。
- 傳統五線譜回歸測試 `test.js` 100% 正常。

---
## [2026-08-12 15:55:00] 重構解析元組回傳為具名強型別物件

### 目標 (Objectives)
- 將 `abcTS` 解析器與分詞器中 9 個核心解析函式的無語意 tuple 回傳值重構為具備明確屬性與 TSDoc 註解的強型別具名物件，消除專案的型別安全盲區。

### 需求 (Requirements)
1. 於 `src/all.d.ts` 定義 9 個具備詳細中文註解的 Interface 型別。
2. 重構 `getBrackettedSubstring`、`letter_to_chord`、`letter_to_accent`、`letter_to_spacer`、`letter_to_bar`、`getBrokenRhythm`、`letter_to_grace`、`letter_to_inline_header`、`letter_to_body_header`。
3. 修改所有呼叫點，將元組索引（`ret[0]`, `ret[1]` 等）改為屬性取值（`result.len`, `result.token` 等）。
4. 清除舊 JS 中全域變數 `ret` 污染在重構後帶來的 runtime 報錯威脅。
5. 確保 TypeScript 靜態編譯通過且打包正常。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯無誤。
- `node test.js` 回歸測試 100% 正常。
- 7 個簡譜單元測試 `test-jianpu-*.js` 全部綠燈通過。
- `node test/compare_ast.js` 的 AST 遞迴比對 100% 一致。

---
## [2026-08-17 15:50:00] 修復 abc_layout.ts 編譯紅線與 all.d.ts 型別衝突

### 目標 (Objectives)
- 分析並修正 `src/abc_layout.ts` 內的 TypeScript 編譯錯誤（紅色波浪線），消弭型別安全盲區。
- 對相關的 `*.d.ts` 檔（特別是 `src/all.d.ts`）進行型別補強，解決型別相容性衝突，並減少 `any` 的宣告。

### 需求 (Requirements)
1. **補全 PartElement 型別**：
   - 於 `src/all.d.ts` 定義 `PartElement` 介面。
   - 將 `PartElement` 加進 `NOTES_Element` 聯集型別，解決 `abc_layout.ts` 在 `printABCElement` 內部的 `case "part"` 判定。
2. **解決 TempoElement 繼承衝突**：
   - 於 `src/all.d.ts` 中，將 `TempoElement` 繼承 `Omit<ABCElement, 'el_type'>` 修改為 `Omit<ABCElement, 'el_type' | 'duration'>`，排除 `duration` 的型別衝突。
3. **在 ABCLayout 宣告成員屬性**：
   - 在 `src/abc_layout.ts` 的 `ABCLayout` 類別內宣告 `dotshiftx: number;` 與 `startlimitelem: ABCAbsoluteElement;` 屬性。
4. **修正 pseudoabselem 的型別與 barNumber 轉型**：
   - 在處理 `gracebeam` 時，將 mock 的 `pseudoabselem` 的 `as ABCBeamElem` 修正為 `as unknown as ABCAbsoluteElement`，並對 `abcelem` 使用 `as ABCElement` 斷言。
   - 遇到 `elem.barNumber` 時，將其轉為字串 `elem.barNumber.toString()`。
5. **修正 ABCTieElem 傳參**：
   - 在 `abc_layout.ts` 處理 `endSlur` 分支中，將 `new ABCTieElem(...)` 呼叫的參數個數從 5 個修正為 4 個，對齊 `startSlur` 與 constructor 的簽章。

### 驗收條件 (Acceptance Criteria)
- `pnpm exec tsc --noEmit` 無任何與 `abc_layout.ts` 相關的編譯錯誤。
- `pnpm run build` 打包編譯無誤。
- `node test.js` 回歸測試 100% 正常。
- 7 個簡譜單元測試 `test-jianpu-*.js` 全部綠燈通過。
- `node test/compare_ast.js` 的 AST 遞迴比對 100% 一致。

---
## [2026-08-17 16:20:00] 修復多聲部小節線跨越連接與 TS 型別警告

### 目標 (Objectives)
- 修正多聲部複音排版（特別是 Monteverdi Canzonetta）在 Layout 渲染時，由於 `%%score` 指令 parser 語法錯誤導致的 `connectBarLines` 狀態丟失。
- 重新對齊新舊版小節線繪製 Y 軸高度與跨聲部連接，實現 AST/Renderer 比對 100% 一致。

### 需求 (Requirements)
1. **修正中括號閉合 parsing 錯誤**：將 `src/abc_parse_header.ts` 中 score 指令的 `case ""` 修正為 `case "]"`，使其能正常接收與清除 bracket 的狀態。
2. **優化小節線連接傳遞鏈**：重構 `src/abc_graphelements.ts` 內的 `ABCStaffGroupElement.draw`，將縱向 `bartop` 參數的鏈式更新改為無條件傳遞，確保底層聲部在需要向上連接時，能隨時獲得正確的上聲部 `barbottom` 座標。
3. **移除調試日誌**：徹底清除為診斷此問題在各個檔案注入的 `console.log` 追蹤點。

### 驗收條件 (Acceptance Criteria)
- 打包建置 `pnpm run build` 通過且無編譯警告。
- 執行 `node test/compare_ast.js` 回報所有測試綠燈，且 Mismatches 全數歸零。
- 所有簡譜 TDD 測試與傳統 `test.js` 回歸測試 100% 通過。

---
## [2026-08-20 17:25:00] 重構 abc_parse_header.ts 的 parseKey, setTempo, parseHeader 回傳型別

### 目標 (Objectives)
- 將 `abc_parse_header.ts` 當中三個核心解析方法（`parseKey`、`setTempo` 與 `parseHeader`）原本無語意的匿名回傳物件型別，重構為明確定義的具名強型別介面，消除專案的型別安全盲區。
- 補齊對應的 TypeScript 宣告檔 `src/all.d.ts`，並在程式碼中寫入清晰的文件註解。

### 需求 (Requirements)
1. 於 `src/all.d.ts` 定義 `ParseKeyResult`、`SetTempoResult` 與 `ParseHeaderResult` 三個全域 Interface 及其詳細註解。
2. 重構 `abc_parse_header.ts` 當中的 `parseKey`、`setTempo`、`parseHeader` 函式簽章。
3. 為這三個函式補齊 TSDoc/JSDoc 格式註解。
4. 確保 TypeScript 靜態編譯通過且打包正常，無 regression。

### 驗收條件 (Acceptance Criteria)
- 靜態型別編譯 `npx tsc --noEmit` 通過。
- `pnpm run build` 打包編譯無誤。
- `node test.js` 回歸測試 100% 正常。
- 7 個簡譜單元測試 `test-jianpu-*.js` 全部綠燈通過。

---
## [2026-08-22 23:23:00] 整合簡譜渲染邏輯至 ABCVoiceElement

### 目標 (Objectives)
- 廢除獨立的 `JianpuVoiceRenderer` 類別，將其簡譜繪製流程整合進 `ABCVoiceElement.jianpu_draw`。
- 在 `ABCStaffGroupElement.draw` 中根據 `voice.clef === 'jianpu'` 進行顯式分流繪製。
- 重構並修復與此變更相關的單元測試 `test-jianpu-07.js`。

### 需求 (Requirements)
1. 移除 `src/abc_jianpu_renderer.ts`，並於 `src/index.ts` 中移除其匯出與全域掛載。
2. 於 `src/abc_graphelements.ts` 頂部加入 `decomposeDuration` 引入。
3. 於 `ABCStaffGroupElement.draw` 中，若 `voice.clef === 'jianpu'`，呼叫 `voice.jianpu_draw(printer, bartop)`；否則呼叫 `voice.draw(printer, bartop)`。
4. 於 `ABCVoiceElement.draw` 中，移除原先對簡譜的分流與 `new JianpuVoiceRenderer().render(...)` 的呼叫。
5. 於 `ABCVoiceElement` 新增並實作 `jianpu_draw(printer, bartop)` 成員方法，包含其子步驟（`drawJianpuHeader`、`resolveJianpuMeterText`、`drawJianpuUnderlines`、`drawJianpuUnderlineGroup`、`drawJianpuUnderlineSegment`、`getJianpuUnderlineCount`），將原本對傳入參數 `voice` 的取值全數改為 `this`。
6. 修改 `test-jianpu-07.js` 單元測試：
   - 移除 `JianpuVoiceRenderer`，引入 `ABCVoiceElement`。
   - `makeVoice` 改為以 `ABCVoiceElement` 的 prototype 創建，或是直接為其補上與 `ABCVoiceElement` 一致的資料結構。
   - 將原本的 `new JianpuVoiceRenderer().render(...)` 改為 `voice.jianpu_draw(...)`。

### 驗收條件 (Acceptance Criteria)
- 執行 `pnpm run build` 打包編譯無誤。
- 執行 `node test-jianpu-07.js` 單元測試全數通過（Seam A 至 G 正常運作）。
- 執行 `node test-jianpu-01.js` 至 `06.js` 測試全數通過。
- 執行 `node test/compare_ast.js` 語法樹與繪製日誌比對 100% 一致。

---
## [2026-08-23 02:26:00] 整合簡譜渲染邏輯至 ABCVoiceElement 與結構清理

### 目標 (Objectives)
- 完成簡譜渲染核心邏輯（JianpuVoiceRenderer）的廢除，將其整合為 ABCVoiceElement 的成員方法。
- 清理無用模組，確保傳統單元測試與簡譜 01-07 測試皆能綠燈。

### 需求 (Requirements)
1. 刪除獨立的 `src/abc_jianpu_renderer.ts`，並於 `src/index.ts` 移除掛載。
2. 在 `ABCStaffGroupElement.draw` 中根據 `voice.clef === 'jianpu'` 進行顯式分流。
3. 在 `ABCVoiceElement` 中實作內聚的 `jianpu_draw` 成員方法及輔助繪圖方法。
4. 重構 `test-jianpu-07.js` 單元測試，使其使用新版 `ABCVoiceElement.jianpu_draw`。
5. 暫時跳過 `compare_ast.js` 五線譜繪圖日誌 Mismatch 的驗證除錯。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯無誤。
- `node test-jianpu-07.js` 單元測試全數綠燈。
- 所有簡譜單元測試 `test-jianpu-01` 至 `06` 均全數綠燈。

---
## [2026-08-23 11:30:00] 將簡譜渲染與佈局計算從繪圖物件解耦

### 目標 (Objectives)
- 將簡譜 (Jianpu Voice) 渲染與 Y 軸高度偏置的計算細節從五線譜繪製核心 `ABCVoiceElement` 與 `ABCStaffGroupElement` 中抽離。
- 引入獨立的 Deep Module `JianpuVoiceRenderer`，建立清晰的 Seam。
- 優化簡譜單元測試以對應新 Seam 測試。

### 需求 (Requirements)
1. **建立新模組 `src/abc_jianpu_renderer.ts`**：
   - 封裝 `JianpuVoiceRenderer`，提供 `calculateHeight` 與 `render` 二大 Seam。
   - 移入原本位於 `ABCVoiceElement` 內的所有簡譜私有輔助繪圖方法。
2. **重構 `src/abc_graphelements.ts`**：
   - 移除 `ABCVoiceElement` 內部的簡譜私有方法。
   - 將 `jianpu_draw` 改寫為對 `JianpuVoiceRenderer.render` 的單行委託呼叫。
   - 重構 `ABCStaffGroupElement.draw` 高度計算邏輯，改為呼叫 `JianpuVoiceRenderer.calculateHeight`。
3. **更新打包與測試 (`src/index.ts`, `test-jianpu-07.js`)**：
   - 於 `index.ts` 重新導出並在全域 `window` 掛載 `JianpuVoiceRenderer`。
   - 重構 `test-jianpu-07.js` 單元測試以測試 `JianpuVoiceRenderer.render` Seam。

### 驗收條件 (Acceptance Criteria)
- `pnpm run build` 打包編譯無誤。
- `node test-jianpu-*.js` 所有 7 個簡譜測試全數綠燈。
- `node test.js` 傳統回歸測試 100% 正常。
- `node test/compare_ast.js` 語法樹比對一致。



