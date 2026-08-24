
declare var Raphael: any;
declare namespace Aaa {
	interface A1 {
		[key: string]: any;
	}
}

declare global {
	function str_repeat(i: any, m: number): string;
	function sprintf(format: string, ...args: (string | number)[]): string;
}

interface Array<T> {
	last(): T;
}

interface Window {
	authenticity_token: string;
}

//interface Raphael {
//	fn: {
//		toRelative(pathArray: any[] | string): any[];
//	};
//	path(pathString: string): any;
//	parsePathString(pathString: string): any[];
//	is(value: any, type: string): boolean;
//	_path2string: () => string;
//}

interface ParamsOther {
	type?: string
	el_type?: string;
	value?: any;
	startChar?: number;
	endChar?: number;
	part?: string;
	rest?: boolean;


	clef?: ClefElement;
	key?: KeySigElement;
	stem?: 'up' | 'down';
	part?: string;
	meter?: MeterElement;
	name?: string;
	subname?: string;
	vocalfont?: Font;
	bracket?: string;
	brace?: string;
	connectBarLines?: string;

	direction?: string;
	end_beam?: boolean;
	title?: string;
	duration?: number;

	jianpuOctave?: number;
}

//interface Font {
//	face: {
//		"units-per-em": number;
//	};
//	glyphs: {
//		[key: string]: {
//			d: string;
//		};
//	};
//}

interface Symbol {
	attrs: {
		path: any[] | null;
	};
	scale: (x: number, y: number, cx: number, cy: number) => void;
	getBBox: () => { width: number; height: number };
}
type PitchKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g';

type ElementType =
	| "rest"
	| "note"
	| "bar"
	| "clef"
	| "key-sig"
	| "meter"
	| "key"
	| "part"
	| "stem"
	| "tempo";

type NoteAccidental = 'flat' | 'natural' | 'sharp' | 'dblsharp' | 'dblflat' | 'quarterflat' | 'quartersharp' | 'none';
type BarType =
	| "bar_thin"
	| "bar_thin_thick"
	| "bar_thin_thin"
	| "bar_thick_thin"
	| "bar_right_repeat"
	| "bar_left_repeat"
	| "bar_dbl_repeat"
	| "bar_invisible";

type ClefType = "none" | "treble" | "tenor" | "alto" | "alto1" | "alto2" | "bass" | "bass3" | "jianpu" |
	'treble+8' | 'tenor+8' | 'bass+8' | 'alto+8' | 'treble-8' | 'tenor-8' | 'bass-8' | 'alto-8';
type KeySigDir = "sharp" | "flat";
type MeterType = "" | "common_time" | "cut_time" | "specified";
type Decoration = "upbow" | "downbow" | "accent";


