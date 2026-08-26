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

---
## [2026-07-19] 完成專案架構與渲染機制分析 (v1.2.2)
- 撰寫並發布專案分析報告 `analysis_results.md`，分析 `workspace.html` 渲染流程、`<select>` 資料流、各模組檔案定位與 DOM 渲染職責，並針對混合架構、效能優化與音訊合成模組提出改進建議。

---
## [2026-07-19] 解決 ABCElement 與 NoteElement 全域型別衝突 (v1.2.3)
- 重構並對齊 `src/all.d.ts` 中的 `ABCElement`、`NoteElement`、`BarElement` 和 `Pitch` 介面屬性型別。
- 統一將 `chord` 聲明為 `Chord` 物件（有 `name` 與 `position` 屬性），解決和弦型別衝突。
- 統一將裝飾音 `gracenotes` 聲明為 `NoteElement[]` 以允許其擁有完整音符屬性。
- 將 `startSlur` 與 `endSlur` 聲明為 `number | number[]`，以相容解析前後期的連音線資料型別。
- 統一將 `decoration` 屬性型別對齊為 `string[]`。

---
## [2026-07-20] 修正 abc_parse.ts & abc_tune.ts 型別安全性與 any 清除 (v1.2.4)
- 分析 `abc_parse.ts` 內 `el` 變數在編譯期與執行期的核心地位，將其明確重構為 `ABCElement` 型別。
- 於 `all.d.ts` 追加 `ParseStaff`、`ParseVoice`、`SlursAndTriplets` 強型別介面定義，徹底清除 `staves: any[]`、`voices: { [key: string]: any }` 等不精確之 `any` 宣告。
- 全面修復 `abc_tune.ts` 與 `abc_parse.ts` 內數十處參數、變數之 `any` 型別限制，為其添加健全的型別保護及型別斷言。

---
## [2026-07-20] 重構優化 ABCElement 與 NoteElement 繼承結構 (v1.2.5)
- 重構 `ABCElement` 使其繼承 `ElementBase`，移除重複宣告的定位欄位（`startChar` / `endChar`）。
- 讓 `NoteElement` 直接繼承 `ABCElement`，移除多達 20 餘行完全重複的屬性欄位聲明，確保型別高內聚與極簡化。
- 專案打包構建 `pnpm run build` 通過，確認無任何 TypeScript 編譯退化（Regression）。

---
## [2026-07-20] 精煉全域元素型別繼承關係與隱患修正 (v1.2.6)
- 排查出 `BarElement.startEnding` 實為 `string`（非 `boolean`）以及 `RestElement.chord` 實為 `Chord` 物件（非 `string`），並於全域型別宣告中予以修正。
- 重構並對齊 `src/all.d.ts`，讓 `RestElement`、`BarElement`、`ClefElement`、`KeySigElement` 與 `MeterElement` 全部繼承 `ABCElement`。
- 清除各子介面內重複冗餘宣告，成功通過四大核心檔案（`abc_tune.ts`, `abc_parse.ts`, `abc_layout.ts`, `abc_write.ts`）的建置編譯測試。

---
## [2026-07-20] 清理 abc_tune.ts 內的型別紅線與邏輯修復 (v1.2.7)
- 修正 `cleanUpSlursInLine` 的實參傳遞，將原本傳入 `ABCLine` 改為傳入聲部對應的 `NoteElement[]`，修復了連音線清理未實際執行的潛在 Bug。
- 修正 `fixClefPlacement` 對 `el.type` 欄位的錯誤判定為 `el.el_type`，並配合強型別做轉型處理。
- 將 `potentialStartBeam` 與 `potentialEndBeam` 型別自 `ABCBeamElem` 糾正為 `ABCElement`，解決 Beam 標記時的屬性缺失警告。
- 對 `appendElement` 的 `hashParams2` 做防禦性初始化，避免 `undefined` 引起的屬性賦值錯誤。

---
## [2026-07-20] 修復 abc_parse.ts 內與 all.d.ts 的型別與拼寫漏洞 (v1.2.8)
- 擴充 `Lyric` 介面，支援 `skip` 與 `to` 欄位以支援解析。
- 修正 `NoteAccidental` 移除底線，對齊無底線列舉值的實際代碼。
- 修正 `ParamsOther` 內 `brace` 與 `bracket` 型別為 `string`。
- 擴展休止符 `rest` 定義支援連線屬性。
- 將 `grace_notes` 與 `graceNotes` 全部拼寫修正為專案通用的 `gracenotes`。
- 新增 `abc_parse.ts` 內 slur 算式適當的型別斷言。

