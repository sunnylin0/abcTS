/**
 * @author paulrosen
 */


/*global Class */
/*extern AbcTune, ParseAbc */

// This is the data for a single ABC tune. It is created and populated by the ParseAbc class.
class AbcTune {
	// The structure consists of a hash with the following two items:
	// metaText: a hash of {key, value}, where key is one of: title, author, rhythm, source, transcription, unalignedWords, etc...
	// tempo: { noteLength: number (e.g. .125), bpm: number }
	// lines: an array of elements, or one of the following:
	//
	// STAFF: array of elements
	// SUBTITLE: string
	//
	// TODO: actually, the start and end char should modify each part of the note type
	// The elements all have a type field and a start and end char
	// field. The rest of the fields depend on the type and are listed below:
	// REST: duration=1,2,4,8; chord: string
	// NOTE: accidental=none,dbl_flat,flat,natural,sharp,dbl_sharp
	//		pitch: "C" is 0. The numbers refer to the pitch letter.
	//		duration: .5 (sixteenth), .75 (dotted sixteenth), 1 (eighth), 1.5 (dotted eighth)
	//			2 (quarter), 3 (dotted quarter), 4 (half), 6 (dotted half) 8 (whole)
	//		chord: { name:chord, position: one of 'default', 'above', 'below' }
	//		end_beam = true or undefined if this is the last note in a beam.|| (elem.pitch<9) &&
	//		lyric: { syllable: xxx, divider: one of " -_" }
	// TODO: actually, decoration should be an array.
	//		decoration: upbow, downbow, accent
	// BAR: type=bar_thin, bar_thin_thick, bar_thin_thin, bar_thick_thin, bar_right_repeat, bar_left_repeat, bar_double_repeat
	//	number: 1 or 2: if it is the start of a first or second ending
	// CLEF: type=treble,bass
	// KEY-SIG: num:0-7 dir:sharp,flat
	//		extra[]: { pitch: as above, type: sharp,flat,natural }
	// METER: type: common_time,cut_time,specified
	//		if specified, { num: 99, den: 99 }

	title: string = "";
	author: string;
	extraText: string = "";
	origin: string = "";
	lines: ABCLine[];
	metaText: MetaTextInfo = {};
	formatting: FormattingInfo = {};


	constructor() {
		this.reset();
	}

	reset(): void {
		this.metaText = {};
		this.formatting = {};
		this.lines = [];
	}

	appendElement(type: ElementType, startChar: number, endChar: number, hashParams: any): void {

		hashParams.el_type = type;
		hashParams.startChar = startChar;
		hashParams.endChar = endChar;
		this.lines[this.lines.length - 1].staff.push(hashParams);
	}
}
// this is a series of functions that get a particular element out of the passed stream.
// the return is the number of characters consumed, so 0 means that the element wasn't found.
// also returned is the element found. This may be a different length because spaces may be consumed that aren't part of the string.
// The return structure for most calls is { len: num_chars_consumed, token: str }
class AbcTokenizer {
	constructor() { }
	skipWhiteSpace = function (str: string) {
		for (let i = 0; i < str.length; i++) {
			if (!this.isWhiteSpace(str[i]))
				return i;
		}
		return str.length;	// It must have been all white space
	};

	finished = function (str: string, i: number) {
		return i >= str.length;
	};

	eatWhiteSpace = function (line: string, index: number) {
		let i;
		for (i = index; i < line.length; i++) {
			if (!this.isWhiteSpace(line[i]))
				return i - index;
		}
		return i - index;
	};

