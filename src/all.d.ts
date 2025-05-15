
declare function str_repeat(i: any, m: number): string;
declare function sprintf(format: string, ...args: (string | number)[]): string;

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
	type?:string
	el_type?: string;
	value?: any;
	startChar?: number;
	endChar?: number;
	part?: string;
	rest?: boolean;
	clef?: { type: string; middle?: number };
	key?: { extraAccidentals: any[]; };
	meter?: { type: string; value: { num: string; den: string }[]; };
	name?: string;
	vocalfont?: any;
	brace?: boolean;
	bracket?: boolean;
	connectBarLines?: boolean;
	subname?: string;
	stem?: any;
	direction?: string;
	end_beam?: boolean;
	title?: string;
	duration?: number;
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

declare var Raphael: Raphael;

type ElementType =
	| "rest"
	| "note"
	| "bar"
	| "clef"
	| "key-sig"
	| "meter"
	| "key"
	| "part";

//type NoteAccidental = "none" | "dbl_flat" | "flat" | "natural" | "sharp" | "dbl_sharp";
type NoteAccidental = 'flat' | 'natural' | 'sharp' | 'dblsharp' | 'dblflat' | 'quarterflat' | 'quartersharp'
type BarType =
	| "bar_thin"
	| "bar_thin_thick"
	| "bar_thin_thin"
	| "bar_thick_thin"
	| "bar_right_repeat"
	| "bar_left_repeat"
	| "bar_dbl_repeat";

type ClefType = "treble" | "bass";
type KeySigDir = "sharp" | "flat";
type MeterType = "" | "common_time" | "cut_time" | "specified";
type Decoration = "upbow" | "downbow" | "accent";

interface ElementBase {
	el_type?: ElementType;
	startChar?: number;
	endChar?: number;
}

interface RestElement extends ElementBase {
	el_type?: "rest";
	duration?: number;
	chord?: string;
}

interface NoteElement extends ElementBase {
	el_type?: "note";
	accidental?: NoteAccidental;
	pitch?: number;
	duration?: number;
	chord?: string;
	end_beam?: boolean;
	decoration?: Decoration;
	averagepitch?: number;
	//startTie?: boolean;
	//endTie?: boolean;
	//startSlur?: number;
	//endSlur?: number;
	verticalPos?: number;
}

interface BarElement extends ElementBase {
	el_type?: "bar";
	type?: BarType;
	number?: number;
	start_first_ending?: boolean;
	start_second_ending?: boolean;
	end_first_ending?: boolean;
	end_second_ending?: boolean;
}

interface ClefElement extends ElementBase {
	el_type?: "clef";
	type?: ClefType;
}

interface KeySigElement extends ElementBase {
	el_type?: "key";
	num?: number;
	dir?: KeySigDir;
	extra?: { pitch: number; type: NoteAccidental }[];
}

interface MeterElement extends ElementBase {
	el_type?: "meter";
	type?: MeterType;
	num?: number;
	den?: number;
}

//type AbcElement = RestElement | NoteElement | BarElement | ClefElement | KeySigElement | MeterElement;


//interface AbcElement {


//	duration?: number;
//	pitches?: {
//		accidental?: string;
//		pitch: number;
//		duration?: number;
//		startTie?: boolean;
//		endTie?: boolean;
//		startSlur?: number;
//		endSlur?: number;
//	}[];
//	rest_type?: string;
//	chord?: { name: string; position: string };
//	decoration?: string[];
//	gracenotes?: any[]; // Assuming any[] for lack of details
//	lyric?: { syllable: string; divider: string };
//	startSlur?: number;
//	endSlur?: number;
//	startTriplet?: number;
//	endTriplet?: boolean;
//	end_beam?: boolean;
//	accidental?: string;


//}


interface Voice {
	el_type?: string;
	startChar?: number;
	endChar?: number;
	pitches?: Pitch[];
	gracenotes?: GraceNote[];
	end_beam?: boolean;

	// 其他潜在属性...
}