---
## [2026-07-20] 統一 deepCopyKey 與 startNewLine 型別對接 (v1.2.9)
- 將 `deepCopyKey` 的參數型別修正為 `{ acc?: any, note?: any, verticalPos?: number }[]`，回傳型別為 `KeySigElement`。
- 將 `addPosToKey` 與 `fixKey` 內的調號型別由 `{ accidentals: ... }` 放寬為 `KeySigElement`，適配 `params.key` 輸入。
- 重構 `abc_tune.ts` 內的 `startNewLine` 簽章，改為直接接收 `ParamsOther`，消除 L769 處傳參的型別衝突。

---
## [2026-07-20] 修復 M: (Meter) 拍號與 origMeter 的型別宣告 (v1.3.0)
- 修正 `all.d.ts` 內 `MeterElement.value` 之 `num` 與 `den` 型別定義為 `string`，適配樂譜表示與解析器之字串賦值。
- 將 `abc_parse.ts` 內 `MultilineVars.origMeter` 從 `any` 改為精確型別 `MeterElement | null`。

---
## [2026-07-20] 修復 abc_parse_header.ts 中的模組與類別型別錯誤 (v1.3.1)
- 在 `abc_parse_header.ts` 頂部補上 `AbcTune` 與 `AbcTokenizer` 的 `import`。
- 全域擴充 `Array.prototype.last` 型別，修復陣列取最後一個元素時的 TS 型別波浪線警報。
- 擴充 `KeySignature.acc` 的型別定義，支援 `"natural"`、`"dblsharp"` 等多種變音記號。

---
## [2026-07-20] 修復 abc_parse_header.ts 第二階段之類別與屬性型別錯誤 (v1.3.2)
- 於 `all.d.ts` 中的 `KeySigElement.accidentals` 新增 `verticalPos` 欄位。
- 於 `all.d.ts` 補齊 `ParseStaff` (新增 `index`、`spacing_below_offset`、`verticalPos`) 與 `ParseVoice` (可選屬性與新增 `suppressChords`)。
- 在 `abc_parse_header.ts` 定義 `HeaderToken` 介面，並以之為指令 `tokens` 進行轉型，消除屬性選填警告。
- 將 `TempoInfo.duration` 改為 `number[]` 以配合實質運算。
- 解耦 `appendElement` 的參數限制為 `NOTES_Element` 聯集，並在 `abc_parse_header.ts` 內將 `TempoInfo` 轉型為 `TempoElement` 傳遞。

---
## [2026-07-20] 產出功能移植頂級提示詞與比對測試機制 (v1.4.0)
- 新增 `migration_prompt.md` 作為移植任務的頂級指導提示詞。
- 於提示詞中內嵌設計了自動化 AST 對比測試腳本 (`compare_ast.js`)，利用 Node.js 沙盒執行期比對舊版多個 JS 解析 AST 與 TS 新打包 UMD 的 AST，確保 100% 移植無退化。
- 明確移植工作流為「分檔案/分模組」逐步執行，並規範了 TypeScript 強型別防禦及 AI 歷史紀錄保留協議。

---
## [2026-07-20] 移植 abc_tune.ts 連音線與 Beam 新增功能 (v1.5.0)
- 移植 `abcjs_20100604` 版本中 `abc_tune.js` 的兩項重要功能：
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

---
## [2026-07-19] 完成專案架構與渲染機制分析 (v1.2.2)
- 撰寫並發布專案分析報告 `analysis_results.md`，分析 `workspace.html` 渲染流程、`<select>` 資料流、各模組檔案定位與 DOM 渲染職責，並針對混合架構、效能優化與音訊合成模組提出改進建議。