	// This just gets the basic pitch letter, ignoring leading spaces, and normalizing it to a capital
	getKeyPitch = function (str: string) {
		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i)) return { len: 0 };
		switch (str[i]) {
			case 'A': return { len: i + 1, token: 'A' };
			case 'B': return { len: i + 1, token: 'B' };
			case 'C': return { len: i + 1, token: 'C' };
			case 'D': return { len: i + 1, token: 'D' };
			case 'E': return { len: i + 1, token: 'E' };
			case 'F': return { len: i + 1, token: 'F' };
			case 'G': return { len: i + 1, token: 'G' };
			case 'a': return { len: i + 1, token: 'A' };
			case 'b': return { len: i + 1, token: 'B' };
			case 'c': return { len: i + 1, token: 'C' };
			case 'd': return { len: i + 1, token: 'D' };
			case 'e': return { len: i + 1, token: 'E' };
			case 'f': return { len: i + 1, token: 'F' };
			case 'g': return { len: i + 1, token: 'G' };
		}
		return { len: 0 };
	};

	// This just gets the basic accidental, ignoring leading spaces, and only the ones that appear in a key
	getSharpFlat = function (str: string) {
		switch (str[0]) {
			case '#': return { len: 1, token: '#' };
			case 'b': return { len: 1, token: 'b' };
		}
		return { len: 0 };
	};

	getMode = function (str: string) {
		const skipAlpha = function (str: string, start: number) {
			// This returns the index of the next non-alphabetic char, or the entire length of the string if not found.
			while (start < str.length && ((str[start] >= 'a' && str[start] <= 'z') || (str[start] >= 'A' && str[start] <= 'Z')))
				start++;
			return start;
		};

		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i))
			return { len: 0 };
		let firstThree = str.substring(i, i + 3).toLowerCase();
		if (firstThree.length > 1 && firstThree[1] === ' ') firstThree = firstThree[0];
		switch (firstThree) {
			case 'mix': return { len: skipAlpha(str, i), token: 'Mix' };
			case 'dor': return { len: skipAlpha(str, i), token: 'Dor' };
			case 'phr': return { len: skipAlpha(str, i), token: 'Phr' };
			case 'lyd': return { len: skipAlpha(str, i), token: 'Lyd' };
			case 'loc': return { len: skipAlpha(str, i), token: 'Loc' };
			case 'aeo': return { len: skipAlpha(str, i), token: 'm' };
			case 'maj': return { len: skipAlpha(str, i), token: '' };
			case 'ion': return { len: skipAlpha(str, i), token: '' };
			case 'min': return { len: skipAlpha(str, i), token: 'm' };
			case 'm': return { len: skipAlpha(str, i), token: 'm' };
		}
		return { len: 0 };
	};

	getClef = (str: string) => {
		let strOrig = str;
		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i))
			return { len: 0 };
		// The word 'clef' is optional, but if it appears, a clef MUST appear
		let needsClef = false;
		let strClef = str.substring(i);
		if (strClef.startsWith('clef=')) {
			needsClef = true;
			strClef = strClef.substring(5);
			i += 5;
		}
		if (strClef.length === 0 && needsClef) return { len: i + 5, warn: "No clef specified: " + strOrig };

		let j = this.skipWhiteSpace(strClef);
		if (this.finished(strClef, j)) return { len: 0 };
		if (j > 0) {
			i += j;
			strClef = strClef.substring(j);
		}
		let name: string | null = null;
		if (strClef.startsWith('treble')) name = 'treble';
		else if (strClef.startsWith('bass3')) name = 'bass3';
		else if (strClef.startsWith('bass')) name = 'bass';
		else if (strClef.startsWith('tenor')) name = 'tenor';
		else if (strClef.startsWith('alto2')) name = 'alto2';
		else if (strClef.startsWith('alto1')) name = 'alto1';
		else if (strClef.startsWith('alto')) name = 'alto';
		else if (strClef.startsWith('none')) name = 'none';
		else
			return { len: i + 5, warn: "Unknown clef specified: " + strOrig };

		strClef = strClef.substring(name.length);
		j = this.isMatch(strClef, '+8');
		if (j > 0)
			name += "+8";
		else {
			j = this.isMatch(strClef, '-8');
			if (j > 0)
				name += "-8";
		}
		return { len: i + name.length + j, token: name, explicit: needsClef };
	};

	// This returns one of the legal bar lines
	getBarLine = function (str: string) {
		if (str[0] !== ':' && str[0] !== '|' && str[0] !== '[')
			return { len: 0 };

		if (str.startsWith(":||:")) return { len: 4, token: "bar_dbl_repeat" };
		if (str.startsWith(":|]")) return { len: 3, token: "bar_right_repeat" };
		if (str.startsWith(":||")) return { len: 3, token: "bar_right_repeat" };
		if (str.startsWith(":|")) return { len: 2, token: "bar_right_repeat" };
		if (str.startsWith("::")) return { len: 2, token: "bar_dbl_repeat" };
		if (str.startsWith("[|:")) return { len: 3, token: "bar_left_repeat" };
		if (str.startsWith("[|]")) return { len: 3, token: "bar_invisible" };
		if (str.startsWith("[|")) return { len: 2, token: "bar_thick_thin" };
		if (str.startsWith("[")) {
			if ((str[1] >= '1' && str[1] <= '9') || str[1] === '"')
				return { len: 1, token: "bar_invisible" };
			return { len: 0 };
		}
		if (str.startsWith("||:")) return { len: 3, token: "bar_left_repeat" };
		if (str.startsWith("|:::::")) return { len: 6, token: "bar_left_repeat" };
		if (str.startsWith("|::::")) return { len: 5, token: "bar_left_repeat" };
		if (str.startsWith("|:::")) return { len: 4, token: "bar_left_repeat" };
		if (str.startsWith("|::")) return { len: 3, token: "bar_left_repeat" };
		if (str.startsWith("|:")) return { len: 2, token: "bar_left_repeat" };
		if (str.startsWith("||")) return { len: 2, token: "bar_thin_thin" };
		if (str.startsWith("|]")) return { len: 2, token: "bar_thin_thick" };
		//			if (str.startsWith("|[")) return { len: 2, token: "bar_thin_thick" };
		if (str.startsWith("|")) return { len: 1, token: "bar_thin" };
		return { len: 1, warn: "Unknown bar symbol" };
	};

	// this returns all the characters in the string that match one of the characters in the legalChars string
	getTokenOf = function (str: string, legalChars: string) {
		let i = 0;
		for (i = 0; i < str.length; i++) {
			if (legalChars.indexOf(str[i]) < 0)
				return { len: i, token: str.substring(0, i) };
		}
		return { len: i, token: str };
	};

	// This just sees if the next token is the word passed in, with possible leading spaces
	isMatch = function (str: string, match: string) {
		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i))
			return 0;
		if (str.substring(i).startsWith(match))
			return i + match.length;
		return 0;
	};

	// This gets an accidental marking for the key signature. It has the accidental then the pitch letter.
	getKeyAccidental = function (str: string): { len: number, token?: TokenInfo, warn?: string } {
		const accTranslation = {
			'^': 'sharp',
			'^^': 'dblsharp',
			'=': 'natural',
			'_': 'flat',
			'__': 'dblflat'
		};
		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i))
			return { len: 0 };
		let acc: string | null = null;
		switch (str[i]) {
			case '^':
			case '_':
			case '=':
				acc = str[i];
				break;
			default: return { len: 0 };
		}
		i++;
		if (this.finished(str, i))
			return { len: 1, warn: 'Expected note name after accidental' };
		switch (str[i]) {
			case 'a':
			case 'b':
			case 'c':
			case 'd':
			case 'e':
			case 'f':
			case 'g':
			case 'A':
			case 'B':
			case 'C':
			case 'D':
			case 'E':
			case 'F':
			case 'G':
				let token: TokenInfo;
				token = { acc: accTranslation[acc], note: str[i] }
				return { len: i + 1, token };
			case '^':
			case '_':
				acc += str[i];
				i++;
				if (this.finished(str, i))
					return { len: 2, warn: 'Expected note name after accidental' };
				switch (str[i]) {
					case 'a':
					case 'b':
					case 'c':
					case 'd':
					case 'e':
					case 'f':
					case 'g':
					case 'A':
					case 'B':
					case 'C':
					case 'D':
					case 'E':
					case 'F':
					case 'G':
						return { len: i + 1, token: { acc: accTranslation[acc], note: str[i] } };
					default:
						return { len: 2, warn: 'Expected note name after accidental' };
				}
				break;
			default:
				return { len: 1, warn: 'Expected note name after accidental' };
		}
	};

	isWhiteSpace = function (ch: string) {
		return ch === ' ' || ch === '\t' || ch === '\x12';
	};

	charMap = {
		"`a": 'à', "'a": "á", "^a": "â", "~a": "ã", "\"a": "ä", "oa": "å", "=a": "ā", "ua": "ă", ";a": "ą",
		"`e": 'è', "'e": "é", "^e": "ê", "\"e": "ë", "=e": "ē", "ue": "ĕ", ";e": "ę", ".e": "ė",
		"`i": 'ì', "'i": "í", "^i": "î", "\"i": "ï", "=i": "ī", "ui": "ĭ", ";i": "į",
		"`o": 'ò', "'o": "ó", "^o": "ô", "~o": "õ", "\"o": "ö", "=o": "ō", "uo": "ŏ", "/o": "ø",
		"`u": 'ù', "'u": "ú", "^u": "û", "~u": "ũ", "\"u": "ü", "ou": "ů", "=u": "ū", "uu": "ŭ", ";u": "ų",
		"`A": 'À', "'A": "Á", "^A": "Â", "~A": "Ã", "\"A": "Ä", "oA": "Å", "=A": "Ā", "uA": "Ă", ";A": "Ą",
		"`E": 'È', "'E": "É", "^E": "Ê", "\"E": "Ë", "=E": "Ē", "uE": "Ĕ", ";E": "Ę", ".E": "Ė",
		"`I": 'Ì', "'I": "Í", "^I": "Î", "~I": "Ĩ", "\"I": "Ï", "=I": "Ī", "uI": "Ĭ", ";I": "Į", ".I": "İ",
		"`O": 'Ò', "'O": "Ó", "^O": "Ô", "~O": "Õ", "\"O": "Ö", "=O": "Ō", "uO": "Ŏ", "/O": "Ø",
		"`U": 'Ù', "'U": "Ú", "^U": "Û", "~U": "Ũ", "\"U": "Ü", "oU": "Ů", "=U": "Ū", "uU": "Ŭ", ";U": "Ų",
		"ae": "æ", "AE": "Æ", "oe": "œ", "OE": "Œ", "ss": "ß",
		"'c": "ć", "^c": "ĉ", "uc": "č", "cc": "ç", ".c": "ċ", "cC": "Ç", "'C": "Ć", "^C": "Ĉ", "uC": "Č", ".C": "Ċ",
		"~n": "ñ"
		// More chars: Ñ Ĳ ĳ Ď ď Đ đ Ĝ ĝ Ğ ğ Ġ ġ Ģ ģ Ĥ ĥ Ħ ħ Ĵ ĵ Ķ ķ ĸ Ĺ ĺ Ļ ļ Ľ ľ Ŀ ŀ Ł ł Ń ń Ņ ņ Ň ň ŉ Ŋ ŋ   Ŕ ŕ Ŗ ŗ Ř ř Ś ś Ŝ ŝ Ş ş Š š Ţ ţ Ť ť Ŧ ŧ Ŵ ŵ Ŷ ŷ Ÿ ÿ Ÿ Ź ź Ż ż Ž ž
	};

	charMap2 = {
		"251": "©"
	};

	translateString = function (str: string) {
		let arr = str.split('\\');
		if (arr.length === 1) return str;
		let out: string | null = null;
		arr.forEach(s => {
			if (out === null)
				out = s;
			else if (s.length < 2)
				out += "\\" + s;
			else {
				let c = this.charMap[s.substring(0, 2)];
				if (c !== undefined)
					out += c + s.substring(2);
				else {
					c = this.charMap2[s.substring(0, 3)];
					if (c !== undefined)
						out += c + s.substring(3);
					else
						out += "\\" + s;
				}
			}
		});
		return out!;
	};
}

class MultilineVars implements MultilineVarsElement {
	iChar: number;
	key: { regularKey: KeySignature };
	meter: MeterElement;
	hasMainTitle: boolean;
	default_length: number;
	tempo: TempoInfo;
	clef: string;
	next_note_duration: number;
	start_new_line: boolean;
	is_in_header: boolean;
	partForNextLine: string;
	havent_set_length: boolean;
	warnings: any;
	reset() {
		this.iChar = 0
		this.key = { regularKey: { num: 0, acc: 'sharp' } }
		this.meter = { el_type: "meter", type: 'specified', num: 4, den: 4 }	// if no meter is specified, there is an implied one.
		this.hasMainTitle = false;
		this.default_length = 1;
		this.clef = 'treble';
		this.warnings = null;
		this.next_note_duration = 0;
		this.start_new_line = true;
		this.is_in_header = true;
		this.partForNextLine = "";
		this.havent_set_length = true;
		this.tempo = null;
	}
};

class ParseAbc {
	private tune: AbcTune;
	private tokenizer: AbcTokenizer;
	private nextNoteDuration: number = 0;
	private multilineVars: MultilineVars;
	private next_note_duration = 0;

