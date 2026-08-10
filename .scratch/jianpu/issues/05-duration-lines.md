# 05 - 時值線（延音橫線 + 底線 + 連梁）

**What to build:** 讓 jianpu 聲部完整呈現時值資訊：二分音符後接橫線、八分音符下方有底線、同 beam group 的音符共用連貫底線，十六分音符有兩條底線。所有線條以 SVG path 精確繪製。

**Blocked by:** 04 - 八度點 + 動態 Staff 高度

**Status:** ready-for-agent

- [x] 全音符後繪製三條延音橫線，二分音符後繪製一條延音橫線（SVG path/line）
- [x] 八分音符在數字下方繪製一條底線，十六分音符兩條底線
- [x] 連梁判斷：收集 startBeam 到 endBeam 之間所有音符的 x 範圍，繪製共用底線（一條橫跨整個 beam group 的底線）
- [x] 非 beam group（空白分隔）的短音符各自繪製獨立底線
- [x] 附點音符在數字右側繪製一個圓點
- [x] DrawLog 快照測試：連梁音符 E/F/C/D/（無空白），驗證共用底線的 x1/x2 範圍
- [x] DrawLog 快照測試：獨立音符 C/ D/ E/（有空白），驗證各自獨立底線
- [x] DrawLog 快照測試：二分音符後的延音橫線長度與位置