---
## [2026-07-19] 解決 ABCElement 與 NoteElement 全域型別衝突 (v1.2.3)
- 重構並對齊 `src/all.d.ts` 中的 `ABCElement`、`NoteElement`、`BarElement` 和 `Pitch` 介面屬性型別。
- 統一將 `chord` 聲明為 `Chord` 物件（有 `name` 與 `position` 屬性），解決和弦型別衝突。
- 統一將裝飾音 `gracenotes` 聲明為 `NoteElement[]` 以允許其擁有完整音符屬性。
- 將 `startSlur` 與 `endSlur` 聲明為 `number | number[]`，以相容解析前後期的連音線資料型別。
- 統一將 `decoration` 屬性型別對齊為 `string[]`。

---
## [2026-07-20] 修正 abc_parse.ts & abc_tune.ts 型別安全性與 any 清除 (v1.2.4)
- 分析 `abc_parse.ts` 內 `el` 變數在編譯期與執行期的核心地位，將其明確重構為 `ABCElement` 型別。
- 於 `all.d.ts` 追加 `ParseStaff`、`ParseVoice`、`SlursAndTriplets` 強型別介面定義，徹底清除 `staves: any[]`、`voices: { [key: string]: any }` 等不精確之 `any` 宣告。
- 全面修復 `abc_tune.ts` 與 `abc_parse.ts` 內數十處參數、變數之 `any` 型別限制，為其添加健全的型別保護及型別斷言。

---
## [2026-07-20] 重構優化 ABCElement 與 NoteElement 繼承結構 (v1.2.5)
- 重構 `ABCElement` 使其繼承 `ElementBase`，移除重複宣告的定位欄位（`startChar` / `endChar`）。
- 讓 `NoteElement` 直接繼承 `ABCElement`，移除多達 20 餘行完全重複的屬性欄位聲明，確保型別高內聚與極簡化。
- 專案打包構建 `pnpm run build` 通過，確認無任何 TypeScript 編譯退化（Regression）。

---
## [2026-07-20] 精煉全域元素型別繼承關係與隱患修正 (v1.2.6)
- 排查出 `BarElement.startEnding` 實為 `string`（非 `boolean`）以及 `RestElement.chord` 實為 `Chord` 物件（非 `string`），並於全域型別宣告中予以修正。
- 重構並對齊 `src/all.d.ts`，讓 `RestElement`、`BarElement`、`ClefElement`、`KeySigElement` 與 `MeterElement` 全部繼承 `ABCElement`。
- 清除各子介面內重複冗餘宣告，成功通過四大核心檔案（`abc_tune.ts`, `abc_parse.ts`, `abc_layout.ts`, `abc_write.ts`）的建置編譯測試。

---
## [2026-07-20] 清理 abc_tune.ts 內的型別紅線與邏輯修復 (v1.2.7)
- 修正 `cleanUpSlursInLine` 的實參傳遞，將原本傳入 `ABCLine` 改為傳入聲部對應的 `NoteElement[]`，修復了連音線清理未實際執行的潛在 Bug。
- 修正 `fixClefPlacement` 對 `el.type` 欄位的錯誤判定為 `el.el_type`，並配合強型別做轉型處理。
- 將 `potentialStartBeam` 與 `potentialEndBeam` 型別自 `ABCBeamElem` 糾正為 `ABCElement`，解決 Beam 標記時的屬性缺失警告。
- 對 `appendElement` 的 `hashParams2` 做防禦性初始化，避免 `undefined` 引起的屬性賦值錯誤。

---
## [2026-07-20] 修復 abc_parse.ts 內與 all.d.ts 的型別與拼寫漏洞 (v1.2.8)
- 擴充 `Lyric` 介面，支援 `skip` 與 `to` 欄位以支援解析。
- 修正 `NoteAccidental` 移除底線，對齊無底線列舉值的實際代碼。
- 修正 `ParamsOther` 內 `brace` 與 `bracket` 型別為 `string`。
- 擴展休止符 `rest` 定義支援連線屬性。
- 將 `grace_notes` 與 `graceNotes` 全部拼寫修正為專案通用的 `gracenotes`。
- 新增 `abc_parse.ts` 內 slur 算式適當的型別斷言。

---
## [2026-07-20] 統一 deepCopyKey 與 startNewLine 型別對接 (v1.2.9)
- 將 `deepCopyKey` 的參數型別修正為 `{ acc?: any, note?: any, verticalPos?: number }[]`，回傳型別為 `KeySigElement`。
- 將 `addPosToKey` 與 `fixKey` 內的調號型別由 `{ accidentals: ... }` 放寬為 `KeySigElement`，適配 `params.key` 輸入。
- 重構 `abc_tune.ts` 內的 `startNewLine` 簽章，改為直接接收 `ParamsOther`，消除 L769 處傳參的型別衝突。