	constructor() {
		this.tune = new AbcTune();
		this.tokenizer = new AbcTokenizer();
		this.multilineVars = new MultilineVars();
	}
	getTune(): AbcTune {
		return this.tune;
	}
	private formatWarning(str: string, line_num: number, col_num: number, line: string): string {
		let clean_line = line.substring(0, col_num).replace(/\x12/g, ' ') + '\n' + line[col_num] + '\n' + line.substring(col_num + 1).replace(/\x12/g, ' ');
		clean_line = clean_line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<span style="text-decoration:underline;font-size:1.3em;font-weight:bold;">').replace(/\n/g, '</span>');
		return `Music Line:${line_num}:${col_num + 1}: ${str}: ${clean_line}`;
	}
	private addWarning(str: string): void {
		if (!this.multilineVars.warnings) {
			this.multilineVars.warnings = [];
		}
		this.multilineVars.warnings.push(str);
	}
	getWarnings(): string[] {
		return this.multilineVars.warnings || [];
	}
	keys: { [key: string]: KeySignature } = {
		'C#': { num: 7, acc: 'sharps' },
		'A#m': { num: 7, acc: 'sharps' },
		'G#Mix': { num: 7, acc: 'sharps' },
		'D#Dor': { num: 7, acc: 'sharps' },
		'E#Phr': { num: 7, acc: 'sharps' },
		'F#Lyd': { num: 7, acc: 'sharps' },
		'B#Loc': { num: 7, acc: 'sharps' },

		'F#': { num: 6, acc: 'sharp' },
		'D#m': { num: 6, acc: 'sharp' },
		'C#Mix': { num: 6, acc: 'sharp' },
		'G#Dor': { num: 6, acc: 'sharp' },
		'A#Phr': { num: 6, acc: 'sharp' },
		'BLyd': { num: 6, acc: 'sharp' },
		'E#Loc': { num: 6, acc: 'sharp' },

		'B': { num: 5, acc: 'sharp' },
		'G#m': { num: 5, acc: 'sharp' },
		'F#Mix': { num: 5, acc: 'sharp' },
		'C#Dor': { num: 5, acc: 'sharp' },
		'D#Phr': { num: 5, acc: 'sharp' },
		'ELyd': { num: 5, acc: 'sharp' },
		'A#Loc': { num: 5, acc: 'sharp' },

		'E': { num: 4, acc: 'sharp' },
		'C#m': { num: 4, acc: 'sharp' },
		'BMix': { num: 4, acc: 'sharp' },
		'F#Dor': { num: 4, acc: 'sharp' },
		'G#Phr': { num: 4, acc: 'sharp' },
		'ALyd': { num: 4, acc: 'sharp' },
		'D#Loc': { num: 4, acc: 'sharp' },

		'A': { num: 3, acc: 'sharp' },
		'F#m': { num: 3, acc: 'sharp' },
		'EMix': { num: 3, acc: 'sharp' },
		'BDor': { num: 3, acc: 'sharp' },
		'C#Phr': { num: 3, acc: 'sharp' },
		'DLyd': { num: 3, acc: 'sharp' },
		'G#Loc': { num: 3, acc: 'sharp' },

		'D': { num: 2, acc: 'sharp' },
		'Bm': { num: 2, acc: 'sharp' },
		'AMix': { num: 2, acc: 'sharp' },
		'EDor': { num: 2, acc: 'sharp' },
		'F#Phr': { num: 2, acc: 'sharp' },
		'GLyd': { num: 2, acc: 'sharp' },
		'C#Loc': { num: 2, acc: 'sharp' },

		'G': { num: 1, acc: 'sharp' },
		'Em': { num: 1, acc: 'sharp' },
		'DMix': { num: 1, acc: 'sharp' },
		'ADor': { num: 1, acc: 'sharp' },
		'BPhr': { num: 1, acc: 'sharp' },
		'CLyd': { num: 1, acc: 'sharp' },
		'F#Loc': { num: 1, acc: 'sharp' },

		'C': { num: 0, acc: 'sharp' },
		'Am': { num: 0, acc: 'sharp' },
		'GMix': { num: 0, acc: 'sharp' },
		'DDor': { num: 0, acc: 'sharp' },
		'EPhr': { num: 0, acc: 'sharp' },
		'FLyd': { num: 0, acc: 'sharp' },
		'BLoc': { num: 0, acc: 'sharp' },

		'F': { num: 1, acc: 'flat' },
		'Dm': { num: 1, acc: 'flat' },
		'CMix': { num: 1, acc: 'flat' },
		'GDor': { num: 1, acc: 'flat' },
		'APhr': { num: 1, acc: 'flat' },
		'BbLyd': { num: 1, acc: 'flat' },
		'ELoc': { num: 1, acc: 'flat' },

		'Bb': { num: 2, acc: 'flat' },
		'Gm': { num: 2, acc: 'flat' },
		'FMix': { num: 2, acc: 'flat' },
		'CDor': { num: 2, acc: 'flat' },
		'DPhr': { num: 2, acc: 'flat' },
		'EbLyd': { num: 2, acc: 'flat' },
		'ALoc': { num: 2, acc: 'flat' },

		'Eb': { num: 3, acc: 'flat' },
		'Cm': { num: 3, acc: 'flat' },
		'BbMix': { num: 3, acc: 'flat' },
		'FDor': { num: 3, acc: 'flat' },
		'GPhr': { num: 3, acc: 'flat' },
		'AbLyd': { num: 3, acc: 'flat' },
		'DLoc': { num: 3, acc: 'flat' },

		'Ab': { num: 4, acc: 'flat' },
		'Fm': { num: 4, acc: 'flat' },
		'EbMix': { num: 4, acc: 'flat' },
		'BbDor': { num: 4, acc: 'flat' },
		'CPhr': { num: 4, acc: 'flat' },
		'DbLyd': { num: 4, acc: 'flat' },
		'GLoc': { num: 4, acc: 'flat' },

		'Db': { num: 5, acc: 'flat' },
		'Bbm': { num: 5, acc: 'flat' },
		'AbMix': { num: 5, acc: 'flat' },
		'EbDor': { num: 5, acc: 'flat' },
		'FPhr': { num: 5, acc: 'flat' },
		'GgLyd': { num: 5, acc: 'flat' },
		'CLoc': { num: 5, acc: 'flat' },

		'Gb': { num: 6, acc: 'flat' },
		'Ebm': { num: 6, acc: 'flat' },
		'DbMix': { num: 6, acc: 'flat' },
		'AbDor': { num: 6, acc: 'flat' },
		'BbPhr': { num: 6, acc: 'flat' },
		'CbLyd': { num: 6, acc: 'flat' },
		'FLoc': { num: 6, acc: 'flat' },

		'Cb': { num: 7, acc: 'flat' },
		'Abm': { num: 7, acc: 'flat' },
		'GbMix': { num: 7, acc: 'flat' },
		'DbDor': { num: 7, acc: 'flat' },
		'EbPhr': { num: 7, acc: 'flat' },
		'FbLyd': { num: 7, acc: 'flat' },
		'BbLoc': { num: 7, acc: 'flat' },

		// The following are not in the 2.0 spec, but seem normal enough.
		// TODO-PER: These SOUND the same as what's written, but they aren't right
		'A#': { num: 2, acc: 'flat' },
		'B#': { num: 0, acc: 'sharp' },
		'D#': { num: 3, acc: 'flat' },
		'E#': { num: 1, acc: 'flat' },
		'G#': { num: 4, acc: 'flat' }
	};

	private parseKey(str: string): { foundClef?: boolean, foundKey?: boolean } {// KeySignature {
		let origStr = str;
		// The format is:
		// [space][tonic[#|b][ ][3-letter-mode][ignored-chars][space]][ accidentals...][ clef=treble|bass|bass3|tenor|alto|alto2|alto1|none [+8|-8]]
		// -- or -- the key can be "none"
		// First get the key letter: turn that into a index into the key array (0-11)
		// Then see if there is a sharp or flat. Increment or decrement.
		// Then see if there is a mode modifier. Add or subtract to the index.
		// Then do a mod 12 on the index and return the key.
		// TODO: This may leave unparsed characters at the end after something reasonable was found.

		// check first to see if there is only a clef. If so, just take that, but ignore an error after that.
		let retClef = this.tokenizer.getClef(str);
		if (retClef.token !== undefined && (retClef.explicit === true || retClef.token !== 'none')) {
			this.multilineVars.clef = retClef.token;
			return { foundClef: true };
		}

		let ret: {
			regularKey?: KeySignature,
			extraAccidentals?: TokenInfo[]
		} = {};
		let retPitch = this.tokenizer.getKeyPitch(str);
		if (retPitch.len > 0) {
			let key = retPitch.token;
			str = str.substring(retPitch.len);
			// We got a pitch to start with, so we might also have an accidental and a mode
			let retAcc = this.tokenizer.getSharpFlat(str);
			if (retAcc.len > 0) {
				key += retAcc.token;
				str = str.substring(retAcc.len);
			}
			let retMode = this.tokenizer.getMode(str);
			if (retMode.len > 0) {
				key += retMode.token;
				str = str.substring(retMode.len);
			}
			ret.regularKey = this.keys[key];
		} else {
			let retNone = this.tokenizer.isMatch(str, 'none');
			if (retNone > 0) {
				// we got the none key - that's the same as C to us
				ret.regularKey = this.keys.C;
				str = str.substring(retNone);
			}
		}
		// now see if there are extra accidentals
		let done = false;
		while (!done) {
			let retExtra = this.tokenizer.getKeyAccidental(str);
			if (retExtra.len === 0) {
				done = true;
			} else {
				str = str.substring(retExtra.len);
				if (retExtra.warn) {
					this.addWarning(`error parsing extra accidentals:${origStr}`);
				} else {
					if (!ret.extraAccidentals)
						ret.extraAccidentals = [];
					if (retExtra.token)
						ret.extraAccidentals.push(retExtra.token);
				}
			}
		}

		// now see if there is a clef
		retClef = this.tokenizer.getClef(str);
		if (retClef.len > 0) {
			if (retClef.warn) {
				this.addWarning(`error parsing clef:${retClef.warn}`);
			} else {
				//ret.clef = retClef.token;
				this.multilineVars.clef = retClef.token;
			}
		}

		if (ret.regularKey === undefined && ret.extraAccidentals === undefined && retClef.token === undefined) {
			this.addWarning(`error parsing key: ${origStr}`);
			//ret.regularKey = keys.C;
			return {};
		}

		let result: { foundClef?: boolean, foundKey?: boolean } = {};
		if (retClef.token !== undefined) {
			result.foundClef = true;
		}
		if (ret.regularKey !== undefined || ret.extraAccidentals !== undefined) {
			this.multilineVars.key = ret;
			result.foundKey = true;
		}
		return result;
	}
	private substInChord(str: string): string {
		while (str.indexOf("\\n") !== -1) {
			str = str.replace("\\n", "\n");
		}
		return str;
	}


