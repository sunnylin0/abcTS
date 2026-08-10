import { KeySigElement } from "./all";

const DIATONIC_MAP: Record<string, number> = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };

/**
 * 將音高的 diatonic 索引值，根據調號 root 與基準八度，轉換為簡譜首調唱名 1-7 以及八度偏置 delta。
 * 
 * @param pitch 音符的 diatonic index (C=0, D=1, E=2, F=3, G=4, A=5, B=6, c=7...)
 * @param keyRoot 調號大調主音名稱，如 'C'、'G'、'Bb'。如果無效則預設為 'C'
 * @param refOctave 基準八度（通常由 V: 行的 octave=N 設定，預設為 0）
 */
export function pitchToJianpu(
	pitch: number,
	keyRoot: string,
	refOctave: number = 0
) {
	const rootLetter = keyRoot.charAt(0).toUpperCase();
	const rootDiatonic = DIATONIC_MAP[rootLetter] ?? 0;
	
	// 計算在 key 中的度數 (0-6)
	const diatonicPitch = ((pitch % 7) + 7) % 7;
	const degree = ((diatonicPitch - rootDiatonic + 7) % 7) + 1;
	
	// 計算八度偏差
	const octaveDelta = Math.floor(pitch / 7) - refOctave;
	
	return {
		degree,
		octaveDelta,
		isChromatic: false, // 暫留，Ticket 06 處理
		acc: '' as const    // 暫留，Ticket 06 處理
	};
}