---
## [2026-07-20] 修復 M: (Meter) 拍號與 origMeter 的型別宣告 (v1.3.0)
- 修正 `all.d.ts` 內 `MeterElement.value` 之 `num` 與 `den` 型別定義為 `string`，適配樂譜表示與解析器之字串賦值。
- 將 `abc_parse.ts` 內 `MultilineVars.origMeter` 從 `any` 改為精確型別 `MeterElement | null`。

---
## [2026-07-20] 修復 abc_parse_header.ts 中的模組與類別型別錯誤 (v1.3.1)
- 在 `abc_parse_header.ts` 頂部補上 `AbcTune` 與 `AbcTokenizer` 的 `import`。
- 全域擴充 `Array.prototype.last` 型別，修復陣列取最後一個元素時的 TS 型別波浪線警報。
- 擴充 `KeySignature.acc` 的型別定義，支援 `"natural"`、`"dblsharp"` 等多種變音記號。

---
## [2026-07-20] 修復 abc_parse_header.ts 第二階段之類別與屬性型別錯誤 (v1.3.2)
- 於 `all.d.ts` 中的 `KeySigElement.accidentals` 新增 `verticalPos` 欄位。
- 於 `all.d.ts` 補齊 `ParseStaff` (新增 `index`、`spacing_below_offset`、`verticalPos`) 與 `ParseVoice` (可選屬性與新增 `suppressChords`)。
- 在 `abc_parse_header.ts` 定義 `HeaderToken` 介面，並以之為指令 `tokens` 進行轉型，消除屬性選填警告。
- 將 `TempoInfo.duration` 改為 `number[]` 以配合實質運算。
- 解耦 `appendElement` 的參數限制為 `NOTES_Element` 聯集，並在 `abc_parse_header.ts` 內將 `TempoInfo` 轉型為 `TempoElement` 傳遞。

---
## [2026-07-20] 產出功能移植頂級提示詞與比對測試機制 (v1.4.0)
- 新增 `migration_prompt.md` 作為移植任務的頂級指導提示詞。
- 於提示詞中內嵌設計了自動化 AST 對比測試腳本 (`compare_ast.js`)，利用 Node.js 沙盒執行期比對舊版多個 JS 解析 AST 與 TS 新打包 UMD 的 AST，確保 100% 移植無退化。
- 明確移植工作流為「分檔案/分模組」逐步執行，並規範了 TypeScript 強型別防禦及 AI 歷史紀錄保留協議。

---
## [2026-07-20] 移植 abc_tune.ts 連音線與 Beam 新增功能 (v1.5.0)
- 移植 `abcjs_20100604` 版本中 `abc_tune.js` 的兩項重要功能：
  - **和弦獨立連音線處理**：改進 `cleanUpSlursInLine` 計算，使 gracenotes、note 本體與不同 pitches 能依據 position (chordPos) 獨立計數並增減連音線編號，解決了複音/和弦連音線互相干擾的 Bug。
  - **強制結束 Beam 判定**：在 `appendElement` 處理中，新增對 `force_end_beam_last` 的判定以在合適的時機強制收尾 Beam。
- 修復 TypeScript 專案內部的 `tsconfig.json` 警告以及 `jsonschema` 型別宣告語法錯誤。
- 透過 `compare_ast.js` 驗證與新版 JS AST 的相容性，保證 100% 一致。

---
## [2026-07-20] 移植 abc_parse.ts 多重和弦與裝飾音快捷鍵 (v1.6.0)
- 移植 `abcjs_20100604` 的 `abc_parse.js` 諸多解析新功能：
  - **多重和弦與位置擴充**：支援音符上的多個和弦（改為陣列儲存），新增左/右方向（`<`與`>`）定位解析，並在和弦後有空格時標記 `force_end_beam_last`。
  - **新增裝飾音快捷鍵**：新增 `L` (accent) 與 `P` (pralltriller) 解析支援。
  - **換行續接優化**：續行符號引入 `continuationReplacement`，以長空格填充註解，避免字元索引偏移。