	private getBrackettedSubstring(line: string, i: number, maxErrorChars: number, _matchChar: any = null): [number, string] {

		// This extracts the sub string by looking at the first character and searching for that
		// character later in the line (or search for the optional _matchChar).
		// For instance, if the first character is a quote it will look for
		// the end quote. If the end of the line is reached, then only up to the default number
		// of characters are returned, so that a missing end quote won't eat up the entire line.
		// It returns the substring and the number of characters consumed.
		// The number of characters consumed is normally two more than the size of the substring,
		// but in the error case it might not be.
		let matchChar = _matchChar || line[i];
		let pos = i + 1;
		while (pos < line.length && line[pos] !== matchChar) {
			++pos;
		}
		if (line[pos] === matchChar) {
			return [pos - i + 1, this.substInChord(line.substring(i + 1, pos))];
		} else {	// we hit the end of line, so we'll just pick an arbitrary num of chars so the line doesn't disappear.
			pos = i + maxErrorChars;
			if (pos > line.length - 1) {
				pos = line.length - 1;
			}
			return [pos - i + 1, this.substInChord(line.substring(i + 1, pos))];
		}
	}

	private letter_to_chord(line: string, i: number): [number, string, string?] {
		if (line[i] === '"') {
			var chord = this.getBrackettedSubstring(line, i, 5);
			// If it starts with ^, then the chord appears above.
			// If it starts with _ then the chord appears below.
			// (note that the 2.0 draft standard defines them as not chords, but annotations and also defines < > and @.)
			if (chord[0] > 0 && chord[1].length > 0 && chord[1][0] === '^') {
				chord[1] = chord[1].substring(1);
				chord.push('above');
			} else if (chord[0] > 0 && chord[1].length > 0 && chord[1][0] === '_') {
				chord[1] = chord[1].substring(1);
				chord.push('below');
			} else
				chord.push('default');
			return chord;
		}
		return [0, ""];
	}

	private letter_to_accent(line: string, i: number): [number, string] {
		switch (line[i]) {
			case '.': return [1, 'staccato'];
			case 'u': return [1, 'upbow'];
			case 'v': return [1, 'downbow'];
			case '~': return [1, 'roll'];
			case '!':
			case '+':
				let ret = this.getBrackettedSubstring(line, i, 5);
				// Be sure that the accent is recognizable.
				let legalAccents = ["trill", "lowermordent", "uppermordent", "mordent", "pralltriller", "accent",
					"emphasis", "fermata", "invertedfermata", "tenuto", "0", "1", "2", "3", "4", "5", "+", "wedge",
					"open", "thumb", "snap", "turn", "roll", "breath", "shortphrase", "mediumphrase", "longphrase",
					"segno", "coda", "D.S.", "D.C.", "fine", "crescendo(", "crescendo)", "diminuendo(", "diminuendo)",
					"p", "pp", "f", "ff", "mf", "ppp", "pppp", "fff", "ffff", "sfz", "repeatbar", "repeatbar2",
					"upbow", "downbow"];
				if (ret[1].length > 0 && (ret[1][0] === '^' || ret[1][0] === '_'))
					ret[1] = ret[1].substring(1);	// TODO-PER: The test files have indicators forcing the orniment to the top or bottom, but that isn't in the standard. We'll just ignore them.

				if (legalAccents.includes(ret[1])) {
					return ret;
				}
				// We didn't find the accent in the list, so consume the space, but don't return an accent.
				// Although it is possible that ! was used as a line break, so accept that.
				if (line[i] === '!' && (ret[0] === 1 || line[i + ret[0] - 1] !== '!')) {
					return [1, null];
				}
				this.addWarning(this.formatWarning("Unknown decoration: " + ret[1], this.tune.lines.length, i, line));
				ret[1] = "";
				return ret;
			case 'H': return [1, 'fermata'];
			case 'M': return [1, 'mordent'];
		}
		return [0, "0"];
	}

	private letter_to_spacer(line: string, i: number): number[] {
		let start = i;
		while (this.tokenizer.isWhiteSpace(line[i])) {
			i++;
		}
		return [i - start];
	}

	private letter_to_inline_header(line: string, i: number): [number, string?, string?] {
		let ws = this.tokenizer.eatWhiteSpace(line, i);
		i += ws;
		if (line.length >= i + 5) {
			let e = line.indexOf(']', i);
			switch (line.substring(i, i + 3)) {
				case "[I:":
					let err = this.addDirective(line.substring(i + 3, e));
					if (err) {
						this.addWarning(this.formatWarning(err, this.tune.lines.length, i, line));
					}
					return [e - i + 1 + ws];
				case "[M:":
					this.setMeter(line.substring(i + 3, e));
					this.tune.appendElement('meter', -1, -1, this.multilineVars.meter);
					return [e - i + 1 + ws];
				case "[K:":
					let result = this.parseKey(line.substring(i + 3, e));
					if (result.foundClef) {
						this.tune.appendElement('clef', -1, -1, { type: this.multilineVars.clef });
					}
					if (result.foundKey) {
						this.tune.appendElement('key', -1, -1, this.multilineVars.key);
					}
					return [e - i + 1 + ws];
				case "[P:":
					this.tune.appendElement('part', -1, -1, { title: line.substring(i + 3, e) });
					return [e - i + 1 + ws];
				case "[L:":
				case "[Q:":
				case "[V:":
					if (e > 0)
						return [e - i + 1 + ws, line[i + 1], line.substring(i + 3, e)];
					break;
				default:
				// TODO: complain about unhandled header
			}
		}
		return [0];
	}

	private letter_to_body_header(line: string, i: number): [number, string?, string?] {
		if (line.length >= i + 3) {
			switch (line.substring(i, i + 2)) {
				case "I:":
					let err = this.addDirective(line.substring(i + 2));
					if (err) {
						this.addWarning(this.formatWarning(err, this.tune.lines.length, i, line));
					}
					return [line.length];
				case "M:":
					this.setMeter(line.substring(i + 2));
					this.tune.appendElement('meter', -1, -1, this.multilineVars.meter);
					return [line.length];
				case "K:":
					let result = this.parseKey(line.substring(i + 2));
					if (result.foundClef) {
						this.tune.appendElement('clef', -1, -1, { type: this.multilineVars.clef });
					}
					if (result.foundKey) {
						this.tune.appendElement('key', -1, -1, this.multilineVars.key);
					}
					return [line.length];
				case "P:":
					this.tune.appendElement('part', -1, -1, { title: line.substring(i + 2) });
					return [line.length];
				case "L:":
				case "Q:":
				case "V:":
					return [line.length, line[i], line.substring(2).trim()];
				default:
				// TODO: complain about unhandled header
			}
		}
		return [0];
	}

	// returns the class of the bar line
	// the number of the repeat
	// and the number of characters used up
	// if 0 is returned, then the next element was not a bar line
	private letter_to_bar(line: string, curr_pos: number): [number, string, string?] {
		let ret = this.tokenizer.getBarLine(line.substring(curr_pos));
		if (ret.len === 0) {
			return [0, ""];
		}
		if (ret.warn) {
			this.addWarning(this.formatWarning(ret.warn, this.tune.lines.length, curr_pos, line));
			return [ret.len, ""];
		}

		// Now see if this is a repeated ending
		// A repeated ending is all of the characters 1,2,3,4,5,6,7,8,9,0,-, and comma
		// It can also optionally start with '[', which is ignored.
		// Also, it can have white space before the '['.
		let orig_bar_len = ret.len;
		let ws;
		for (ws = 0; ws < line.length; ws++) {
			if (line[curr_pos + ret.len + ws] !== ' ') {
				break;
			}
		}
		if (line[curr_pos + ret.len + ws] === '[') {
			ret.len += ws + 1;
			// It can also be a quoted string. It is unclear whether that construct requires '[', but it seems like it would. otherwise it would be confused with a regular chord.
			if (line[curr_pos + ret.len] === '"') {
				let ending = this.getBrackettedSubstring(line, curr_pos + ret.len, 5);
				return [ret.len + ending[0], ret.token, ending[1]];
			}
		}
		let retRep = this.tokenizer.getTokenOf(line.substring(curr_pos + ret.len), "1234567890-,");
		if (retRep.len === 0) {
			return [orig_bar_len, ret.token];
		}

		return [ret.len + retRep.len, ret.token, retRep.token];
	}


	private letter_to_open_slurs_and_triplets(line: string, i: number): { consumed: number, startSlur?: number, triplet?: number, num_notes?: number } {
		// consume spaces, and look for all the open parens. If there is a number after the open paren,
		// that is a triplet. Otherwise that is a slur. Collect all the slurs and the first triplet.
		let ret: any = {};
		let start = i;
		while (line[i] === '(' || this.tokenizer.isWhiteSpace(line[i])) {
			if (line[i] === '(') {
				if (i + 1 < line.length && (line[i + 1] >= '2' && line[i + 1] <= '9')) {
					if (ret.triplet !== undefined) {
						this.addWarning(this.formatWarning("Can't nest triplets", this.tune.lines.length, i, line));
					} else {
						ret.triplet = line[i + 1].charCodeAt(0) - '0'.charCodeAt(0);
						if (i + 2 < line.length && line[i + 2] === ':') {
							// We are expecting two colons and a number, which is the duration multiplier.
							if (i + 3 < line.length && line[i + 3] === ':') {
								if (i + 4 < line.length && (line[i + 4] >= '1' && line[i + 4] <= '9')) {
									ret.num_notes = line[i + 4].charCodeAt(0) - '0'.charCodeAt(0);
									i += 3;
								} else
									this.addWarning(this.formatWarning("expected number after the two colons after the triplet to mark the duration", this.tune.lines.length, i, line));
							} else
								this.addWarning(this.formatWarning("expected two colons after the triplet to mark the duration", this.tune.lines.length, i, line));
						}
					}
					i++;
				}
				else {
					if (ret.startSlur === undefined) {
						ret.startSlur = 1;
					} else {
						ret.startSlur++;
					}
				}
			}
			i++;
		}
		ret.consumed = i - start;
		return ret;
	}