interface Staff {
	voices?: Voice[][];
	clef?: {
		middle?: number;
	};
	key?: any;
	vocalfont?: any;
	bracket?: any;
	brace?: any;
	connectBarLines?: any;
	meter?: any;
	title?: string[];
	// 其他潜在属性...
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

interface ABCElement {
	el_type?: string;
	type?: string;
	pitches?: Pitch[];
	rest?: { type: string };
	chord?: Chord;
	barNumber?: string;
	startChar?: number;
	endChar?: number;
	duration?: number;
	decoration?: string[];
	gracenotes?: GraceNote[];
	lyric?: Lyric;
	startSlur?: number;
	endSlur?: number;
	startTriplet?: number;
	endTriplet?: boolean;
	startBeam?: boolean;
	end_beam?: boolean;
	direction?: string;
	accidental?: string;
	pitch?: number,
	startTie?: boolean,
	endTie?: boolean,
	averagepitch?: number;
}

//interface ABCElement {
//	el_type: string;
//	duration?: number;
//	pitches?: {
//		pitch: number, accidental?: string, duration?: number, startTie?: boolean, endTie?: boolean, startSlur?: number, endSlur?: number,
//		printer_shift?: string
//	}[];
//	rest?: { type: string };
//	lyric?: { syllable: string, divider: string }[];
//	gracenotes?: { pitch: number, accidental?: string }[];
//	decoration?: string[];
//	barNumber?: string;
//	startTriplet?: boolean;
//	endTriplet?: boolean;
//	direction?: string;
//	startBeam?: boolean;
//	endBeam?: boolean;
//	averagepitch?: number;
//}
// Parse

type KeySignature = {
	num?: number;
	acc?: "sharp" | "sharps" | "flat";
	note?: string;
};

type DurationInfo = [number, number, number?]; // [charactersConsumed, duration, nextNoteDuration?]
type AccentInfo = [number, string]; // [charactersConsumed, accent]
type AccidentalInfo = [number, "" | "sharp" | "natural" | "flat"];
type SpacerInfo = [number, "" | "spacer"];
type BarInfo = [number, string]; // [charactersConsumed, barType]

interface TokenInfo {
	acc: string;
	note: string;
}


type BarEndingInfo = [number, string[]]; // [charactersConsumed, endingAttributes]
type PitchInfo = [number, number, string?]; // [charactersConsumed, pitch]

interface MetaTextInfo {
	[key: string]: string;
	tempo?: TempoInfo
}

interface TempoInfo {
	multiplier?: number;
	bpm?: number;
	duration?: number;
}

//interface MultilineVarsElement {
//	iChar: number;
//	key: { regularKey: KeySignature };
//	meter: MeterElement;
//	hasMainTitle: boolean;
//	default_length: number;
//	tempo?: TempoInfo;
//	clef: string,
//	next_note_duration: number,
//	start_new_line: boolean,
//	is_in_header: boolean,
//	partForNextLine: string,
//	havent_set_length: boolean,
//	warnings: any,
//	reset(): void
//}


////  abc_write


interface Glyph {
	d: (string | number)[][];
	w: number;
	h: number;
}

interface Glyphs {
	[key: string]: Glyph;
}
declare interface Font {
	font?: string;
	face?: string;
	size?: number;
	weight?: 'normal' | 'bold';
	style?: 'normal' | 'italic';
	decoration?: 'none' | 'underline';
	box?: boolean;
}
//declare interface String {
//	/**
//	 * Converts string to number with enhanced parsing capabilities
//	 * - Supports hex(0x), binary(0b), octal(0o) prefixes
//	 * - Handles scientific notation (1.23e4)
//	 * - Automatic trim and whitespace removal
//	 * - Graceful handling of trailing characters
//	 * @returns Parsed number or NaN
//	 */
//	toNumber(): number;
//}
interface FormattingInfo {
	scale?: number;
	staffwidth?: number;
	stretchlast?: boolean;
	sep?: string;
}
declare interface Formatting {
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


interface BBox {
	x: number;
	y: number;
	width: number;
	height: number;
}
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

interface Element_XXX {
	pitches?: Pitch[];
	accidental?: string;
	pitch?: number;
	duration?: number;
	startTie?: boolean;
	endTie?: boolean;
	startSlur?: number;
	endSlur?: number;
	rest_type?: string;
	lyric?: Lyric;
	gracenotes?: GraceNote[];
	decoration?: string[];
	chord?: Chord;
	startTriplet?: boolean;
	endTriplet?: boolean;
}

interface Pitch {
	accidental?: string;
	pitch?: number;
	duration?: number;
	startTie?: boolean;
	endTie?: boolean;
	startSlur?: number;
	endSlur?: number;
	verticalPos?: number;
	printer_shift?: string
}

interface Lyric {
	syllable?: string;
	divider?: string;
}

interface GraceNote {
	pitch?: number;
	verticalPos?: number;
	accidental?: NoteAccidental;
}

interface Chord {
	name: string;
	position?: string;
}


//declare class ABCAbsoluteElement {
//	abcelem: ABCElement;
//	duration: number;
//	minspacing: number;
//	x: number;
//	children: ABCRelativeElement[];
//	heads: ABCRelativeElement[];
//	extra: ABCRelativeElement[];
//	extraw: number;
//	decs: any[];
//	w: number;
//	right: ABCRelativeElement[];

//	getMinWidth(): number;
//	getExtraWidth(): number;
//	addExtra(extra: any): void;
//	addHead(head: any): void;
//	addRight(right: any): void;
//	addChild(child: any): void;
//	draw(printer: ABCPrinter): void;
//	highlight(): void;
//	unhighlight(): void;
//}

//declare class ABCRelativeElement {
//	x: number;
//	c: string | null;
//	dx: number;
//	w: number;
//	pitch: number;
//	scalex: number;
//	type: string;
//	graphelem?: SVGElement;

//	draw(printer: ABCPrinter, x: number): any;
//}



interface Elem {
	type: string;
	start_first_ending: any;
	start_second_ending: any;
	end_first_ending: any;
	end_second_ending: any;
}

interface PlayTune {

	constructor();

	/**
	 * 播放指定頻率的聲音
	 * @param frequency 頻率
	 * @param seconds 持續時間（秒）
	 */
	_playFreq(frequency: number, seconds: number): void;

	/**
	 * 播放樂曲
	 * @param tune 樂曲數據（二維數組，表示音符和時值）
	 * @param tempo 速度（BPM）
	 */
	play(tune: number[][], tempo: number): void;

	/**
	 * 停止播放
	 */
	stop(): void;

	/**
	 * 逐行播放樂曲
	 * @param This PlayTune 實例
	 */
	_consumeLine(This: PlayTune): void;

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