type KeySignature = {
	num?: number;
	acc?: "sharp" | "sharps" | "flat" | "natural" | "dblsharp" | "dblflat" | "quarterflat" | "quartersharp";
	note?: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// abc_tokenizer.ts 回傳型別
//
// 設計說明：Parser 函數的回傳分為三個模式：
//
//   模式 A  TokenScanResult<T>  掃描器最常見輸出：{ len, token?, warn? }
//           len=0 表示未匹配；T 為 token 的具體型別。
//           涵蓋：getKeyPitch / getSharpFlat / getMode / getClef(+explicit) /
//                 getBarLine / getKeyAccidental / getVoiceToken
//
//   模式 B  帶遊標的數值解析：{ num/value, index } 或 { value, digits }
//           涵蓋：getNumber / getFraction / getInt / getFloat / getMeasurement
//
//   模式 C  語意獨特，無法歸入 A/B：
//           MeatResult / TokenOfResult (token 非 optional) / BrackettedSubstringResult
//
// KeyPitchResult, SharpFlatResult, ModeResult, GetBarLineResult, VoiceTokenResult,
// GetKeyAccidentalResult 均為 TokenScanResult<T> 的語意別名（type alias），
// 明確限定 token 型別，並保留文件用途。
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 掃描器核心回傳型別（模式 A）
 *
 * 幾乎所有 tokenizer 函數都回傳此結構，差異只在 T（token 的型別）。
 * - len = 0  表示未匹配，此時 token 必定省略
 * - len > 0  表示成功消耗 len 個字元
 * - warn     表示語法可疑但已盡力解析（soft error）
 *
 * @template T token 欄位的型別，預設為 string
 */
interface TokenScanResult<T = string> {
	/** 消耗的字元數（含前導空格），0 表示未匹配 */
	len: number;
	/** 解析出的標記，未匹配時省略 */
	token?: T;
	/** 警告訊息（soft error），若有問題才填入 */
	warn?: string;
}

// 模式 A 的語意別名 ───────────────────────────────────────────────────────────

/**
 * getKeyPitch() 回傳值
 * token 限定為大寫音名 A-G（小寫輸入會被正規化）
 */
type KeyPitchResult = TokenScanResult<'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'>;

/**
 * getSharpFlat() 回傳值
 * token 限定為 '#'（升號）或 'b'（降號）
 */
type SharpFlatResult = TokenScanResult<'#' | 'b'>;

/**
 * ABC 調式縮寫（getMode 正規化後的輸出）
 * 空字串 '' 代表大調 (Major / Ionian)
 */
type ModeToken = 'Mix' | 'Dor' | 'Phr' | 'Lyd' | 'Loc' | 'm' | '';

/**
 * getMode() 回傳值
 * token 為正規化後的調式縮寫：
 *   '' = Major/Ionian, 'm' = Minor/Aeolian,
 *   'Dor' 'Phr' 'Lyd' 'Mix' 'Loc' = 各教會調式
 */
type ModeResult = TokenScanResult<ModeToken>;

/**
 * getBarLine() 回傳值
 * token 限定為 BarType 中的合法小節線識別字串
 */
type GetBarLineResult = TokenScanResult<BarType>;

/**
 * getVoiceToken() 回傳值
 * 從 V: 欄位中擷取下一個以空格或等號分隔的標記
 */
type VoiceTokenResult = TokenScanResult<string>;

/**
 * 鍵簽名臨時記號（getKeyAccidental 的 token 欄位型別）
 */
interface AccidentalToken {
	/** 臨時記號種類（'sharp', 'flat', 'natural', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp'） */
	acc: NoteAccidental;
	/** 音名字母（a-g 或 A-G） */
	note: string;
}

/**
 * getKeyAccidental() 回傳值
 * 解析調號行中的臨時記號（如 ^C、_G 等）
 */
type GetKeyAccidentalResult = TokenScanResult<AccidentalToken>;

/**
 * getClef() 回傳值
 * 在 TokenScanResult<ClefType> 基礎上加入 explicit 欄位，
 * 表示輸入中是否有明確的 'clef=' 前綴
 */
interface GetClefResult extends TokenScanResult<ClefType> {
	/** true 表示輸入中有明確的 'clef=' 前綴 */
	explicit?: boolean;
}

// 模式 C：語意獨特，無法歸入 TokenScanResult ──────────────────────────────────

/**
 * getTokenOf() 回傳值
 * token 為必填（不論是否匹配都會回傳字串），與 TokenScanResult 的 token? 語意不同
 */
type TokenOfResult = TokenScanResult<string>;

/**
 * getMeat() 回傳值
 * 結構為 {start, end}，與 TokenScanResult 的 {len, token} 不同，
 * 表示移除行首尾空白及 % 註解後的有效字元範圍
 */
interface MeatResult {
	/** 有效內容的起始字元索引（含） */
	start: number;
	/** 有效內容的結束字元索引（不含） */
	end: number;
}

// 模式 B：帶遊標的數值解析 ────────────────────────────────────────────────────

/**
 * getNumber() 回傳值
 * 遊標模式：index 為下一個待讀取位置
 */
interface NumberResult {
	/** 解析出的整數值 */
	num: number;
	/** 停止解析後的字元索引（指向第一個非數字字符） */
	index: number;
}

/**
 * getFraction() 回傳值
 * 解析 ABC 音符時值分數（如 3/4、// 等格式），遊標模式
 */
interface FractionResult {
	/** 計算後的分數值（numerator / denominator） */
	value: number;
	/** 停止解析後的字元索引 */
	index: number;
}

/**
 * getInt() / getFloat() 共用回傳結構
 * digits=0 表示字串開頭不是數字，未成功解析
 */
interface ParsedNumberResult {
	/** 解析出的數值，若字串開頭非數字則省略 */
	value?: number;
	/** 解析時消耗的字元數（含前導空格），0 表示未成功解析 */
	digits: number;
}

/**
 * getMeasurement() 回傳值
 * 消耗的是 HeaderToken 個數（used），而非字元數（len），
 * 故不使用 TokenScanResult
 */
interface MeasurementResult {
	/** 消耗的 token 數量，0 表示未成功解析 */
	used: number;
	/** 轉換後的 points 值（1 cm = 28.35pt, 1 in = 72pt），未成功解析時省略 */
	value?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// abc_tokenizer.ts / abc_parse.ts 共用的回傳型別
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 括號內子字串解析結果
 */
interface BrackettedSubstringResult {
	/** 消耗的字元長度（包含開閉括號） */
	len: number;
	/** 括號內提取出的實際字串內容 */
	token: string;
	/** 是否成功尋找到閉合括號 */
	closed: boolean;
}

/**
 * 和弦與標註符號解析結果
 */
interface ChordParseResult {
	/** 消耗的字元長度 */
	len: number;
	/** 和弦或標註的字串名稱 */
	name: string;
	/** 繪製位置：'above' (上方)、'below' (下方)、'left' (左側)、'right' (右側) 或 'default' */
	position?: Chord['position'];
}

/**
 * 音符裝飾記號解析結果
 */
interface AccentParseResult {
	/** 消耗的字元長度 */
	len: number;
	/** 裝飾記號識別名稱（例如 'staccato', 'fermata' 等），若為 line break (驚嘆號) 則為 null */
	accent: string | null;
}

/**
 * 空白分隔符解析結果
 */
interface SpacerParseResult {
	/** 消耗的空白字元長度 */
	len: number;
}

/**
 * 小節線解析結果（abc_parse.ts letter_to_bar 用）
 * 注意：此型別與 GetBarLineResult 不同，barType 是字串而非 BarType，
 * 且包含反覆記號結尾欄位
 */
interface BarParseResult {
	/** 消耗的字元長度 */
	len: number;
	/** 小節線類型，對應 BarType 內部字串（例如 'bar_thin' 等） */
	barType: string;
	/** 反覆記號的結尾字串（例如 '1'、'2'、'1-3' 等），若無則為 undefined */
	ending?: string;
}

/**
 * 折分節奏符號 (如 >, <) 解析結果
 */
interface BrokenRhythmResult {
	/** 消耗的字元長度 */
	len: number;
	/** 當前音符時值應乘上的倍數 */
	factor1: number;
	/** 下一個音符時值應乘上的倍數 */
	factor2: number;
}

/**
 * 裝飾音 (Grace Note) 解析結果
 */
interface GraceParseResult {
	/** 消耗的字元長度 */
	len: number;
	/** 解析出的裝飾音音符陣列 */
	notes: NoteElement[];
}

/**
 * 標頭欄位解析結果
 * 適用於行內 Inline 標頭（如 [K:C]）與行首 Body 標頭（如 K:C），
 * 兩者結構完全相同，統一以此型別表示。
 */
interface HeaderFieldResult {
	/** 消耗的字元長度 */
	len: number;
	/** 標頭類型英文字母 (如 'K', 'M', 'Q' 等) */
	headerLetter?: string;
	/** 標頭的內容字串 */
	content?: string;
}

type HeaderTokenType = "alpha" | "number" | "quote" | "punct" | "";

interface HeaderToken {
	type?: HeaderTokenType;
	token?: string;
	start?: number;
	end?: number;
	continueId?: boolean;
}


/**
 * parseKey() 的解析結果
 */
interface ParseKeyResult {
	/** 是否解析到譜號 (Clef) */
	foundClef?: boolean;
	/** 是否解析到調號 (Key Signature) */
	foundKey?: boolean;
}

/**
 * setTempo() 的解析結果
 */
interface SetTempoResult {
	/** 速度設定的套用類型。'immediate': 立即套用; 'delaySet': 延遲套用; 'none': 錯誤或無效設定 */
	type: 'immediate' | 'delaySet' | 'none';
	/** 解析出的速度元素資料，無效或錯誤時省略 */
	tempo?: TempoElement;
}

/**
 * parseHeader() 的行解析結果
 */
interface ParseHeaderResult {
	/** 是否需要遞迴解析（通常是有 \x12 分隔的多行資料） */
	recurse?: boolean;
	/** 傳遞至下一步解析的剩餘或完整字串內容 */
	str?: string;
	/** 是否代表有新的一行音樂（通常是 V: 欄位在 header 結束後出現） */
	newline?: boolean;
	/** 代表此行應作為一般音樂行處理 */
	regular?: boolean;
	/** 代表此行代表歌詞欄位 w: */
	words?: boolean;
}

type DurationInfo = [number, number, number?]; // [charactersConsumed, duration, nextNoteDuration?]
type AccentInfo = [number, string]; // [charactersConsumed, accent]
type AccidentalInfo = [number, "" | "sharp" | "natural" | "flat"];
type SpacerInfo = [number, "" | "spacer"];
type BarInfo = [number, string]; // [charactersConsumed, barType]

type BarEndingInfo = [number, string[]]; // [charactersConsumed, endingAttributes]
type PitchInfo = [number, number, string?]; // [charactersConsumed, pitch]
type Alignment = "left" | "center" | "right";
interface BarTypes {
	//[key: string]: string[];
	"bar_thin": string[];
	"bar_thin_thick": string[];
	"bar_thin_thin": string[];
	"bar_thick_thin": string[];
	"bar_left_repeat": string[];
	"bar_right_repeat": string[];
	"bar_double_repeat": string[];
}


interface TokenInfo {
	acc: string;
	note: string;
}
interface MetaTextInfo {
	tempo?: TempoInfo
}

interface TempoInfo {
	multiplier?: number;
	bpm?: number;
	durationTempo?: number[];
	preString?: string;
	postString?: string;
}

interface BBox {
	x: number;
	y: number;
	width: number;
	height: number;
}
interface Font {
	font?: string;
	face?: string;
	size?: number;
	weight?: 'normal' | 'bold';
	style?: 'normal' | 'italic';
	decoration?: 'none' | 'underline';
	box?: boolean;
}

interface Formatting {
	alignbars?: number;
	aligncomposer?: Alignment;
	auquality?: string;
	bagpipes?: boolean;
	botmargin?: number;
	botspace?: number;
	bstemdown?: boolean;
	composerspace?: number;
	continueall?: boolean;
	continuous?: string;
	dynalign?: boolean;
	exprabove?: boolean;
	exprbelow?: boolean;
	flatbeams?: boolean;
	footer?: string;
	freegchord?: boolean;
	gchordbox?: boolean;
	graceSlurs?: boolean;
	gracespacebefore?: number;
	gracespaceinside?: number;
	gracespaceafter?: number;
	header?: string;
	indent?: number;
	infoline?: boolean;
	infospace?: number;
	leftmargin?: number;
	linesep?: number;
	lineskipfac?: number;
	map?: string;
	maxshrink?: number;
	maxstaffsep?: number;
	maxsysstaffsep?: number;
	measurebox?: boolean;
	midi?: string

	musicspace?: number;
	nobarcheck?: string;
	notespacingfactor?: number;
	parskipfac?: number;
	partsbox?: boolean;
	partsspace?: number;
	percmap?: Array<PercMapElement>;
	playtempo?: string;
	rightmargin?: number;
	scale?: number;
	score?: string;
	slurheight?: number;
	splittune?: boolean;
	squarebreve?: boolean;
	staffsep?: number;
	staffwidth?: number;
	stemheight?: number;
	straightflags?: boolean;
	stretchlast?: boolean;
	stretchstaff?: boolean;
	landscape?: boolean;
	slurgraces?: boolean;
	subtitlespace?: number;
	sysstaffsep?: number;
	systemsep?: number;
	textspace?: number;
	titleformat?: string;
	titleleft?: boolean;
	titlespace?: number;
	topmargin?: number;
	topspace?: number;
	vocalabove?: boolean;
	vocalspace?: number;
	wordsspace?: number;

	annotationfont?: Font;
	composerfont?: Font;
	footerfont?: Font;
	gchordfont?: Font;
	headerfont?: Font;
	historyfont?: Font;
	infofont?: Font;
	measurefont?: Font;
	pageheight?: number;
	pagewidth?: number;
	partsfont?: Font;
	repeatfont?: Font;
	subtitlefont?: Font;
	tabgracefont?: Font;
	tablabelfont?: Font;
	tabnumberfont?: Font;
	tempofont?: Font;
	textfont?: Font;
	titlefont?: Font;
	tripletfont?: Font;
	vocalfont?: Font;
	voicefont?: Font;
	wordsfont?: Font;

	barlabelfont?: Font;
	barnumberfont?: Font;

	jazzchords?: boolean;
}


interface ElementBase {
	el_type?: ElementType;
	startChar?: number;
	endChar?: number;
}

interface RestElement extends Omit<ABCElement, 'el_type'> {
	el_type: "rest";
	duration?: number;
}

interface NoteElement extends Omit<ABCElement, 'el_type'> {
	el_type: "note";
	duration?: number;
}

interface BarElement extends Omit<ABCElement, 'el_type'> {
	el_type: "bar";
	type?: BarType;
	number?: number;
}

interface ClefElement extends Omit<ABCElement, 'el_type'> {
	el_type: "clef";
	type?: ClefType;
	verticalPos: number;
}

interface KeySigElement extends Omit<ABCElement, 'el_type'> {
	el_type: "key";
	num?: number;
	dir?: KeySigDir;
	extra?: { pitch: number; type: NoteAccidental }[];
	accidentals?: {
		acc?: 'sharp' | 'dblsharp' | 'natural' | 'flat' | 'dblflat' | 'quarterflat' | 'quartersharp';
		note?: PitchKey;
		verticalPos?: number;
	}[];
	extraAccidentals?: any[];
	/** 大調主音音名（首調唱名法基準），如 'C'、'G'、'Bb'。小調取相對大調主音。由 abc_parse_header 填入。 */
	root?: string;
}

interface MeterElement extends Omit<ABCElement, 'el_type'> {
	el_type: "meter";
	type?: MeterType;
	value?: { num?: string; den?: string }[];
}

interface TempoElement extends Omit<ABCElement, 'el_type'> {
	el_type: "tempo";
	durationTempo?: number[]
	noteLength?: number;
	bpm?: number;
	preString?: string;
	postString?: string;
}

interface StemElement extends Omit<ABCElement, 'el_type'> {
	el_type: "stem";
	direction?: 'up' | 'down';
}

interface PartElement extends Omit<ABCElement, 'el_type'> {
	el_type: "part";
	title?: string;
}

type NOTES_Element = NoteElement | RestElement | BarElement | ClefElement | KeySigElement | MeterElement | TempoElement | StemElement | PartElement;

interface ABCElement extends ElementBase {
	accidentals?: { acc?: string, note?: string, verticalPos?: number }[],

	type?: string;
	pitches?: Pitch[];
	rest?: {
		type: string;
		endSlur?: number[];
		endTie?: boolean;
		startSlur?: number[];
		startTie?: boolean;
	};
	chord?: Chord[];
	barNumber?: number | string;
	startEnding?: string,
	endEnding?: boolean,
	duration?: number;
	druationTempo?: number[];
	bpm?: number;
	decoration?: string[];
	gracenotes?: GraceNote[];
	lyric?: Lyric[];

	startSlur?: number | number[];
	endSlur?: number | number[];

	startTriplet?: number;
	endTriplet?: boolean;

	startBeam?: boolean;
	endBeam?: boolean;

	end_beam?: boolean;
	force_end_beam_last?: boolean;
	title?: string;
	direction?: string;

	pitch?: number,
	startTie?: boolean,
	endTie?: boolean,
	averagepitch?: number;

	stem?: 'up' | 'down';
	minpitch?: number;
	maxpitch?: number;
	accidental?: NoteAccidental;
	verticalPos?: number;
}




interface MetaText {
	tempo?: TempoInfo;
	title?: string;

	author?: string;
	book?: string;
	composer?: string;
	discography?: string;
	url?: string;
	group?: string;
	instruction?: string;
	notes?: string;
	origin?: string;
	rhythm?: string;
	source?: string;
	unalignedWords?: string;
	transcription?: string;

	partOrder?: string;
	history?: string;
	textBlock?: string;
}

interface Chord {
	name?: string;
	position?: 'default' | 'above' | 'below' | 'left' | 'right';
}

interface Lyric {
	syllable?: string;
	divider?: string;
	skip?: boolean;
	to?: 'next' | 'slur' | 'bar';
}

interface Pitch {
	accidental?: string;
	pitch?: number;
	duration?: number;
	startTie?: boolean;
	endTie?: boolean;
	startSlur?: number[];
	endSlur?: number[];
	verticalPos?: number;
	printer_shift?: string
}

interface GraceNote {
	pitch?: number;
	verticalPos?: number;
	accidental?: NoteAccidental;
	startSlur?: number | number[];
	endSlur?: number | number[];
}

interface Voice_Staff_voices {
	el_type?: string;
	startChar?: number;
	endChar?: number;
	pitches?: Pitch[];
	gracenotes?: GraceNote[];
	end_beam?: boolean;

	// 其他潜在属性...
}

interface Staff {
	voices: NOTES_Element[][];
	clef?: ClefElement;
	key?: KeySigElement;
	meter?: MeterElement;
	title?: string[];
	vocalfont?: Font;
	bracket?: string;
	brace?: string;
	connectBarLines?: string;
	jianpuOctave?: number;
}

/** 僅存在於 abc_parse.ts 與 abc_parse_header.ts */
interface ParseStaff {
	index?: number;
	clef?: ClefElement;
	key?: KeySigElement;
	meter?: MeterElement;
	numVoices?: number;
	connectBarLines?: string;
	bracket?: string;
	brace?: string;
	vocalfont?: string;
	name?: string[];
	subname?: string[];
	spacing_below_offset?: string;
	verticalPos?: number;
}

interface ParseVoice {
	staffNum?: number;
	index?: number;
	name?: string;
	subname?: string;
	stem?: 'up' | 'down';
	suppressChords?: boolean;
	jianpuOctave?: number;
}

interface SlursAndTriplets {
	triplet?: number;
	num_notes?: number;
	startSlur?: number;
	consumed: number;
}

interface StaffInfo {
	brace?: string;
	bracket?: string;
	clef?: string;
	middle?: number;
	name?: string;
	spacing?: string;
	staves?: string;
	subname?: string;
	startStaff?: boolean;
	middle?: number;
	verticalPos?: number;
	verticalToken?: string;
	octave?: string;
}

interface Separator {
	spaceAbove?: number;
	spaceBelow?: number;
	lineLength?: number;
}
interface ABCLine {
	staff?: Staff[];
	subtitle?: string;
	separator?: Separator;
	text?: string;
}





interface Glyph {
	d: (string | number)[][];
	w: number;
	h: number;
}

interface Glyphs {
	[key: string]: Glyph;
}


interface VoiceItemBase {
	el_type?: VoiceElType;
	stafflines?: number;
	staffscale?: number;
	transpose?: number;
	type?: Clef;
	verticalPos?: number;
	clefPos?: number;
	startChar?: number;
	endChar?: number;
	rest_type?: string;
}



/**
 * 將數據打包為二進制格式
 * @param format 格式字符串
 * @param value 數值
 * @returns 打包後的字符串
 */
declare function pack(format: string, value: number): string;

// 假設 editArea 的型別定義（根據實際情況調整）
interface EditArea {

}

// abc_midiwriter.d.ts
declare function setAttributes(elm: HTMLElement, attrs: { [key: string]: string | boolean }): HTMLElement;
declare function encodeHex(s: string): string;
declare function toHex(n: number, padding: number): string;
declare function toDurationHex(n: number): string;

interface MidiMark {
	line?: number;
	staff?: number;
	voice?: number;
	pos?: number;
}