	private letter_to_grace(line: string, i: number): [number, { el_type: string, pitch: number }[]?] {
		if (line[i] === '{') {
			// fetch the gracenotes string and consume that into the array
			let gra = this.getBrackettedSubstring(line, i, 1, '}'); // what happens on line ends?
			// TODO: alert errors when non-matching close
			let gracenotes = [];
			let ii = 0;
			for (let ret = this.letter_to_pitch(gra[1], ii); ret[0] > 0 && ii < gra[1].length;
				ret = this.letter_to_pitch(gra[1], ii)) {
				//todo get other stuff that could be in a grace note
				ii += ret[0];
				gracenotes.push({ el_type: "gracenote", pitch: ret[1] });
			}
			return [gra[0], gracenotes];
		} else {
			return [0];
		}
	}



	// returns the pitch (null for a rest) and the number of chars used up
	// TODO-PER: replacing this
	private letter_to_pitch(line: string, curr_pos: number): PitchInfo {
		let ret: PitchInfo = [0, -1];
		switch (line[curr_pos]) {
			case 'A': ret = [1, 5]; break;
			case 'B': ret = [1, 6]; break;
			case 'C': ret = [1, 0]; break;
			case 'D': ret = [1, 1]; break;
			case 'E': ret = [1, 2]; break;
			case 'F': ret = [1, 3]; break;
			case 'G': ret = [1, 4]; break;
			case 'a': ret = [1, 12]; break;
			case 'b': ret = [1, 13]; break;
			case 'c': ret = [1, 7]; break;
			case 'd': ret = [1, 8]; break;
			case 'e': ret = [1, 9]; break;
			case 'f': ret = [1, 10]; break;
			case 'g': ret = [1, 11]; break;
			case 'x': ret = [1, null, 'invisible']; break; // takes up physical space
			case 'y': ret = [1, null, 'spacer']; break; // takes up physical space, not part of timing integrity
			case 'z': ret = [1, null, 'rest']; break;
		}
		if (ret[0] !== 0 && curr_pos < line.length - 1) {
			if (line[curr_pos + 1] === ',') {
				ret[0]++;
				ret[1] -= 7;
				if ((curr_pos + 1 < line.length - 1) && line[curr_pos + 2] === ',')	// see if there is a double comma
				{
					ret[0]++;
					ret[1] -= 7;
				}
			}
			else if (line[curr_pos + 1] === "'") {
				ret[0]++;
				ret[1] += 7;
				if ((curr_pos + 1 < line.length - 1) && line[curr_pos + 2] === '\'')	// see if there is a double prime
				{
					ret[0]++;
					ret[1] += 7;
				}
			}
		}
		return ret;
	}

	private stripComment(str: string): string {
		let i = str.indexOf('%');
		if (i >= 0) {
			return str.substring(0, i).trim();
		}
		return str.trim();
	}

	private getInt(str: string): { value?: number, digits: number } {
		// This parses the beginning of the string for a number and returns { value: num, digits: num }
		// If digits is 0, then the string didn't point to a number.
		let x = parseInt(str);
		if (isNaN(x)) {
			return { digits: 0 };
		}
		let s = "" + x;
		let i = str.indexOf(s);	// This is to account for leading spaces
		return { value: x, digits: i + s.length };
	}

	private getFloat(str: string): { value?: number, digits: number } {
		// This parses the beginning of the string for a number and returns { value: num, digits: num }
		// If digits is 0, then the string didn't point to a number.
		let x = parseFloat(str);
		if (isNaN(x)) {
			return { digits: 0 };
		}
		let s = "" + x;
		let i = str.indexOf(s);	// This is to account for leading spaces
		return { value: x, digits: i + s.length };
	}

	private addMetaText(key: string, value: string): void {
		if (this.tune.metaText[key] === undefined) {
			this.tune.metaText[key] = this.tokenizer.translateString(this.stripComment(value));
		} else {
			this.tune.metaText[key] += "\n" + this.tokenizer.translateString(this.stripComment(value));
		}
	}

	private addDirective(str: string): string | null {
		let s = this.stripComment(str).trim();
		if (s.length === 0) {	// 3 or more % in a row, or just spaces after %% is just a comment
			return null;
		}
		let i = s.indexOf(' ');
		let cmd = (i > 0) ? s.substring(0, i) : s;
		let num;
		switch (cmd.toLowerCase()) {
			case "stretchlast": this.tune.formatting.stretchlast = true; break;
			case "staffwidth":
				num = this.getInt(s.substring(i));
				if (num.digits === 0) {
					return `Directive "${cmd}" requires a number as a parameter.`;
				}
				this.tune.formatting.staffwidth = num.value;
				break;
			case "scale":
				num = this.getFloat(s.substring(i));
				if (num.digits === 0) {
					return `Directive "${cmd}" requires a number as a parameter.`;
				}
				this.tune.formatting.scale = num.value;
				break;
			case "sep":
				// TODO-PER: This actually goes into the stream, it is not global
				this.tune.formatting.sep = s.substring(i);
				break;
			case "score":
			case "indent":
			case "voicefont":
			case "titlefont":
			case "barlabelfont":
			case "barnumfont":
			case "barnumberfont":
			case "barnumbers":
			case "topmargin":
			case "botmargin":
			case "topspace":
			case "titlespace":
			case "subtitlespace":
			case "composerspace":
			case "musicspace":
			case "partsspace":
			case "wordsspace":
			case "textspace":
			case "vocalspace":
			case "staffsep":
			case "linesep":
			case "midi":
			case "titlecaps":
			case "composerfont":
			case "playtempo":
			case "auquality":
			case "text":
			case "begintext":
			case "endtext":
			case "vocalfont":
			case "systemsep":
			case "sysstaffsep":
			case "landscape":
			case "gchordfont":
			case "leftmargin":
			case "partsfont":
			case "staves":
			case "slurgraces":
			case "titleleft":
			case "subtitlefont":
			case "tempofont":
			case "continuous":
			case "botspace":
			case "nobarcheck":
				// TODO-PER: Actually handle the parameters of these
				this.tune.formatting[cmd] = s.substring(i);
				break;
			default:
				return `Unknown directive: ${cmd} `;
				break;
		}
		return null;
	}

	private theReverser(str: string): string {
		if (str.endsWith(", The")) {
			return "The " + str.substring(0, str.length - 5);
		}
		if (str.endsWith(", A")) {
			return "A " + str.substring(0, str.length - 3);
		}
		return str;
	}

	private setTitle(title: string): void {
		if (this.multilineVars.hasMainTitle) {
			this.tune.lines[this.tune.lines.length] = { subtitle: this.tokenizer.translateString(this.stripComment(title)) };
		} else {
			this.addMetaText("title", this.theReverser(this.stripComment(title)));
			this.multilineVars.hasMainTitle = true;
		}
	}

	private setMeter(meter: string): void {
		meter = this.stripComment(meter);
		if (meter === 'C') {
			this.multilineVars.meter = { el_type: 'meter', type: 'common_time' };
			this.multilineVars.havent_set_length = false;
		} else if (meter === 'C|') {
			this.multilineVars.meter = { el_type: 'meter', type: 'cut_time' };
			this.multilineVars.havent_set_length = false;
		} else if (meter.length === 0 || meter.toLowerCase() === 'none') {
			this.multilineVars.meter = null;
		} else {
			let a = meter.split('/');
			if (a.length === 2) {
				this.multilineVars.meter = { el_type: 'meter', type: 'specified', num: this.getInt(a[0].trim()).value, den: this.getInt(a[1].trim()).value };
				if (this.multilineVars.havent_set_length === true) {
					this.multilineVars.default_length = this.multilineVars.meter.num / this.multilineVars.meter.den < 0.75 ? 0.5 : 1;
					this.multilineVars.havent_set_length = false;
				}
			}
		}
	}

	private addWords(line: any, words: string): void {
		words = words.trim();
		if (words[words.length - 1] !== '-')
			words += ' ';	// Just makes it easier to parse below, since every word has a divider after it.
		let word_list = [];
		// first make a list of words from the string we are passed. A word is divided on either a space or dash.
		let last_divider = -1;
		for (let i = 0; i < words.length; i++) {
			if ((words[i] === ' ') || (words[i] === '-')) {
				word_list.push({ syllable: this.tokenizer.translateString(words.substring(last_divider + 1, i)), divider: words[i] });
				last_divider = i;
			}
		}

		line.each(function (el) {
			if (el.el_type === 'note' && word_list.length > 0) {
				el.lyric = word_list.shift();
			}
		});
	};


