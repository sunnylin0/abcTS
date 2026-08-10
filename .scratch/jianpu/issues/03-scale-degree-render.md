# 03 - Scale Degree 數字渲染

**What to build:** 實作核心的 pitchToJianpu() 純函數，讓 jianpu 聲部顯示正確的 1-7 數字（首調唱名法）。此票不處理八度點、臨時記號、時值線——只要數字正確出現即為完成。

**Blocked by:** 02 - Layout Write 橋接管線

**Status:** ready-for-agent

- [x] 實作 pitchToJianpu(pitch, rootPitch, refOctave) 純函數，回傳 { degree: 1-7, octaveDelta, isChromatic, acc }
  - degree = ((pitch % 7 - rootDiatonic + 7) % 7) + 1
  - octaveDelta = Math.floor(pitch / 7) - refOctave
  - isChromatic：note 的 accidental 不為空且不在 KeySigElement.accidentals 列表中
- [x] drawJianpu() 遍歷 children，對每個 NoteElement 呼叫 pitchToJianpu()，以 SVG text 元素在正確 x/y 位置輸出數字
- [x] 和弦 [CEG] 只取 pitches 陣列最後一個元素（最高音）顯示
- [x] 對 pitchToJianpu() 撰寫 table-driven 單元測試：
  - K:C 大調：C D E F G A B c 顯示為 1 2 3 4 5 6 7 1（高八度）
  - K:G 大調：G A B c d e f# g 顯示為 1 2 3 4 5 6 7 1
  - K:Am 小調：A B c d 顯示為 6 7 1 2
- [x] DrawLog 快照測試：K:C 大調四個四分音符 C D E F，驗證 SVG text 內容與 x 座標
