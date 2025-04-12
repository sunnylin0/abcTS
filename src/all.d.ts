
declare function str_repeat(i: any, m: number): string;
declare function sprintf(format: string, ...args: (string | number)[]): string;


interface Raphael {
	fn: {
		toRelative(pathArray: any[] | string): any[];
	};
	path(pathString: string): any;
	parsePathString(pathString: string): any[];
	is(value: any, type: string): boolean;
	_path2string: () => string;
}

interface Font {
	face: {
		"units-per-em": number;
	};
	glyphs: {
		[key: string]: {
			d: string;
		};
	};
}

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
	| "key";

type NoteAccidental = "none" | "dbl_flat" | "flat" | "natural" | "sharp" | "dbl_sharp";
type BarType =
	| "bar_thin"
	| "bar_thin_thick"
	| "bar_thin_thin"
	| "bar_thick_thin"
	| "bar_right_repeat"
	| "bar_left_repeat"
	| "bar_double_repeat";
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
	el_type: "rest";
	duration: number;
	chord?: string;
}

interface NoteElement extends ElementBase {
	el_type: "note";
	accidental: NoteAccidental;
	pitch: number;
	duration: number;
	chord?: string;
	end_beam?: boolean;
	decoration?: Decoration;
}

interface BarElement extends ElementBase {
	el_type: "bar";
	type: BarType;
	start_first_ending?: boolean;
	start_second_ending?: boolean;
	end_first_ending?: boolean;
	end_second_ending?: boolean;
}

interface ClefElement extends ElementBase {
	el_type: "clef";
	type: ClefType;
}

interface KeySigElement extends ElementBase {
	el_type: "key-sig";
	num: number;
	dir: KeySigDir;
	extra?: { pitch: number; type: NoteAccidental }[];
}

interface MeterElement extends ElementBase {
	el_type: "meter";
	type: MeterType;
	num?: number;
	den?: number;
}

type AbcElement = RestElement | NoteElement | BarElement | ClefElement | KeySigElement | MeterElement;

interface StaffLine {
	staff: AbcElement[];
}


interface SubtitleLine {
	subtitle: string;
}

type Line = StaffLine | SubtitleLine;


// Parse

type KeySignature = {
	num: number;
	acc?: "sharp" | "flat";
};

type DurationInfo = [number, number, number?]; // [charactersConsumed, duration, nextNoteDuration?]
type AccentInfo = [number, string]; // [charactersConsumed, accent]
type AccidentalInfo = [number, "" | "sharp" | "natural" | "flat"];
type SpacerInfo = [number, "" | "spacer"];
type BarInfo = [number, string]; // [charactersConsumed, barType]




type BarEndingInfo = [number, string[]]; // [charactersConsumed, endingAttributes]
type PitchInfo = [number, number]; // [charactersConsumed, pitch]

interface MultilineVars {
	iChar: number;
	key: KeySignature;
	meter: MeterElement;
	hasMainTitle: boolean;
	copyright: string;
	transcription: string;
	notes: string;
	rhythm: string;
	reset(): void;
}


////  abc_write

interface Glyph {
	d: (string | number)[][];
	w: number;
	h: number;
}

interface Glyphs {
	[key: string]: Glyph;
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
	private _playFreq(frequency: number, seconds: number): void;

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
	private _consumeLine(This: PlayTune): void;

}

/**
 * 將數據打包為二進制格式
 * @param format 格式字符串
 * @param value 數值
 * @returns 打包後的字符串
 */
declare  pack(format: string, value: number): string;