	private getNumber(line: string, index: number): { num: number, index: number } {
		let num = 0;
		while (index < line.length) {
			switch (line[index]) {
				case '0': num = num * 10; index++; break;
				case '1': num = num * 10 + 1; index++; break;
				case '2': num = num * 10 + 2; index++; break;
				case '3': num = num * 10 + 3; index++; break;
				case '4': num = num * 10 + 4; index++; break;
				case '5': num = num * 10 + 5; index++; break;
				case '6': num = num * 10 + 6; index++; break;
				case '7': num = num * 10 + 7; index++; break;
				case '8': num = num * 10 + 8; index++; break;
				case '9': num = num * 10 + 9; index++; break;
				default:
					return { num: num, index: index };
			}
		}
		return { num: num, index: index };
	}

	private getFraction(line: string, index: number): { value: number, index: number } {
		let num = 1;
		let den = 1;
		if (line[index] !== '/') {
			let ret = this.getNumber(line, index);
			num = ret.num;
			index = ret.index;
		}
		if (line[index] === '/') {
			index++;
			if (line[index] === '/') {
				let div = 0.5;
				while (line[index++] === '/')
					div = div / 2;
				return { value: num * div, index: index - 1 };
			} else {
				let iSave = index;
				let ret2 = this.getNumber(line, index);
				if (ret2.num === 0 && iSave === index)	// If we didn't use any characters, it is an implied 2
					ret2.num = 2;
				if (ret2.num !== 0)
					den = ret2.num;
				index = ret2.index;
			}
		}

		return { value: num / den, index: index };
	}

	private getBrokenRhythm(line: string, index: number): [number, number, number] | null {
		switch (line[index]) {
			case '>':
				if (index < line.length - 1 && line[index + 1] === '>')	// double >>
					return [2, 1.75, 0.25];
				else
					return [1, 1.5, 0.5];
				break;
			case '<':
				if (index < line.length - 1 && line[index + 1] === '<')	// double <<
					return [2, 0.25, 1.75];
				else
					return [1, 0.5, 1.5];
				break;
		}
		return null;
	}

	// TODO-PER: make this a method in el.
	private addEndBeam(el: any): any {
		if (el.pitch !== null && el.duration < 2) {
			el.end_beam = true;
		}
		if (el.pitches !== undefined && el.pitches[0].duration < 2) {
			el.end_beam = true;
		}
		return el;
	}



	// 定义音符的音高
	pitches: { [key: string]: number } = {
		A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11
	};

	// 定义休止符的类型
	rests: { [key: string]: string } = {
		x: 'invisible', y: 'spacer', z: 'rest'
	};

