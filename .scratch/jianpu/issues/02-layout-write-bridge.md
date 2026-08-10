# 02 — Layout → Write 橋接管線

**What to build:** 讓 jianpu Voice 的 clef 資訊從 AST 流通到繪圖層，並讓 jianpu 聲部渲染為空白（無五條線、無音符）。這一票確立整個 pipeline 的資料流，讓後續票可以各自填入繪圖邏輯。

**Blocked by:** 01 — Type 系統 + Parser 支援 jianpu

**Status:** ready-for-agent

- [x] `ABCVoiceElement` 新增屬性：`clef: ClefType`（預設 `'treble'`）與 `jianpuOctave?: number`
- [x] `ABCVoiceElement` 新增 `jianpuKey?: KeySigElement` 參照（指向當前調號物件）
- [x] Layout 層建立 voice 時，從 staff clef/key 填入上述三個屬性
- [x] `ABCStaffGroupElement.draw()` 對 jianpu staff 跳過 `printStave()`（不畫五條線）
- [x] `ABCVoiceElement.draw()` 開頭加 jianpu 分支：若 `this.clef === 'jianpu'` 則呼叫 `drawJianpu()` 並 return；`drawJianpu()` 此時為空 stub
- [x] 驗證：輸入含 `V:2 clef=jianpu` 的 ABC 樂譜，jianpu 聲部區域無五條線、無音符頭，treble 聲部不受影響
- [x] Stage D（DrawLog）現有無 jianpu 的測試案例 0 差異
