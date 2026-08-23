# CLAUDE.md

## Project Overview
`abcTS` 是 abcjs（ABC 記譜法解析與渲染庫）的 TypeScript 重構專案，正從舊版 vanilla JS 遷移到 TypeScript + Vite。核心工作是為 ABC notation 新增「簡譜（Jianpu）」渲染支援，並用比對測試框架驗證新舊兩版輸出 100% 一致。

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | 啟動 Vite 開發伺服器（自動開啟 `src/workspace.html`） |
| `npm run build` | 打包成 UMD 格式的 `dist/abcjs-basic.js`（供舊版程式碼以 `window.ABCJS` 存取） |
| `node test/compare_ast.js` | 執行 AST / DrawLog 比對測試（新舊版本核對），log 輸出到 `test/logs/` |

## Architecture
- **`src/`**：所有原始碼皆為扁平結構（無子資料夾），檔名以 `abc_*.ts` 為主，對應 abcjs 原本的模組劃分（parser、tokenizer、layout、write、glyphs 等）。
- **`src/index.ts`**：統一入口，將所有主要 class/function 掛到 `window.*`（相容舊版全域呼叫）並同時提供標準 ESM `export`。
- **簡譜（Jianpu）子系統**：
  - `abc_jianpu_write.ts` — 音高轉簡譜數字（`pitchToJianpu`）、時值分解（`decomposeDuration`）
  - `abc_jianpu_renderer.ts` — `JianpuVoiceRenderer`，簡譜聲部的 SVG 繪製邏輯
  - 在 ABC 中以 `V:N clef=jianpu` 宣告，與 `clef=treble` 共用同一個 layout（x 座標、小節線對齊），只在 Write 層輸出不同 SVG
  - **完整術語表見 `CONTEXT.md`**（Browser Sandbox、AST、DrawLog、Scale Degree、Octave Dots、Duration Line 等定義，開發前務必先讀）
- **`test/`**：比對測試框架
  - `compare_ast.js` — 主測試腳本，透過 `test/helpers/browserSandbox.js` 用 Node `vm` 模組建立隔離的 DOM/SVG 沙盒環境，比對新舊版本產生的 AST 與 DrawLog 是否 100% 一致
  - `test/helpers/` — `mockPaper`、`svgProxy`、`compareEngine`、`functionTracer` 等輔助模組
  - `test/logs/` — 帶時間戳記的比對紀錄（`compare_YYYYMMDD_HHMMSS.log`）
- **`vite.config.js`**：build 時額外複製 `workspace.html` 及靜態資源（css/txt/json）到 `dist/`，並把 `<script type="module">` 替換成打包後的單一 UMD script 標籤。
- **路徑別名**：`@/*` → `src/*`，`@@/*` → `src/stories/score/*`（見 `tsconfig.json`）。

## Code Style
- Tab 縮排（非 space）
- `tsconfig.json` 關閉了 `strictNullChecks` 與 `strictPropertyInitialization`（漸進式遷移中，尚未全面 strict）
- 大量沿用舊版全域掛載模式（`(window as any).X = X`），這是為了相容舊程式碼，遷移時勿隨意移除
- 中文註解常見於核心邏輯檔案（尤其 jianpu 相關），保留 Traditional Chinese 註解風格

## Notes
- `README.md` 是 Vite create-react-ts 模板產生的通用內容，**與本專案實際功能無關**，不要依賴它了解專案
- `CONTEXT.md`（根目錄）是最重要的領域知識文件，包含 ABC/簡譜相關的精確術語定義，處理 jianpu 功能前必讀
- `src/context.md`（注意：與根目錄 `CONTEXT.md` 不同檔案）是給 AI 的角色扮演提示詞（ABC notation 與簡譜轉換專家）
- 根目錄有多個 `ai-qa*.md` 與 `ai_qa.md`：過去與 AI 討論的紀錄，可能包含尚未寫入正式文件的決策脈絡
- 比對測試依賴 Node `vm` 模組隔離全域原型鏈污染（舊版 `Prototype.js` 會污染 `Array.prototype` 等），修改核心解析/繪圖邏輯後應跑一次 `compare_ast.js` 確認未破壞既有行為
- `dist/`、`node_modules/`、`.vs/`、`obj/` 為產生物或 IDE 檔案，不要手動編輯

---
*本檔案由 Claude 分析程式碼自動產生，未涵蓋的部分（如未寫入文件的團隊慣例、業務邏輯決策）需要你補充。有想新增或修改的地方嗎？*