	// 定义解析音符的核心函数
	getCoreNote(line: string, index: number, el: any, canHaveBrokenRhythm: boolean): any {
		//var el = { startChar: index };
		let isComplete = (state: string): boolean => {
			return (state === 'octave' || state === 'duration' || state === 'broken_rhythm' || state === 'end_slur');
		};

		let state: string = 'startSlur';
		let durationSetByPreviousNote: boolean = false;

		while (true) {
			switch (line[index]) {
				case '(':
					if (state === 'startSlur') {
						if (el.startSlur === undefined) el.startSlur = 1; else el.startSlur++;
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case ')':
					if (isComplete(state)) {
						if (el.endSlur === undefined) el.endSlur = 1; else el.endSlur++;
					} else return null;
					break;
				case '^':
					if (state === 'startSlur') {
						el.accidental = 'sharp';
						state = 'sharp2';
					} else if (state === 'sharp2') {
						el.accidental = 'dblsharp';
						state = 'pitch';
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case '_':
					if (state === 'startSlur') {
						el.accidental = 'flat';
						state = 'flat2';
					} else if (state === 'flat2') {
						el.accidental = 'dblflat';
						state = 'pitch';
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case '=':
					if (state === 'startSlur') {
						el.accidental = 'natural';
						state = 'pitch';
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case 'A':
				case 'B':
				case 'C':
				case 'D':
				case 'E':
				case 'F':
				case 'G':
				case 'a':
				case 'b':
				case 'c':
				case 'd':
				case 'e':
				case 'f':
				case 'g':
					if (state === 'startSlur' || state === 'sharp2' || state === 'flat2' || state === 'pitch') {
						el.pitch = this.pitches[line[index]];
						state = 'octave';
						// At this point we have a valid note. The rest is optional. Set the duration in case we don't get one below
						// 设置默认时值
						if (this.multilineVars.next_note_duration !== 0) {
							el.duration = this.multilineVars.next_note_duration;
							this.multilineVars.next_note_duration = 0;
							durationSetByPreviousNote = true;
						} else {
							el.duration = this.multilineVars.default_length;
						}
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case ',':
					if (state === 'octave') {
						el.pitch -= 7;
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case '\'':
					if (state === 'octave') {
						el.pitch += 7;
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case 'x':
				case 'y':
				case 'z':
					if (state === 'startSlur') {
						el.pitch = null;
						el.rest_type = this.rests[line[index]];
						// At this point we have a valid note. The rest is optional. Set the duration in case we don't get one below
						if (this.multilineVars.next_note_duration !== 0) {
							el.duration = this.multilineVars.next_note_duration;
							this.multilineVars.next_note_duration = 0;
							durationSetByPreviousNote = true;
						} else {
							el.duration = this.multilineVars.default_length;
						}
						state = 'duration';
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case '1':
				case '2':
				case '3':
				case '4':
				case '5':
				case '6':
				case '7':
				case '8':
				case '9':
				case '0':
				case '/':
					if (state === 'octave' || state === 'duration') {
						const fraction = this.getFraction(line, index);
						if (!durationSetByPreviousNote) {
							el.duration = el.duration * fraction.value;
						}
						// TODO-PER: We can test the returned duration here and give a warning if it isn't the one expected.
						el.endChar = fraction.index;

						while (fraction.index < line.length && (this.tokenizer.isWhiteSpace(line[fraction.index]) || line[fraction.index] === '-')) {
							if (line[fraction.index] === '-') {
								el.startTie = true;
							} else {
								el = this.addEndBeam(el);
							}
							fraction.index++;
						}
						index = fraction.index - 1;
						state = 'broken_rhythm';
					} else {
						return null;
					}
					break;
				case '-':
					if (state === 'octave' || state === 'duration' || state === 'end_slur') {
						el.startTie = true;
						if (!durationSetByPreviousNote && canHaveBrokenRhythm) {
							state = 'broken_rhythm';
						} else {
							// Peek ahead to the next character. If it is a space, then we have an end beam.
							if (this.tokenizer.isWhiteSpace(line[index + 1])) {
								this.addEndBeam(el);
							}
							el.endChar = index + 1;
							return el;
						}
					} else if (state === 'broken_rhythm') {
						el.endChar = index;
						return el;
					} else {
						return null;
					}
					break;
				case ' ':
				case '\t':
					if (isComplete(state)) {
						el = this.addEndBeam(el);
						el.endChar = index;
						// look ahead to see if there is a tie
						do {
							if (line[index] === '-') {
								el.startTie = true;
							}
							index++;
						} while (index < line.length && (this.tokenizer.isWhiteSpace(line[index]) || line[index] === '-'));

						if (!durationSetByPreviousNote && canHaveBrokenRhythm && (line[index] === '<' || line[index] === '>')) {
							index--;
							state = 'broken_rhythm';
						} else {
							return el;
						}
					} else {
						return null;
					}
					break;
				case '>':
				case '<':
					if (isComplete(state)) {
						if (canHaveBrokenRhythm) {
							const br2 = this.getBrokenRhythm(line, index);
							index += br2[0] - 1;	// index gets incremented below, so we'll let that happen
							this.multilineVars.next_note_duration = br2[2] * el.duration;
							el.duration = br2[1] * el.duration;
							state = 'end_slur';
						} else {
							el.endChar = index;
							return el;
						}
					} else {
						return null;
					}
					break;
				default:
					if (isComplete(state)) {
						el.endChar = index;
						return el;
					}
					return null;
			}
			index++;
			if (index === line.length) {
				if (isComplete(state)) {
					el.endChar = index;
					return el;
				} else {
					return null;
				}
			}
		}
		return null;
	}

	// 定义新行开始的函数
	startNewLine() {
		this.tune.lines.push({ staff: [] });
		if (this.multilineVars.partForNextLine.length) {
			this.tune.appendElement('part', -1, -1, { title: this.multilineVars.partForNextLine });
			this.multilineVars.partForNextLine = "";
		}
		this.tune.appendElement('clef', -1, -1, { type: this.multilineVars.clef });
		this.tune.appendElement('key', -1, -1, this.multilineVars.key);
	}

	//
	// Parse line of music
	//
	// This is a stream of <(bar-marking|header|note-group)...> in any order, with optional spaces between each element
	// core-note is <open-slur, accidental, pitch:required, octave, duration, close-slur&|tie> with no spaces within that
	// chord is <open-bracket:required, core-note:required... close-bracket:required duration> with no spaces within that
	// grace-notes is <open-brace:required, (open-slur|core-note:required|close-slur)..., close-brace:required> spaces are allowed
	// note-group is <grace-notes, chord symbols&|decorations..., grace-notes, slur&|triplet, chord|core-note, end-slur|tie> spaces are allowed between items
	// bar-marking is <ampersand> or <chord symbols&|decorations..., bar:required> spaces allowed
	// header is <open-bracket:required, K|M|L|V:required, colon:required, field:required, close-bracket:required> spaces can occur between the colon, in the field, and before the close bracket
	// header can also be the only thing on a line. This is true even if it is a continuation line. In this case the brackets are not required.
	// a space is a back-tick, a space, or a tab. If it is a back-tick, then there is no end-beam.

	// Line preprocessing: anything after a % is ignored (the double %% should have been taken care of before this)
	// Then, all leading and trailing spaces are ignored.
	// If there was a line continuation, the \n was replaced by a \r and the \ was replaced by a space. This allows the construct
	// of having a header mid-line conceptually, but actually be at the start of the line. This is equivolent to putting the header in [ ].

	// TODO-PER: How to handle ! for line break?
	// TODO-PER: dots before bar, dots before slur
	// TODO-PER: U: redefinable symbols.

	// Ambiguous symbols:
	// "[" can be the start of a chord, the start of a header element or part of a bar line.
	// --- if it is immediately followed by "|", it is a bar line
	// --- if it is immediately followed by K: L: M: V: it is a header (note: there are other headers mentioned in the standard, but I'm not sure how they would be used.)
	// --- otherwise it is the beginning of a chord
	// "(" can be the start of a slur or a triplet
	// --- if it is followed by a number from 2-9, then it is a triplet
	// --- otherwise it is a slur
	// "]"
	// --- if there is a chord open, then this is the close
	// --- if it is after a [|, then it is an invisible bar line
	// --- otherwise, it is par of a bar
	// "." can be a bar modifier or a slur modifier, or a decoration
	// --- if it comes immediately before a bar, it is a bar modifier
	// --- if it comes immediately before a slur, it is a slur modifier
	// --- otherwise it is a decoration for the next note.
	// number:
	// --- if it is after a bar, with no space, it is an ending marker
	// --- if it is after a ( with no space, it is a triplet count
	// --- if it is after a pitch or octave or slash, then it is a duration

	// Unambiguous symbols (except inside quoted strings):
	// vertical-bar, colon: part of a bar
	// ABCDEFGabcdefg: pitch
	// xyzZ: rest
	// comma, prime: octave
	// close-paren: end-slur
	// hyphen: tie
	// tilde, v, u, bang, plus, THLMPSO: decoration
	// carat, underscore, equal: accidental
	// ampersand: time reset
	// open-curly, close-curly: grace notes
	// double-quote: chord symbol
	// less-than, greater-than, slash: duration
	// back-tick, space, tab: space

	parseRegularMusicLine(line: string) {
		let i = 0;
		let startOfLine = this.multilineVars.iChar;
		// see if there is nothing but a comment on this line. If so, just ignore it. A full line comment is optional white space followed by %
		// 跳过行首的空白字符
		while (this.tokenizer.isWhiteSpace(line[i]) && i < line.length) {
			i++;
		}

		if (i === line.length || line[i] === '%') {
			return;
		}

		// Start with the standard staff, clef and key symbols on each line
		// 每行开始添加标准的谱号、调号和拍号
		if (this.multilineVars.start_new_line) {
			this.startNewLine();
			if (this.multilineVars.meter !== null) {
				this.tune.appendElement('meter', -1, -1, this.multilineVars.meter);
				this.multilineVars.meter = null;
			}
		}
		this.multilineVars.start_new_line = true;
		let tripletNotesLeft = 0;
		let inTie = false;
		let inTieChord: { [key: number]: boolean } = {};

		// See if the line starts with a header field
		// 检查行首是否有头部字段
		const retHeader = this.letter_to_body_header(line, i);
		if (retHeader[0] > 0) {
			i += retHeader[0];
			this.multilineVars.iChar += retHeader[0];
			// TODO-PER: Handle inline headers
		}

		while (i < line.length) {
			const startI = i;
			if (line[i] === '%') {
				break;
			}

			const retInlineHeader = this.letter_to_inline_header(line, i);
			if (retInlineHeader[0] > 0) {
				i += retInlineHeader[0];
				this.multilineVars.iChar += retInlineHeader[0];
				// TODO-PER: Handle inline headers
				// multilineVars.start_new_line = false;
			} else {
				let el: any = {};

				// We need to decide if the following characters are a bar-marking or a note-group.
				// Unfortunately, that is ambiguous. Both can contain chord symbols and decorations.
				// If there is a grace note either before or after the chord symbols and decorations, then it is definitely a note-group.
				// If there is a bar marker, it is definitely a bar-marking.
				// If there is either a core-note or chord, it is definitely a note-group.
				// So, loop while we find grace-notes, chords-symbols, or decorations. [It is an error to have more than one grace-note group in a row; the others can be multiple]
				// Then, if there is a grace-note, we know where to go.
				// Else see if we have a chord, core-note, slur, triplet, or bar.

				while (true) {
					let ret: any = this.tokenizer.eatWhiteSpace(line, i);
					if (ret > 0) {
						i += ret;
						this.multilineVars.iChar += ret;
					}

					if (i > 0 && line[i - 1] === '\x12') {
						// there is one case where a line continuation isn't the same as being on the same line, and that is if the next character after it is a header.
						// 行继续的情况
						ret = this.letter_to_body_header(line, i);
						if (ret[0] > 0) {
							// TODO: insert header here
							i += ret[0];
							this.multilineVars.iChar += ret[0];
							this.multilineVars.start_new_line = false;
						}
					}
					// gather all the grace notes, chord symbols and decorations
					// 收集装饰音、和弦符号和装饰
					ret = this.letter_to_spacer(line, i);
					if (ret[0] > 0) {
						i += ret[0];
						this.multilineVars.iChar += ret[0];
					}

					ret = this.letter_to_chord(line, i);
					if (ret[0] > 0) {
						// TODO-PER: There could be more than one chord here if they have different positions.
						el.chord = { name: this.tokenizer.translateString(ret[1]), position: ret[2] };
						i += ret[0];
						this.multilineVars.iChar += ret[0];
						i += this.tokenizer.skipWhiteSpace(line.substring(i));
					} else {
						ret = this.letter_to_accent(line, i);
						if (ret[0] > 0) {
							if (ret[1] === null) {
								if (i + 1 < line.length) {
									this.startNewLine();	// There was a ! in the middle of the line. Start a new line if there is anything after it.
								}
							} else if (ret[1].length > 0) {
								if (el.decoration === undefined) {
									el.decoration = [];
								}
								el.decoration.push(ret[1]);
							}
							i += ret[0];
							this.multilineVars.iChar += ret[0];
						} else {
							ret = this.letter_to_grace(line, i);
							// TODO-PER: Be sure there aren't already grace notes defined. That is an error.
							if (ret[0] > 0) {
								el.gracenotes = ret[1];
								i += ret[0];
								this.multilineVars.iChar += ret[0];
							} else {
								break;
							}
						}
					}
				}
				let ret: any = {};
				ret = this.letter_to_bar(line, i);
				if (ret[0] > 0) {
					// This is definitely a bar
					// 小节线
					if (el.gracenote !== undefined) {
						this.addWarning(this.formatWarning("Can't have a grace note before a barline", this.tune.lines.length, i, line));
					}
					let bar: any = { type: ret[1] };
					if (bar.type.length === 0) {
						this.addWarning(this.formatWarning("Unknown bar type", this.tune.lines.length, i, line));
					} else {
						if (ret[2]) {
							bar.number = ret[2];
						}
						if (el.decoration !== undefined) {
							bar.decoration = el.decoration;
						}
						if (el.chord !== undefined) {
							bar.chord = el.chord;
						}
						this.tune.appendElement('bar', this.multilineVars.iChar, this.multilineVars.iChar + ret[0], bar);
					}
					i += ret[0];
					this.multilineVars.iChar += ret[0];
				} else {
					// This is definitely a note group
					// Look for as many open slurs and triplets as there are. (Note: only the first triplet is valid.)
					// 音符组
					let ret: any = this.letter_to_open_slurs_and_triplets(line, i);
					if (ret.consumed > 0) {
						if (ret.startSlur !== undefined) {
							el.startSlur = ret.startSlur;
						}
						if (ret.triplet !== undefined) {
							if (tripletNotesLeft > 0) {
								this.addWarning(this.formatWarning("Can't nest triplets", this.tune.lines.length, i, line));
							} else {
								el.startTriplet = ret.triplet;
								tripletNotesLeft = ret.num_notes === undefined ? ret.triplet : ret.num_notes;
							}
						}
						i += ret.consumed;
						this.multilineVars.iChar += ret.consumed;
					}

					// handle chords.
					// 处理和弦
					if (line[i] === '[') {
						i++;
						this.multilineVars.iChar++;
						let chordDuration: number | null = null;
						let done = false;

						while (!done) {
							const chordNote = this.getCoreNote(line, i, {}, false);
							if (chordNote !== null) {
								if (el.pitches === undefined) {
									el.pitches = [chordNote];
								} else {
									el.pitches.push(chordNote);
								}

								if (inTieChord[el.pitches.length]) {
									chordNote.endTie = true;
									inTieChord[el.pitches.length] = undefined;
								}

								if (chordNote.startTie) {
									inTieChord[el.pitches.length] = true;
								}

								i = chordNote.endChar;
								this.multilineVars.iChar = startOfLine + el.endChar;
							} else {
								if (i < line.length && line[i] === ']') {
									i++;
									this.multilineVars.iChar++;

									if (inTie) {
										el.endTie = true;
										inTie = false;
									}

									if (tripletNotesLeft > 0) {
										tripletNotesLeft--;
										if (tripletNotesLeft === 0) {
											el.endTriplet = true;
										}
									}

									let postChordDone = false;
									while (i < line.length && !postChordDone) {
										switch (line[i]) {
											case ' ':
											case '\t':
												this.addEndBeam(el);
												break;
											case ')':
												if (el.endSlur === undefined) el.endSlur = 1; else el.endSlur++;
												break;
											case '-':
												if (el.startTie === true)	// can only have one of these
													postChordDone = true;
												else {
													el.startTie = true;
													inTie = true;
												}
												break;
											case '>':
											case '<':
												const br2 = this.getBrokenRhythm(line, i);
												i += br2[0] - 1;	// index gets incremented below, so we'll let that happen
												this.multilineVars.next_note_duration = br2[2];
												chordDuration = br2[1];
												break;
											default:
												postChordDone = true;
												break;
										}
										if (!postChordDone) {
											i++;
											this.multilineVars.iChar++;
										}
									}
								} else {
									this.addWarning(this.formatWarning("Expected ']' to end the chords", this.tune.lines.length, i, line));
								}

								if (el.pitches !== undefined) {
									if (chordDuration !== null) {
										el.pitches.forEach(p => {
											p.duration = p.duration * chordDuration;
										});
									}
									this.tune.appendElement('note', this.multilineVars.iChar, this.multilineVars.iChar, el);
								}
								done = true;
							}
						}
					} else {
						// Single pitch
						// 单音符
						const core = this.getCoreNote(line, i, el, true);
						if (core !== null) {
							el = core;
							if (inTie) {
								el.endTie = true;
								inTie = false;
							}

							if (el.startTie) {
								inTie = true;
							}

							i = el.endChar;
							this.multilineVars.iChar = startOfLine + el.endChar;

							if (tripletNotesLeft > 0) {
								tripletNotesLeft--;
								if (tripletNotesLeft === 0) {
									el.endTriplet = true;
								}
							}

							if (ret.end_beam) {
								this.addEndBeam(el);
							}

							this.tune.appendElement('note', this.multilineVars.iChar, this.multilineVars.iChar, el);
						}
					}
				}

				if (i === startI) {
					// don't know what this is, so ignore it.
					// 未知字符，忽略
					if (line[i] !== ' ' && line[i] !== '`') {
						this.addWarning(this.formatWarning("Unknown character ignored", this.tune.lines.length, i, line));
					}
					i++;
					this.multilineVars.iChar++;
				}
			}
		}

		this.multilineVars.iChar++; // 新行字符
	}

	// 定义设置速度的函数
	setTempo(str: string) {
		//Q - tempo; can be used to specify the notes per minute, e.g.   if
		//the  default  note length is an eighth note then Q:120 or Q:C=120
		//is 120 eighth notes per minute. Similarly  Q:C3=40  would  be  40
		//dotted  quarter  notes per minute.  An absolute tempo may also be
		//set,  e.g.  Q:1/8=120  is  also  120  eighth  notes  per  minute,
		//irrespective of the default note length.
		//
		// This is either a number, "C=number", "Cnumber=number", or fraction=number
		// It depends on the L: field, which may either not be present, or may appear after this.
		// If L: is not present, an eighth note is used.
		// That means that this field can't be calculated until the end, if it is the first three types, since we don't know if we'll see an L: field.
		// So, if it is the fourth type, set it here, otherwise, save the info in the multilineVars.
		// The temporary variables we keep are the duration and the bpm. In the first two forms, the duration is 1.
		const commentStart = str.indexOf('%');	// get rid of any comment part
		if (commentStart >= 0) {
			str = str.substring(0, commentStart);
		}
		str = str.trim();
		if (str.length === 0) {
			return;	// just ignore a blank field.
		}

		if (str[0] === 'C') {	// either type 2 or type 3
			if (str.length >= 3 && str[1] === '=') {
				// This is a type 2 format. The duration is an implied 1
				const x = this.getInt(str.substring(2));
				if (x.digits === 0) {
					return; // TODO-PER: flag as an error.
				}
				this.multilineVars.tempo = { duration: 1, bpm: x.value };
				return;
			} else if (str.length >= 2 && str[1] >= '0' && str[1] <= '9') {
				// This is a type 3 format.
				const mult = this.getInt(str.substring(1));
				str = str.substring(mult.digits + 1);
				if (str.length < 2 || str[0] !== '=') {
					return;	// TODO-PER: flag an error
				}
				const speed = this.getInt(str.substring(1));
				if (speed.digits === 0) {
					return;	// TODO-PER: flag as an error.
				}
				this.multilineVars.tempo = { duration: mult.value, bpm: speed.value };
				return;
			}	// TODO-PER: if it isn't one of the above, flag as an error

		} else if (str[0] >= '0' && str[0] <= '9') {	// either type 1 or type 4
			const num = this.getInt(str);
			if (num.digits === 0) {
				return;	// TODO-PER: flag as an error.
			}
			str = str.substring(num.digits);
			if (str.length === 0 || str[0] !== '/') {
				// This is type 1
				this.multilineVars.tempo = { duration: 1, bpm: num.value };
				return;
			}
			str = str.substring(1);
			const num2 = this.getInt(str);
			if (num2.digits === 0) {
				return;	// TODO-PER: flag as an error.
			}

			str = str.substring(num2.digits);
			if (str.length === 0 || str[0] !== '=') {
				return;	// TODO-PER: flag as an error.
			}

			const num3 = this.getInt(str.substring(1));
			if (num3.digits === 0) {
				return; // TODO-PER: flag as an error.
			}
			this.tune.metaText.tempo = { duration: num.value / num2.value, bpm: num3.value };
		}
		// TODO-PER: if it isn't one of the above, flag as an error
	}


	// 定义解析行的函数
	private parseLine(line: string): void {
		if (!line.startsWith('%%')) {
			line = this.stripComment(line);
		}

		const str = line.length >= 2 ? line.substring(0, 2) : '';

		switch (str) {
			case 'A:':
				this.addMetaText("author", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'B:':
				this.addMetaText("book", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'C:':
				this.addMetaText("composer", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'D:':
				this.addMetaText("discography", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'F:':
				this.addMetaText("url", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'H:':
				this.addMetaText("history", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'E:':
			case 'I:':
				// Not supported currently.
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'K:':
				// since the key is the last thing that can happen in the header, we can resolve the tempo now
				if (this.multilineVars.tempo) {	// If there's a tempo waiting to be resolved
					let dur = this.multilineVars.default_length ? this.multilineVars.default_length / 8 : 1 / 8;
					this.tune.metaText.tempo = { duration: dur * this.multilineVars.tempo.duration, bpm: this.multilineVars.tempo.bpm };
					this.multilineVars.tempo = null;
				}
				const result: any = this.parseKey(line.substring(2));
				if (!this.multilineVars.is_in_header && this.tune.lines.length > 0) {
					if (result.foundClef) {
						this.tune.appendElement('clef', -1, -1, { type: this.multilineVars.clef });
					}
					if (result.foundKey) {
						this.tune.appendElement('key', -1, -1, this.multilineVars.key);
					}
				}
				this.multilineVars.is_in_header = false;	// The first key signifies the end of the header.
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'L:':
				const len = line.substring(2).replace(/\s/g, "");
				const len_arr = len.split('/');
				if (len_arr.length === 2) {
					const n = parseInt(len_arr[0]);
					const d = parseInt(len_arr[1]);
					if (d > 0) {
						const q = n / d;
						this.multilineVars.default_length = q * 8;	// an eighth note is 1
						this.multilineVars.havent_set_length = false;
					}
				}
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'M:':
				this.setMeter(line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'N:':
				this.addMetaText("notes", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'O:':
				this.addMetaText("origin", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'P:':
				// TODO-PER: There is more to do with parts, but the writer doesn't care.
				if (this.multilineVars.is_in_header) {
					this.addMetaText("partOrder", line.substring(2));
				} else {
					this.multilineVars.partForNextLine = line.substring(2);
				}
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'Q:':
				this.setTempo(line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'R:':
				this.addMetaText("rhythm", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'S:':
				this.addMetaText("source", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'T:':
				this.setTitle(line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'V:':
				// TODO-PER: handle voice
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'w:':
				this.addWords(this.tune.lines[this.tune.lines.length - 1].staff, line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'W:':
				this.addMetaText("unalignedWords", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'X:':
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'Z:':
				this.addMetaText("transcription", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			//case 'I:':
			case '%%':
				const err = this.addDirective(line.substring(2));
				if (err) {
					this.addWarning(this.formatWarning(err, this.tune.lines.length, 2, line));
				}
				this.multilineVars.iChar += line.length + 1;
				break;
			default:
				if (line.length > 0) {
					this.multilineVars.havent_set_length = false;	// To late to set this now.
					this.multilineVars.is_in_header = false;	// We should have gotten a key header by now, but just in case, this is definitely out of the header.
					this.parseRegularMusicLine(line);
				}
		}
	}

	// 定义解析曲调的函数
	private parseTune(strTune: string): void {
		// Take care of whatever line endings come our way
		strTune = strTune.replace(/\x12\n/g, '\n');
		strTune = strTune.replace(/\x12/g, '\n');
		strTune = strTune.replace(/\\([ \t]*)\n/g, "$1 \x12");	// take care of line continuations right away, but keep the same number of characters
		const lines = strTune.split('\n');
		lines.forEach(line => {
			this.parseLine(line);
		});
	};

	// 定义主解析函数
	parse(strTune: string): void {
		this.tune.reset();
		this.multilineVars.reset();
		this.parseTune(strTune);
	}
}


