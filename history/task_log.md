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
