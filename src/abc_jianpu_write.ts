const DIATONIC_MAP: Record<string, number> = { 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6 };

/**
 * 將音高的 diatonic 索引值，根據調號 root 與基準八度，轉換為簡譜首調唱名 1-7 以及八度偏置 delta。
 * 
 * @param pitch 音符的 diatonic index (C=0, D=1, E=2, F=3, G=4, A=5, B=6, c=7...)
 * @param keyRoot 調號大調主音名稱，如 'C'、'G'、'Bb'。如果無效則預設為 'C'
 * @param refOctave 基準八度（通常由 V: 行的 octave=N 設定，預設為 0）
 * @param pitchAccidental 音符自帶的臨時升降號（如 'sharp', 'flat', 'natural'）
 * @param keyAccidentals 調號預設的升降號列表
 */
export function pitchToJianpu(
	pitch: number,
	keyRoot: string,
	refOctave: number = 0,
	pitchAccidental?: string,
	keyAccidentals?: { acc?: string; note?: string }[]
) {
	const rootLetter = keyRoot.charAt(0).toUpperCase();
	const rootDiatonic = DIATONIC_MAP[rootLetter] ?? 0;

	// 計算在 key 中的度數 (0-6)
	const diatonicPitch = ((pitch % 7) + 7) % 7;
	const degree = ((diatonicPitch - rootDiatonic + 7) % 7) + 1;

	// 計算八度偏差
	const octaveDelta = Math.floor(pitch / 7) - refOctave;

	// 判斷是否為臨時記號
	let isChromatic = false;
	let acc: 'sharp' | 'flat' | 'natural' | '' = '';

	if (pitchAccidental) {
		const noteName = ['c', 'd', 'e', 'f', 'g', 'a', 'b'][diatonicPitch];
		const inKeyAcc = keyAccidentals?.find(a => a.note === noteName)?.acc || 'natural';
		if (pitchAccidental !== inKeyAcc) {
			isChromatic = true;
			if (pitchAccidental === 'sharp' || pitchAccidental === 'dblsharp') {
				acc = 'sharp';
			} else if (pitchAccidental === 'flat' || pitchAccidental === 'dblflat') {
				acc = 'flat';
			} else if (pitchAccidental === 'natural') {
				acc = 'natural';
			}
		}
	}

	return {
		degree,
		octaveDelta,
		isChromatic,
		acc
	};
}

/**
 * 將音符時值分解為基準時值 (base) 與附點數 (dots)。
 * 例如 0.375（附點四分音符）-> base = 0.25, dots = 1。
 * 
 * @param duration 音符的相對 whole note 時值（如 0.25 代表四分音符，0.125 代表八分音符）
 */
export function decomposeDuration(duration: number) {
	let dots = 0;
	let base = duration;

	// 檢測單附點 (base * 1.5)
	const testBase1 = duration / 1.5;
	const log2_1 = Math.log2(testBase1);
	if (Math.abs(log2_1 - Math.round(log2_1)) < 1e-9) {
		dots = 1;
		base = testBase1;
		return { base, dots };
	}

	// 檢測雙附點 (base * 1.75)
	const testBase2 = duration / 1.75;
	const log2_2 = Math.log2(testBase2);
	if (Math.abs(log2_2 - Math.round(log2_2)) < 1e-9) {
		dots = 2;
		base = testBase2;
		return { base, dots };
	}

	return { base, dots };
}