- 微調 `abc_layout.ts` 使其遍歷 `elem.chord` 陣列以繪圖，解決型別改變所造成的編譯報錯。
- 對比測試 `compare_ast.js` 透過重構為獨立 `vm` contexts 沙盒，100% 通過相容性驗證。

---
## [2026-07-20] 移植 abc_parse_header.ts 低音譜號八度與 G 欄位支持 (v1.7.0)
- 移植 `abcjs_20100604` 的 `abc_parse_header.js` 功能與 bug 修正：
  - **低音譜號 accidental 八度調整**：在解析調號後，當譜號類型為 `'bass'` 時，對 `ret.accidentals` 當中 'C'、'D'、'E'、'F'、'G' 音符八度進行修正；否則，對 `'a'`、`'b'`、`'C'` 音符進行修正。
  - **'G:' 詮釋資料支持**：在 `metaTextHeaders` 中新增 `'G': 'group'` 的解析映射，並在 `all.d.ts` 介面中新增 `group?: string;` 屬性。
- 通過 UMD 打包及 TypeScript 靜態編譯無報錯。

---
## [2026-07-20] 移植 abc_graphelements.ts 圖形佈局與連音線強制方向 (v1.8.0)
- 移植 `abcjs_20100604` 的 `abc_graphelements.js` 功能與 bug 修正：
  - **排版時間指標對齊**：實作 `getDurationIndex`，修正無時值元素排版前置順序。
  - **多聲部 stave 高度與最值**：補齊 `addVoice` 雙引數 `(voice, staffnumber)` 與 stave高度最值更新邏輯。
  - **繪圖偏移修正**：修正 `otherchildren` 的起點為 `this.startx + 10`，修正 `draw` 方法的 Y 指派。
  - **連音線強制方向與音高位移**：重構 `ABCTieElem.draw` 支援 `"up"`/`"down"` 方向與 `pitchshift` 偏移量。
  - **符號縮放參數**：修正 `printSymbol` 的 fourth/fifth 參數縮放引數傳遞。
- 微調 `abc_layout.ts` 以相容 addVoice 的參數變更，順利通過 UMD 打包與 TypeScript 靜態檢查。

---
## [2026-07-20] 移植 abc_layout.ts 休止符適配、多重和弦定位與隱形小節線 (v1.9.0)
- 移植 `abcjs_20100604` 的 `abc_layout.js` 剩餘功能與 bug 修正：
  - **休止符預設音高對齊**：休止符預設音高基於 `this.stemdir` 的值作動態修正，並正確渲染及更新點號 dotshiftx 空間限制。
  - **多重和弦與 Annotations 定位渲染**：支援 `"left"`、`"right"`、`"below"` 以及預設位置，並運用 `roomtaken`/`roomtakenright` 控制繪圖重疊偏置。
  - **歌詞與極值方向**：歌詞渲染改為 `addRight` 並給予寬度，符頭新增 `extreme` 邊界屬性。
  - **連音線方向對齊與隱形小節線**：修正 `ABCTieElem` 在 startTie/endSlur/startSlur 的 stemdir 傳參。新增 `bar_invisible` 支持，並修正 `thick` 粗體小節線粗細（linewidth 由 0.6 改為 4）。
- 順利通過 UMD 打包與 TypeScript 靜態型別檢查。

---
## [2026-07-20] 移植 abc_write.ts 性能優化群組合併與行高公式修正 (v1.10.0)
- 移植 `abcjs_20100604` 的 `abc_write.js` 核心繪圖渲染功能與 bug 修正：
  - **性能優化路徑合併**：實作 `beginGroup`, `addPath`, `endGroup` 快取相對化路徑轉換，並修正大寫 "M" 坐標重複累加偏移 Bug。
  - **符幹手性與繪圖快取**：於 `printStem` 中補齊 `dx < 0` 的手性校正，使符幹路徑與符號繪製之相對路徑（若 `this.ingroup` 成立）正確寫入合併優化快取。
  - **樂譜與 stave 高度公式微調**：紙張預設寬度改為 `740`。修改 `printABC` 行高度累計公式。
- 修復 `abc_graphelements.ts` 當中 `ABCStaffGroupElement.draw` 遺漏指派 staffs 各 stave 的 Y 軸座標的 Bug，完美解決多行五線譜重疊於 y=0 處的崩潰問題。
- 順利通過 UMD 打包與 TypeScript 靜態型別檢查。

