
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
 * 小節線解析結果
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
	notes: NOTES_Element[];
}

/**
 * 行內 Inline 標頭欄位 (如 [K:C]) 解析結果
 */
interface InlineHeaderResult {
	/** 消耗的字元長度 */
	len: number;
	/** 標頭類型英文字母 (如 'K', 'M', 'Q' 等) */
	headerLetter?: string;
	/** 標頭的內容字串 */
	content?: string;
}

/**
 * 行首與 Body 標頭欄位 (如 K:C) 解析結果
 */
interface BodyHeaderResult {
	/** 消耗的字元長度 */
	len: number;
	/** 標頭類型英文字母 (如 'K', 'M', 'Q' 等) */
	headerLetter?: string;
	/** 標頭的內容字串 */
	content?: string;
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
	[key: string]: string;
	tempo?: TempoInfo
}

interface TempoInfo {
	multiplier?: number;
	bpm?: number;
	duration?: number[];
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

	jazzchords?: boolean;
}


interface ElementBase {
	el_type?: ElementType;
	startChar?: number;
	endChar?: number;
}

interface RestElement extends Omit<ABCElement, 'el_type'> {
	el_type: "rest";
}

interface NoteElement extends Omit<ABCElement, 'el_type'> {
	el_type: "note";
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
	duration?: number[]
	noteLength?: number;
	bpm?: number;
	preString?: string;
	postString?: string;
}

interface StemElement extends Omit<ABCElement, 'el_type'> {
	el_type: "stem";
	direction?: 'up' | 'down';
}

type NOTES_Element = NoteElement | RestElement | BarElement | ClefElement | KeySigElement | MeterElement | TempoElement | StemElement;

interface ABCElement extends ElementBase {
	accidentals?: { acc?: string, note?: string, verticalPos?: number }[],

	type?: string;
	pitches?: Pitch[];
	rest?: {
		type: string;
		endSlur?: number | number[];
		endTie?: boolean;
		startSlur?: number | number[];
		startTie?: boolean;
	};
	chord?: Chord[];
	barNumber?: number | string;
	startEnding?: string,
	endEnding?: boolean,
	duration?: number;
	bpm?: number;
	decoration?: string[];
	gracenotes?: ABCElement[];
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
	tempo?: Tempo;
	title?: string;
	title?: string;
	rhythm?: string;
	author?: string;
	origin?: string;
	composer?: string;
	group?: string;

	partOrder?: string;
	notes?: string;
	book?: string;
	source?: string;
	transcription?: string;
	discography?: string;
	history?: string;
	unalignedWords?: string;
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
	startSlur?: number | number[];
	endSlur?: number | number[];
	verticalPos?: number;
	printer_shift?: string
}

interface GraceNote {
	pitch?: number;
	verticalPos?: number;
	accidental?: NoteAccidental;
}





interface Voice_Staff_voices {
	el_type?: string;
	startChar?: number;
	endChar?: number;
	pitches?: Pitch[];
	gracenotes?: NOTES_Element[];
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
