# 01 — Type 系統 + Parser 支援 jianpu

**What to build:** 讓 abcTS 的 parser 完整認識 `clef=jianpu`，不再噴 "Unknown clef" 警告，並在解析 `K:` 欄位時自動計算大調主音（`KeySigElement.root`），為後續 Write 層的首調唱名法計算做好準備。同時支援 `V:N clef=jianpu octave=N` 的 octave 參數讀取。

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [x] `ClefType` 加入 `"jianpu"`，使其與 `"treble"`、`"bass"` 並列為合法譜號
- [x] `getClef()` 加入 `jianpu` 分支，成功回傳 `{ token: 'jianpu', ... }` 而非 warn
- [x] `calcMiddle('jianpu', 0)` 回傳 `0`（與 treble 同，layout 不依賴此值）
- [x] `KeySigElement` 型別定義加入 `root?: string`（大調主音音名，如 `'C'`、`'G'`、`'Bb'`）
- [x] 解析 `K:` 後，根據升降號數量（五度圈）計算大調主音並填入 `KeySigElement.root`；小調取相對大調主音（`K:Am` → root=`'C'`）
- [x] 解析 `V:` 行時，辨識並儲存 `octave=N` 參數至 voice metadata
- [x] `abc_parser_lint.ts` 的 clef schema 合法值列表加入 `"jianpu"`（避免 Stage B 誤報）
- [x] Stage A/B（AST）現有測試全部 pass，確認 `root` 欄位不破壞現有結構
