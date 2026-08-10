# 06 - 臨時記號 Glyph + 行首標記

**What to build:** 讓調外的臨時升降音在數字前顯示真正的 SVG sharp/flat glyph（複用現有 abc_glyphs.ts 的 Emmentaler 字型路徑），並在每行 jianpu 聲部行首輸出「1=G」調名標記與拍號文字，完成完整的簡譜輸出。

**Blocked by:** 05 - 時值線（延音橫線 + 底線 + 連梁）

**Status:** ready-for-agent

- [ ] pitchToJianpu() 的 isChromatic 判斷：note accidental 不為空且該升降號不在 KeySigElement.accidentals 列表中
- [ ] 調外臨時升降音：在數字的 SVG text 元素左側插入 accidentals.sharp 或 accidentals.flat glyph（複用 abc_glyphs.ts 現有 printSymbol 機制）
- [ ] 調內音（in-key）：完全不加任何符號，直接顯示數字
- [ ] 行首標記：drawJianpu() 在每行第一個 element 前，在 jianpu voice 的 y 座標位置插入「1=G」（由 KeySigElement.root 推算）文字
- [ ] 行首標記：同位置緊接插入拍號文字（如「4/4」），從 MeterElement 讀取
- [ ] DrawLog 快照測試：K:G 大調中出現 F♮（調外臨時還原），驗證 glyph 出現在 4 的左側
- [ ] DrawLog 快照測試：K:G 大調的 F# 音顯示為 4（無任何記號）
- [ ] DrawLog 快照測試：行首「1=G」與「4/4」文字的 x/y 座標與內容
- [ ] 整合測試：完整一首 K:G M:4/4 的樂曲，treble + jianpu 雙聲部，DrawLog 全量比對
