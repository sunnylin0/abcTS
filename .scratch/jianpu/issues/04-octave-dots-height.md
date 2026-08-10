# 04 - 八度點 + 動態 Staff 高度

**What to build:** 讓高音（octaveDelta > 0）在數字上方顯示對應數量的圓點，低音（octaveDelta < 0）在數字下方顯示圓點；同時讓 jianpu staff 的高度根據實際音域動態調整，避免八度點與相鄰聲部重疊。

**Blocked by:** 03 - Scale Degree 數字渲染

**Status:** ready-for-agent

- [x] drawJianpu() 在數字上方繪製 octaveDelta 個圓點（SVG circle 或小 path），間距一致
- [x] drawJianpu() 在數字下方繪製 |octaveDelta| 個圓點（octaveDelta < 0 時）
- [x] ABCStaffGroupElement.draw() 計算 jianpu staff 動態高度：baseHeight + maxOctaveDots * dotSpacing
- [x] maxOctaveDots 在 drawJianpu() 執行前遍歷所有 children 計算 max(|octaveDelta|)
- [x] DrawLog 快照測試：高兩個八度的 c'' 音，驗證上方兩個圓點的 SVG 位置
- [x] DrawLog 快照測試：低一個八度的 C, 音，驗證下方一個圓點的 SVG 位置