---
## [2026-07-20] 修復 AST 與繪圖對比 Mismatches，實現 100% 對齊 (v1.11.0)
- 修正 `abc_glyphs.ts` 內的 `printSymbol` 的記憶體引用污染 Bug，改為使用 `JSON.parse(JSON.stringify(...))` 做深拷貝。
- 修改 `printSymbol` 呼叫為 `paper.path().attr(...)`，解決 mockPaper 比較中 `path` 欄位型別不相容 Mismatch。
- 實作 SVG 專屬 `toBack()` 元素排序方法（擴充 `_svg.d.ts` 與 `svg.ts`）。
- 於 `abc_write.ts` 中的 `printStaveLine` 與 `drawArc` 當中，還原 `sprintf` 格式從 `%.3f` 至 `%f` 以相容舊版精度，並恢復被註解的 `.toBack()` 鏈式呼叫。
- 還原 `abc_graphelements.ts` 當中 `ABCStaffGroupElement.draw` 為舊版的動態高度計算，修復 Y 座標與 setSize 高度偏置 53.875px 不一致的問題。
- 順利通過 UMD 打包與 TypeScript 靜態型別檢查。

---
## [2026-07-20] 移植 abc_midiwriter.ts 多軌 MIDI 生成與和弦多音高音符 (v1.12.0)
- 移植 `abcjs_20100604` 的 `abc_midiwriter.js` 核心多音軌 MIDI 寫入功能。
- 重構 `Midi` 類別，補齊 `trackstrings`、`trackcount`、`instrument` 屬性及 `setTempo`、`startTrack`、`endTrack` 方法。
- 修正 `Midi.startNote` 首個音符 NoteOn `"%90"` 命令的丟失 Bug；修正 `addRest` 改為靜音累加，並調整 `embed` 為 QuickTime MIME 與多軌組合。
- 重構 `ABCMidiWriter.writeABC` 與 `writeABCLine`，補齊最外層對 `staff` 和 `voice` 的雙重遍歷迴圈以建構正確的多軌音軌；並將 `baseduration` 還原為定值 `1920` (480*4)。
- 修正 `getStaff` 對 `staff` 索引使用 `voice` 的越界 Bug（改回 `this.mark.staff`），且在 `constructor` 中新增對 `mark` 屬性的初始化防禦。
- 重構 `writeNote` 以遍歷和弦下的所有 `elem.pitches`，一次性寫入整個和弦的多音高 note；並修正三連音結束判定為 `elem.endTriplet`。
- 在 `setKeySignature` 中補上風笛 `formatting.bagpipes` 專屬調號適配。
- 順利通過 UMD 打包與 TypeScript 靜態型別檢查。

---
## [2026-08-26] 全專案 TypeScript 補齊缺失型別與型別庫對齊 (v1.13.0)
- 參考 `abcTS_new` 在不變動現有 JavaScript 執行期邏輯的前提下，全面補齊 `abcTS` 缺失的型別定義與 JSDoc：
  - **公用型別庫擴充 (`all.d.ts`)**：補齊 Tokenizer / Parser 回傳介面與 AST 節點（`TempoInfo`, `MeterElement`, `Pitch`, `GraceNote`, `StaffInfo`），支援 `duration` 與 `durationTempo` 相容性，並排除簡譜欄位。
  - **詞法與標頭解析模組 (`abc_tokenizer.ts`, `abc_parse_header.ts`)**：標註函式簽章，維持 Tuple 返回值型別，修正 `pitches` 字典索引。
  - **語法解析與樂曲模組 (`abc_parse.ts`, `abc_tune.ts`)**：補齊 `MultilineVars` 字型屬性與索引簽名，重構 slur 累加與 `addMetaText` 型別宣告。
  - **排版與繪圖輸出模組 (`abc_layout.ts`, `abc_write.ts`, `proto.ts`, `svg.ts`, `application.ts`)**：補齊 `startlimitelem` 與 `dotshiftx`，修正原型工具函式型別與 SVG 動態樣式指派。
- 通過 `npx tsc --noEmit` 靜態編譯檢查（0 錯誤）、`pnpm run build` 打包建置與 `node test.js` 沙盒測試。
