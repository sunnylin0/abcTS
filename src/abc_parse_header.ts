// abc_parse_header.ts: parses a the header fields from a string representing ABC Music Notation into a usable internal structure.
// Copyright (C) 2010 Paul Rosen (paul at paulrosen dot net)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*global Class */
/*extern AbcParseHeader */

//interface Tokenizer {
//	skipWhiteSpace(str: string): number;
//	getClef(str: string): { token: string, len: number, explicit: boolean, warn?: string };
//	getKeyPitch(str: string): { token: string, len: number };
//	getSharpFlat(str: string): { token: string, len: number };
//	getMode(str: string): { token: string, len: number };
//	getKeyAccidental(str: string): { token: any, len: number, warn?: string };
//	tokenize(str: string, start: number, end: number): any[];
//	stripComment(str: string): string;
//	getMeasurement(tokens: any[]): { used: number, value: number };
//	translateString(str: string): string;
//	theReverser(str: string): string;
//}

//interface Tune {
//	addMetaText(field: string, text: string): void;
//	addSubtitle(text: string): void;
//	appendStartingElement(type: string, x: number, y: number, data: any): void;
//	appendElement(type: string, x: number, y: number, data: any): void;
//	setCurrentVoice(staffNum: number, index: number): void;
//	hasBeginMusic(): boolean;
//	formatting: { key: string]: any };
//	metaText: { key: string]: any };
//}

//interface MultilineVars {
//	clef: { type: string, middle: number };
//	key: any;
//	titlecaps: boolean;
//	score_is_present: boolean;
//	staves: any[];
//	voices: { [key: string]: any };
//	currentVoice: any;
//	macros: { [key: string]: string };
//	hasMainTitle: boolean;
//	origMeter: any;
//	meter: any;
//	inTextBlock: boolean;
//	barNumbers: number;
//}
let key1sharp: KeySignature = { acc: 'sharp', note: 'f' };
let key2sharp: KeySignature = { acc: 'sharp', note: 'c' };
let key3sharp: KeySignature = { acc: 'sharp', note: 'g' };
let key4sharp: KeySignature = { acc: 'sharp', note: 'd' };
let key5sharp: KeySignature = { acc: 'sharp', note: 'A' };
let key6sharp: KeySignature = { acc: 'sharp', note: 'e' };
let key7sharp: KeySignature = { acc: 'sharp', note: 'B' };
let key1flat: KeySignature = { acc: 'flat', note: 'B' };
let key2flat: KeySignature = { acc: 'flat', note: 'e' };
let key3flat: KeySignature = { acc: 'flat', note: 'A' };
let key4flat: KeySignature = { acc: 'flat', note: 'd' };
let key5flat: KeySignature = { acc: 'flat', note: 'g' };
let key6flat: KeySignature = { acc: 'flat', note: 'c' };
let key7flat: KeySignature = { acc: 'flat', note: 'f' };
class AbcParseHeader {
	tokenizer: AbcTokenizer;
	warn: (message: string, line: string, position: number) => void;
	multilineVars: MultilineVars;
	tune: AbcTune;

	constructor(tokenizer: AbcTokenizer, warn: (message: string, line: string, position: number) => void, multilineVars: MultilineVars, tune: Tune) {
		this.tokenizer = tokenizer;
		this.warn = warn;
		this.multilineVars = multilineVars;
		this.tune = tune;
	}

	keys: { [key: string]: KeySignature[] } = {
		'C#': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp],
		'A#m': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp],
		'G#Mix': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp],
		'D#Dor': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp],
		'E#Phr': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp],
		'F#Lyd': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp],
		'B#Loc': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp, key7sharp],

		'F#': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp],
		'D#m': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp],
		'C#Mix': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp],
		'G#Dor': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp],
		'A#Phr': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp],
		'BLyd': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp],
		'E#Loc': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp, key6sharp],

		'B': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp],
		'G#m': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp],
		'F#Mix': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp],
		'C#Dor': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp],
		'D#Phr': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp],
		'ELyd': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp],
		'A#Loc': [key1sharp, key2sharp, key3sharp, key4sharp, key5sharp],

		'E': [key1sharp, key2sharp, key3sharp, key4sharp],
		'C#m': [key1sharp, key2sharp, key3sharp, key4sharp],
		'BMix': [key1sharp, key2sharp, key3sharp, key4sharp],
		'F#Dor': [key1sharp, key2sharp, key3sharp, key4sharp],
		'G#Phr': [key1sharp, key2sharp, key3sharp, key4sharp],
		'ALyd': [key1sharp, key2sharp, key3sharp, key4sharp],
		'D#Loc': [key1sharp, key2sharp, key3sharp, key4sharp],

		'A': [key1sharp, key2sharp, key3sharp],
		'F#m': [key1sharp, key2sharp, key3sharp],
		'EMix': [key1sharp, key2sharp, key3sharp],
		'BDor': [key1sharp, key2sharp, key3sharp],
		'C#Phr': [key1sharp, key2sharp, key3sharp],
		'DLyd': [key1sharp, key2sharp, key3sharp],
		'G#Loc': [key1sharp, key2sharp, key3sharp],

		'D': [key1sharp, key2sharp],
		'Bm': [key1sharp, key2sharp],
		'AMix': [key1sharp, key2sharp],
		'EDor': [key1sharp, key2sharp],
		'F#Phr': [key1sharp, key2sharp],
		'GLyd': [key1sharp, key2sharp],
		'C#Loc': [key1sharp, key2sharp],

		'G': [key1sharp],
		'Em': [key1sharp],
		'DMix': [key1sharp],
		'ADor': [key1sharp],
		'BPhr': [key1sharp],
		'CLyd': [key1sharp],
		'F#Loc': [key1sharp],

		'C': [],
		'Am': [],
		'GMix': [],
		'DDor': [],
		'EPhr': [],
		'FLyd': [],
		'BLoc': [],

		'F': [key1flat],
		'Dm': [key1flat],
		'CMix': [key1flat],
		'GDor': [key1flat],
		'APhr': [key1flat],
		'BbLyd': [key1flat],
		'ELoc': [key1flat],

		'Bb': [key1flat, key2flat],
		'Gm': [key1flat, key2flat],
		'FMix': [key1flat, key2flat],
		'CDor': [key1flat, key2flat],
		'DPhr': [key1flat, key2flat],
		'EbLyd': [key1flat, key2flat],
		'ALoc': [key1flat, key2flat],

		'Eb': [key1flat, key2flat, key3flat],
		'Cm': [key1flat, key2flat, key3flat],
		'BbMix': [key1flat, key2flat, key3flat],
		'FDor': [key1flat, key2flat, key3flat],
		'GPhr': [key1flat, key2flat, key3flat],
		'AbLyd': [key1flat, key2flat, key3flat],
		'DLoc': [key1flat, key2flat, key3flat],

		'Ab': [key1flat, key2flat, key3flat, key4flat],
		'Fm': [key1flat, key2flat, key3flat, key4flat],
		'EbMix': [key1flat, key2flat, key3flat, key4flat],
		'BbDor': [key1flat, key2flat, key3flat, key4flat],
		'CPhr': [key1flat, key2flat, key3flat, key4flat],
		'DbLyd': [key1flat, key2flat, key3flat, key4flat],
		'GLoc': [key1flat, key2flat, key3flat, key4flat],

		'Db': [key1flat, key2flat, key3flat, key4flat, key5flat],
		'Bbm': [key1flat, key2flat, key3flat, key4flat, key5flat],
		'AbMix': [key1flat, key2flat, key3flat, key4flat, key5flat],
		'EbDor': [key1flat, key2flat, key3flat, key4flat, key5flat],
		'FPhr': [key1flat, key2flat, key3flat, key4flat, key5flat],
		'GgLyd': [key1flat, key2flat, key3flat, key4flat, key5flat],
		'CLoc': [key1flat, key2flat, key3flat, key4flat, key5flat],

		'Gb': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat],
		'Ebm': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat],
		'DbMix': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat],
		'AbDor': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat],
		'BbPhr': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat],
		'CbLyd': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat],
		'FLoc': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat],

		'Cb': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat],
		'Abm': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat],
		'GbMix': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat],
		'DbDor': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat],
		'EbPhr': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat],
		'FbLyd': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat],
		'BbLoc': [key1flat, key2flat, key3flat, key4flat, key5flat, key6flat, key7flat],

		// The following are not in the 2.0 spec, but seem normal enough.
		// TODO-PER: These SOUND the same as what's written, but they aren't right
		'A#': [key1flat, key2flat],
		'B#': [],
		'D#': [key1flat, key2flat, key3flat],
		'E#': [key1flat],
		'G#': [key1flat, key2flat, key3flat, key4flat]
	};


	calcMiddle(clef: string, oct: number): number {
		let mid = 6;
		switch (clef) {
			case 'treble':
			case 'none':
			case 'treble+8':
			case 'treble-8':
				break;
			case 'bass3':
			case 'bass':
			case 'bass+8':
			case 'bass-8':
			case 'bass+16':
			case 'bass-16':
				mid = -6;
				break;
			case 'tenor':
				mid = -2;
				break;
			case 'alto2':
			case 'alto1':
			case 'alto':
			case 'alto+8':
			case 'alto-8':
				mid = 0;
				break;
		}
		return mid + oct;
	}
	pitches = { A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11 };


	addPosToKey(clef: { type: string }, key: any): void {
		const mid = this.calcMiddle(clef.type, 0);
		key.extraAccidentals.forEach(acc => {
			let pitch = this.pitches[acc.note];
			pitch = pitch + 6 - mid;
			acc.verticalPos = pitch % 14; // Always keep this on the two octaves on the staff
		});
	}

	fixKey(clef: { type: string }, key: any): any {
		const fixedKey = { ...key };
		this.addPosToKey(clef, fixedKey);
		return fixedKey;
	}

	parseMiddle(str: string): number {
		let mid = this.pitches[str[0]];
		for (let i = 1; i < str.length; i++) {
			if (str[i] === ',') mid -= 7;
			else if (str[i] === ',') mid += 7;
		}
		return mid;
	}

	parseKey(str: string): { foundClef?: boolean, foundKey?: boolean } {
		// The format is:
		// [space][tonic[#|b][ ][3-letter-mode][ignored-chars][space]][ accidentals...][ clef=treble|bass|bass3|tenor|alto|alto2|alto1|none [+8|-8]]
		// -- or -- the key can be "none"
		// First get the key letter: turn that into a index into the key array (0-11)
		// Then see if there is a sharp or flat. Increment or decrement.
		// Then see if there is a mode modifier. Add or subtract to the index.
		// Then do a mod 12 on the index and return the key.
		// TODO: This may leave unparsed characters at the end after something reasonable was found.

		const origStr = str;
		let ret: any = {};

		const setMiddle = (str: string) => {
			let i = this.tokenizer.skipWhiteSpace(str);
			str = str.substring(i);
			if (str.startsWith('m=') || str.startsWith('middle=')) {
				str = str.substring(str.indexOf('=') + 1);
				this.multilineVars.clef.middle = this.parseMiddle(str);
			}
		};
		// check first to see if there is only a clef. If so, just take that, but ignore an error after that.
		let retClef = this.tokenizer.getClef(str);
		if (retClef.token !== undefined && (retClef.explicit === true || retClef.token !== 'none')) {
			this.multilineVars.clef = { type: retClef.token, middle: this.calcMiddle(retClef.token, 0) };
			str = str.substring(retClef.len);
			setMiddle(str);
			return { foundClef: true };
		}

		const retPitch = this.tokenizer.getKeyPitch(str);
		if (retPitch.len > 0) {
			let key = retPitch.token;
			str = str.substring(retPitch.len);
			// We got a pitch to start with, so we might also have an accidental and a mode
			const retAcc = this.tokenizer.getSharpFlat(str);
			if (retAcc.len > 0) {
				key += retAcc.token;
				str = str.substring(retAcc.len);
			}
			const retMode = this.tokenizer.getMode(str);
			if (retMode.len > 0) {
				key += retMode.token;
				str = str.substring(retMode.len);
			}
			// We need to do a deep copy because we are going to modify it
			ret.extraAccidentals = [];
			this.keys[key].forEach(k => ret.extraAccidentals.push({ ...k }));
		} else if (str.startsWith('HP')) {
			this.addDirective("bagpipes");
			ret.extraAccidentals = [];
			this.multilineVars.key = ret;
			return { foundKey: true };
		} else if (str.startsWith('Hp')) {
			ret.extraAccidentals = [
				{ acc: 'natural', note: 'g' },
				{ acc: 'sharp', note: 'f' },
				{ acc: 'sharp', note: 'c' }
			];
			this.addDirective("bagpipes");
			this.multilineVars.key = ret;
			return { foundKey: true };
		} else {
			const retNone = this.tokenizer.isMatch(str, 'none');
			if (retNone > 0) {
				// we got the none key - that's the same as C to us
				ret.extraAccidentals = [];
				str = str.substring(retNone);
			}
		}
		// There are two special cases of deprecated syntax. Ignore them if they occur
		while (str.startsWith('exp') || str.startsWith('oct'))
			str = str.substring(3);
		// now see if there are extra accidentals
		while (true) {
			const retExtra = this.tokenizer.getKeyAccidental(str);
			if (retExtra.len === 0) break;
			str = str.substring(retExtra.len);
			if (retExtra.warn)
				this.warn("error parsing extra accidentals:", origStr, 0);
			else {
				if (!ret.extraAccidentals)
					ret.extraAccidentals = [];
				ret.extraAccidentals.push(retExtra.token);
			}
		}


		// now see if there is a clef
		retClef = this.tokenizer.getClef(str);
		if (retClef.len > 0) {
			if (retClef.warn)
				this.warn("error parsing clef:" + retClef.warn, origStr, 0);
			else {
				//ret.clef = retClef.token;
				this.multilineVars.clef = { type: retClef.token, middle: this.calcMiddle(retClef.token, 0) };
				str = str.substring(retClef.len);
				setMiddle(str);
			}
		}

		if (ret.regularKey === undefined && ret.extraAccidentals === undefined && retClef.token === undefined) {
			this.warn("error parsing key: ", origStr, 0);
			//ret.regularKey = keys.C;
			return {};
		}

		let result:any = {};
		if (retClef.token !== undefined)
			result.foundClef = true;
		if (ret.regularKey !== undefined || ret.extraAccidentals !== undefined) {
			this.multilineVars.key = ret;
			result.foundKey = true;
		}
		return result;
	}

	addDirective(str: string): string | null {
		const oneParameterMeasurement = (cmd: string, tokens: any[]) => {
			const points = this.tokenizer.getMeasurement(tokens);
			if (points.used === 0 || tokens.length !== 0) return `Directive "${cmd}" requires a measurement as a parameter.`;
			this.tune.formatting[cmd] = points.value;
			return null;
		};

		const getFontParameter = (tokens: any[]) => {
			let font:Font = {};
			const token = tokens.last();
			if (token.type === 'number') {
				font.size = parseInt(token.token);
				tokens.pop();
			}
			if (tokens.length > 0) {
				let scratch = "";
				tokens.forEach(tok => {
					if (tok.token !== '-') {
						if (scratch.length > 0) scratch += ' ';
						scratch += tok.token;
					}
				});
				font.font = scratch;
			}
			return font;
		};

		const getChangingFont = (cmd: string, tokens: any[]) => {
			if (tokens.length === 0) return `Directive "${cmd}" requires a font as a parameter.`;
			this.multilineVars[cmd] = getFontParameter(tokens);
			return null;
		};

		const getGlobalFont = (cmd: string, tokens: any[]) => {
			if (tokens.length === 0) return `Directive "${cmd}" requires a font as a parameter.`;
			this.tune.formatting[cmd] = getFontParameter(tokens);
			return null;
		};

		const tokens = this.tokenizer.tokenize(str, 0, str.length);	// 3 or more % in a row, or just spaces after %% is just a comment
		if (tokens.length === 0 || tokens[0].type !== 'alpha') return null;
		let restOfString = str.substring(str.indexOf(tokens[0].token) + tokens[0].token.length);
		restOfString = this.tokenizer.stripComment(restOfString);
		const cmd = tokens.shift().token.toLowerCase();
		let num;
		let scratch = "";
		switch (cmd) {
			case "bagpipes": this.tune.formatting.bagpipes = true; break;
			case "landscape": this.tune.formatting.landscape = true; break;
			case "slurgraces": this.tune.formatting.slurgraces = true; break;
			case "stretchlast": this.tune.formatting.stretchlast = true; break;
			case "titlecaps": this.multilineVars.titlecaps = true; break;
			case "titleleft": this.tune.formatting.titleleft = true; break;

			case "botmargin":
			case "botspace":
			case "composerspace":
			case "indent":
			case "leftmargin":
			case "linesep":
			case "musicspace":
			case "partsspace":
			case "staffsep":
			case "staffwidth":
			case "subtitlespace":
			case "sysstaffsep":
			case "systemsep":
			case "textspace":
			case "titlespace":
			case "topmargin":
			case "topspace":
			case "vocalspace":
			case "wordsspace":
				return oneParameterMeasurement(cmd, tokens);
				break;
			case "scale":
				scratch = "";
				tokens.forEach(tok =>
					scratch += tok.token
				);
				num = parseFloat(scratch);
				if (isNaN(num) || num === 0) return `Directive "${cmd}" requires a number as a parameter.`;
				this.tune.formatting.scale = num;
				break;
			case "sep":
				if (tokens.length === 0)
					this.tune.addSeparator();
				else {
					if (tokens.length !== 3 || tokens[0].type !== 'number' || tokens[1].type !== 'number' || tokens[2].type !== 'number')
						return `Directive "${cmd}" requires 3 numbers: space above, space below, length of line`;
					this.tune.addSeparator(parseInt(tokens[0].token), parseInt(tokens[1].token), parseInt(tokens[2].token));
				}
				break;
			case "barnumbers":
				if (tokens.length !== 1 || tokens[0].type !== 'number')
					return `Directive "${cmd}" requires a number as a parameter.`;
				this.multilineVars.barNumbers = parseInt(tokens[0].token);
				break;
			case "begintext":
				this.multilineVars.inTextBlock = true;
				break;
			case "text":
				this.tune.addText(this.tokenizer.translateString(restOfString)); // display secondary title
				break;
			case "gchordfont":
			case "partsfont":
			case "vocalfont":
				return getChangingFont(cmd, tokens);
				break;
			case "barlabelfont":
			case "barnumberfont":
			case "composerfont":
			case "subtitlefont":
			case "tempofont":
			case "titlefont":
			case "voicefont":
				return getGlobalFont(cmd, tokens);
				break;
			case "barnumfont":
				return getGlobalFont("barnumberfont", tokens);
				break;
			case "score":
				this.multilineVars.score_is_present = true;
				const addVoice = (id: string, newStaff: boolean, bracket: string | undefined, brace: string | undefined, continueBar: boolean) => {
					if (newStaff || this.multilineVars.staves.length === 0) {
						this.multilineVars.staves.push({ index: this.multilineVars.staves.length, numVoices: 0 });
					}
					const staff = this.multilineVars.staves.last();
					if (bracket !== undefined) staff.bracket = bracket;
					if (brace !== undefined) staff.brace = brace;
					if (continueBar) staff.connectBarLines = 'end';
					if (this.multilineVars.voices[id] === undefined) {
						this.multilineVars.voices[id] = { staffNum: staff.index, index: staff.numVoices };
						staff.numVoices++;
					}
				};

				let openParen = false;
				let openBracket = false;
				let openBrace = false;
				let justOpenParen = false;
				let justOpenBracket = false;
				let justOpenBrace = false;
				let continueBar = false;
				let lastVoice: any = undefined;
				while (tokens.length) {
					let t = tokens.shift();
					switch (t.token) {
						case '(':
							if (openParen) this.warn("Can't nest parenthesis in %%score", str, t.start);
							else { openParen = true; justOpenParen = true; }
							break;
						case ')':
							if (!openParen || justOpenParen) this.warn("Unexpected close parenthesis in %%score", str, t.start);
							else openParen = false;
							break;
						case '[':
							if (openBracket) this.warn("Can't nest brackets in %%score", str, t.start);
							else { openBracket = true; justOpenBracket = true; }
							break;
						case ']':
							if (!openBracket || justOpenBracket) this.warn("Unexpected close bracket in %%score", str, t.start);
							else { openBracket = false; this.multilineVars.staves[lastVoice.staffNum].bracket = 'end'; }
							break;
						case '{':
							if (openBrace) this.warn("Can't nest braces in %%score", str, t.start);
							else { openBrace = true; justOpenBrace = true; }
							break;
						case '}':
							if (!openBrace || justOpenBrace) this.warn("Unexpected close brace in %%score", str, t.start);
							else { openBrace = false; this.multilineVars.staves[lastVoice.staffNum].brace = 'end'; }
							break;
						case '|':
							continueBar = true;
							if (lastVoice) {
								let ty = 'start';
								if (lastVoice.staffNum > 0) {
									if (this.multilineVars.staves[lastVoice.staffNum - 1].connectBarLines === 'start' ||
										this.multilineVars.staves[lastVoice.staffNum - 1].connectBarLines === 'continue')
										ty = 'continue';
								}
								this.multilineVars.staves[lastVoice.staffNum].connectBarLines = ty;
							}
							break;
						default:
							let vc = "";
							while (t.type === 'alpha' || t.type === 'number') {
								vc += t.token;
								if (t.continueId)
									t = tokens.shift();
								else
									break;
							}
							const newStaff = !openParen || justOpenParen;
							const bracket = justOpenBracket ? 'start' : openBracket ? 'continue' : undefined;
							const brace = justOpenBrace ? 'start' : openBrace ? 'continue' : undefined;
							addVoice(vc, newStaff, bracket, brace, continueBar);
							justOpenParen = false;
							justOpenBracket = false;
							justOpenBrace = false;
							continueBar = false;
							lastVoice = this.multilineVars.voices[vc];
							break;
					}
				}
				break;

			case "midi":
			//case "indent": ¦hªº
			case "playtempo":
			case "auquality":
			case "continuous":
			case "nobarcheck":
			case "staves":
				// TODO-PER: Actually handle the parameters of these
				this.tune.formatting[cmd] = restOfString;
				break;
			default:
				return "Unknown directive: " + cmd;
		}
		return null;
	}

	setCurrentVoice(id: string): void {
		this.multilineVars.currentVoice = this.multilineVars.voices[id];
		this.tune.setCurrentVoice(this.multilineVars.currentVoice.staffNum, this.multilineVars.currentVoice.index);
	}

	parseVoice(line: string, i: number, e: number): void {
		//First truncate the string to the first non-space character after V: through either the
		//end of the line or a % character. Then remove trailing spaces, too.
		const ret = this.tokenizer.getMeat(line, i, e);
		let start = ret.start;
		let end = ret.end;
		//The first thing on the line is the ID. It can be any non-space string and terminates at the
		//first space.
		const id = this.tokenizer.getToken(line, start, end);
		let staffInfo:StaffInfo = {}
		if (id.length === 0) {
			this.warn("Expected a voice id", line, start);
			return;
		}
		let isNew = false;
		if (this.multilineVars.voices[id] === undefined) {
			this.multilineVars.voices[id] = {};
			isNew = true;
			if (this.multilineVars.score_is_present)
				this.warn("Can't have an unknown V: id when the %score directive is present", line, i);
		}
		start += id.length;
		start += this.tokenizer.eatWhiteSpace(line, start);

		staffInfo = { startStaff: isNew };
		const addNextTokenToStaffInfo = (name: string) => {
			const attr = this.tokenizer.getVoiceToken(line, start, end);
			if (attr.warn !== undefined)
				this.warn(`Expected value for ${name} in voice: ${attr.warn}`, line, start);
			else if (attr.token.length === 0 && line[start] !== '"')
				this.warn(`Expected value for ${name} in voice`, line, start);
			else
				staffInfo[name] = attr.token;
			start += attr.len;
		};

		while (start < end) {
			const token = this.tokenizer.getVoiceToken(line, start, end);
			start += token.len;

			if (token.warn) {
				this.warn(`Error parsing voice: ${token.warn}`, line, start);
			} else {
				let attr: any = null;
				switch (token.token) {
					case 'clef':
					case 'cl':
						addNextTokenToStaffInfo('clef');
						// TODO-PER: check for a legal clef; do octavizing
						let oct = 0;
						staffInfo.clef = staffInfo.clef.replace(/',]/g, "");
						if (staffInfo.clef.indexOf('+16') !== -1) {
							oct += 14;
							staffInfo.clef = staffInfo.clef.replace('+16', '');
						}
						staffInfo.middle = this.calcMiddle(staffInfo.clef, oct);
						break;
					case 'treble':
					case 'bass':
					case 'tenor':
					case 'alto':
					case 'none':
					case 'treble\'':
					case 'bass\'':
					case 'tenor\'':
					case 'alto\'':
					case 'none\'':
					case 'treble\'\'':
					case 'bass\'\'':
					case 'tenor\'\'':
					case 'alto\'\'':
					case 'none\'\'':
					case 'treble,':
					case 'bass,':
					case 'tenor,':
					case 'alto,':
					case 'none,':
					case 'treble,,':
					case 'bass,,':
					case 'tenor,,':
					case 'alto,,':
					case 'none,,':
						staffInfo.clef = token.token.replace(/[',]/g, "");
						staffInfo.middle = this.calcMiddle(staffInfo.clef, 0);
						break;
					case 'staves':
					case 'stave':
					case 'stv':
						addNextTokenToStaffInfo('staves');
						break;
					case 'brace':
					case 'brc':
						addNextTokenToStaffInfo('brace');
						break;
					case 'bracket':
					case 'brk':
						addNextTokenToStaffInfo('bracket');
						break;
					case 'name':
					case 'nm':
						addNextTokenToStaffInfo('name');
						break;
					case 'subname':
					case 'sname':
					case 'snm':
						addNextTokenToStaffInfo('subname');
						break;
					case 'merge':
						staffInfo.startStaff = false;
						break;
					case 'stems':
						attr = this.tokenizer.getVoiceToken(line, start, end);
						if (attr.warn !== undefined)
							this.warn(`Expected value for stems in voice: ${attr.warn}`, line, start);
						else if (attr.token === 'up' || attr.token === 'down')
							this.multilineVars.voices[id].stem = attr.token;
						else
							this.warn("Expected up or down for voice stem", line, start);
						start += attr.len;
						break;
					case 'up':
					case 'down':
						this.multilineVars.voices[id].stem = token.token;
						break;
					case 'middle':
					case 'm':
						addNextTokenToStaffInfo('middle');
						staffInfo.middle = this.parseMiddle(staffInfo.middle);
						break;
					case 'gchords':
					case 'gch':
						this.multilineVars.voices[id].suppressChords = true;
						break;
					case 'space':
					case 'spc':
						addNextTokenToStaffInfo('spacing');
						break;
				}
			}
			start += this.tokenizer.eatWhiteSpace(line, start);
		}

		// now we've filled up staffInfo, figure out what to do with this voice
		// TODO-PER: It is unclear from the standard and the examples what to do with brace, bracket, and staves, so they are ignored for now.
		if (staffInfo.startStaff || this.multilineVars.staves.length === 0) {
			this.multilineVars.staves.push({ index: this.multilineVars.staves.length, meter: this.multilineVars.origMeter });
			if (!this.multilineVars.score_is_present)
				this.multilineVars.staves[this.multilineVars.staves.length - 1].numVoices = 0;
		}
		if (this.multilineVars.voices[id].staffNum === undefined) {
			// store where to write this for quick access later.
			this.multilineVars.voices[id].staffNum = this.multilineVars.staves.length - 1;
			let vi = 0;
			for (const v in this.multilineVars.voices) {
				if (this.multilineVars.voices.hasOwnProperty(v)) {
					if (this.multilineVars.voices[v].staffNum === this.multilineVars.voices[id].staffNum)
						vi++;
				}
			}
			this.multilineVars.voices[id].index = vi - 1;
		}
		const s = this.multilineVars.staves[this.multilineVars.voices[id].staffNum];
		if (!this.multilineVars.score_is_present)
			s.numVoices++;
		if (staffInfo.clef) s.clef = { type: staffInfo.clef, middle: staffInfo.middle };
		if (staffInfo.spacing) s.spacing_below_offset = staffInfo.spacing;
		if (staffInfo.middle) s.middle = staffInfo.middle;

		if (staffInfo.name) {
			if (s.name) s.name.push(staffInfo.name); else s.name = [staffInfo.name];
		}
		if (staffInfo.subname) {
			if (s.subname) s.subname.push(staffInfo.subname); else s.subname = [staffInfo.subname];
		}

		this.setCurrentVoice(id);
	}

	setTitle(title: string): void {
		if (this.multilineVars.hasMainTitle)
			this.tune.addSubtitle(this.tokenizer.translateString(this.tokenizer.stripComment(title))); // display secondary title
		else {
			this.tune.addMetaText("title", this.tokenizer.translateString(this.tokenizer.theReverser(this.tokenizer.stripComment(title))));
			this.multilineVars.hasMainTitle = true;
		}
	}

	setMeter(line: string): { type: string, value?: any } | null {
		line = this.tokenizer.stripComment(line);
		if (line === 'C') {
			if (this.multilineVars.havent_set_length === true)
				this.multilineVars.default_length = 0.125;
			return { type: 'common_time' };
		} else if (line === 'C|') {
			if (this.multilineVars.havent_set_length === true)
				this.multilineVars.default_length = 0.125;
			return { type: 'cut_time' };
		} else if (line.length === 0 || line.toLowerCase() === 'none') {
			if (this.multilineVars.havent_set_length === true)
				this.multilineVars.default_length = 0.125;
			return null;
		} else {
			const tokens = this.tokenizer.tokenize(line, 0, line.length);
			// the form is [open_paren] decimal [ plus|dot decimal ]... [close_paren] slash decimal [plus same_as_before]
			try {
				const parseNum = () => {
					// handles this much: [open_paren] decimal [ plus|dot decimal ]... [close_paren]
					let ret = { value: 0, num: "" };
					let tok = tokens.shift();
					if (tok.token === '(')
						tok = tokens.shift();
					while (1) {
						if (tok.type !== 'number') throw "Expected top number of meter";
						ret.value += parseInt(tok.token);
						ret.num += tok.token;
						if (tokens.length === 0 || tokens[0].token === '/') return ret;
						tok = tokens.shift();
						if (tok.token === ')') {
							if (tokens.length === 0 || tokens[0].token === '/') return ret;
							throw "Unexpected paren in meter";
						}
						if (tok.token !== '.' && tok.token !== '+') throw "Expected top number of meter";
						ret.num += tok.token;
						if (tokens.length === 0) throw "Expected top number of meter";
						tok = tokens.shift();
					}
				};

				const parseFraction = () => {
					// handles this much: parseNum slash decimal
					let ret = parseNum();
					if (tokens.length === 0) throw "Expected slash in meter";
					let tok = tokens.shift();
					if (tok.token !== '/') throw "Expected slash in meter";
					tok = tokens.shift();
					if (tok.type !== 'number') throw "Expected bottom number of meter";
					ret.den = tok.token;
					ret.value = ret.value / parseInt(ret.den);
					return ret;
				};

				if (tokens.length === 0) throw "Expected meter definition in M: line";
				let meter = { type: 'specified', value: [] };
				let totalLength = 0;
				while (1) {
					const ret = parseFraction();
					totalLength += ret.value;
					meter.value.push({ num: ret.num, den: ret.den });
					if (tokens.length === 0) break;
					const tok = tokens.shift();
					if (tok.token !== '+') throw "Extra characters in M: line";
				}

				if (this.multilineVars.havent_set_length === true) {
					this.multilineVars.default_length = totalLength < 0.75 ? 0.0625 : 0.125;
				}
				return meter;
			} catch (e) {
				this.warn(e, line, 0);
			}
		}
		return null;
	}

	calcTempo(relTempo: { duration: number[] }): { duration: number[] } {
		const dur = this.multilineVars.default_length ? this.multilineVars.default_length : 1;
		for (let i = 0; i < relTempo.duration.length; i++)
			relTempo.duration[i] = dur * relTempo.duration[i];
		return relTempo;
	}

	resolveTempo(): void {
		if (this.multilineVars.tempo) { // If there's a tempo waiting to be resolved
			this.calcTempo(this.multilineVars.tempo);
			this.tune.metaText.tempo = this.multilineVars.tempo;
			delete this.multilineVars.tempo;
		}
	}

	addUserDefinition(line: string, start: number, end: number): void {
		const equals = line.indexOf('=', start);
		if (equals === -1) {
			this.warn("Need an = in a macro definition", line, start);
			return;
		}

		const before = line.substring(start, equals).trim();
		const after = line.substring(equals + 1).trim();

		if (before.length !== 1) {
			this.warn("Macro definitions can only be one character", line, start);
			return;
		}
		const legalChars = "HIJKLMNOPQRSTUVWhijklmnopqrstuvw~";
		if (legalChars.indexOf(before) === -1) {
			this.warn("Macro definitions must be H-W, h-w, or tilde", line, start);
			return;
		}
		if (after.length === 0) {
			this.warn("Missing macro definition", line, start);
			return;
		}
		if (this.multilineVars.macros === undefined)
			this.multilineVars.macros = {};
		this.multilineVars.macros[before] = after;
	}

	setDefaultLength(line: string, start: number, end: number): void {
		const len = line.substring(start, end).replace(" ", "");
		const len_arr = len.split('/');
		if (len_arr.length === 2) {
			const n = parseInt(len_arr[0]);
			const d = parseInt(len_arr[1]);
			if (d > 0) {
				const q = n / d;
				this.multilineVars.default_length = q; // a whole note is 1
				this.multilineVars.havent_set_length = false;
			}
		}
	}


	setTempo(line: string, start: number, end: number): { type?: string; tempo?: any } {
		// Q - tempo; can be used to specify the notes per minute, e.g.   if
		// the  default  note length is an eighth note then Q:120 or Q:C=120
		// is 120 eighth notes per minute. Similarly  Q:C3=40  would  be  40
		// dotted  quarter  notes per minute.  An absolute tempo may also be
		// set,  e.g.  Q:1/8=120  is  also  120  eighth  notes  per  minute,
		// irrespective of the default note length.
		//
		// This is either a number, "C=number", "Cnumber=number", or [fraction fraction...]=number
		// It depends on the L: field, which may either not be present, or may appear after this.
		// If L: is not present, an eighth note is used.
		// That means that this field can't be calculated until the end, if it is the first three types, since we don't know if we'll see an L: field.
		// So, if it is the fourth type, set it here, otherwise, save the info in the multilineVars.
		// The temporary variables we keep are the duration and the bpm. In the first two forms, the duration is .
		// In addition, a quoted string may both precede and follow. If a quoted string is present, then the duration part is optional.
		try {
			const tokens = this.tokenizer.tokenize(line, start, end);

			if (tokens.length === 0) throw "Missing parameter in Q: field";

			const tempo: any = {};
			let delaySet = true;
			let token = tokens.shift();
			if (token.type === 'quote') {
				tempo.preString = token.token;
				token = tokens.shift();
				if (tokens.length === 0) {	// It's ok to just get a string for the tempo
					return { type: 'immediate', tempo: tempo };
				}
			}

			if (token.type === 'alpha' && token.token === 'C') { // either type 2 or type 
				if (tokens.length === 0) throw "Missing tempo after C in Q: field";
				token = tokens.shift();
				if (token.type === 'punct' && token.token === '=') {
					// This is a type 2 format. The duration is an implied 1
					if (tokens.length === 0) throw "Missing tempo after = in Q: field";
					token = tokens.shift();
					if (token.type !== 'number') throw "Expected number after = in Q: field";
					tempo.duration = [1];
					tempo.bpm = parseInt(token.token);
				} else if (token.type === 'number') {
					// This is a type 3 format.
					tempo.duration = [parseInt(token.token)];
					if (tokens.length === 0) throw "Missing = after duration in Q: field";
					token = tokens.shift();
					if (token.type !== 'punct' || token.token !== '=') throw "Expected = after duration in Q: field";
					if (tokens.length === 0) throw "Missing tempo after = in Q: field";
					token = tokens.shift();
					if (token.type !== 'number') throw "Expected number after = in Q: field";
					tempo.bpm = parseInt(token.token);
				} else throw "Expected number or equal after C in Q: field";

			} else if (token.type === 'number') {	// either type 1 or type 4
				let num = parseInt(token.token);
				if (tokens.length === 0 || tokens[0].type === 'quote') {
					// This is type 1
					tempo.duration = [1];
					tempo.bpm = num;
				} else { // This is type 4
					delaySet = false;
					token = tokens.shift();
					if (token.type !== 'punct' && token.token !== '/') throw "Expected fraction in Q: field";
					token = tokens.shift();
					if (token.type !== 'number') throw "Expected fraction in Q: field";
					let den = parseInt(token.token);
					tempo.duration = [num / den];
					// We got the first fraction, keep getting more as long as we find them.
					while (tokens.length > 0 && tokens[0].token !== '=' && tokens[0].type !== 'quote') {
						token = tokens.shift();
						if (token.type !== 'number') throw "Expected fraction in Q: field";
						num = parseInt(token.token);
						token = tokens.shift();
						if (token.type !== 'punct' && token.token !== '/') throw "Expected fraction in Q: field";
						token = tokens.shift();
						if (token.type !== 'number') throw "Expected fraction in Q: field";
						den = parseInt(token.token);
						tempo.duration.push(num / den);
					}
					token = tokens.shift();
					if (token.type !== 'punct' && token.token !== '=') throw "Expected = in Q: field";
					token = tokens.shift();
					if (token.type !== 'number') throw "Expected tempo in Q: field";
					tempo.bpm = parseInt(token.token);
				}
			} else throw "Unknown value in Q: field";

			if (tokens.length !== 0) {
				token = tokens.shift();
				if (token.type === 'quote') {
					tempo.postString = token.token;
					token = tokens.shift();
				}
				if (tokens.length !== 0) throw "Unexpected string at end of Q: field";
			}
			return { type: delaySet ? 'delaySet' : 'immediate', tempo: tempo };
		} catch (msg) {
			// Assuming `warn` is an external function
			this.warn(msg, line, start);
			return { type: 'none' };
		}
	}
	letter_to_inline_header(line: string, i: number): (number | string)[] {
		let ws = this.tokenizer.eatWhiteSpace(line, i);
		i += ws;
		if (line.length >= i + 5 && line[i] === '[' && line[i + 2] === ':') {
			let e = line.indexOf(']', i);
			switch (line.substring(i, i + 3)) {
				case "[I:":
					let err = this.addDirective(line.substring(i + 3, e));
					if (err) this.warn(err, line, i);
					return [e - i + 1 + ws];
				case "[M:":
					let meter = this.setMeter(line.substring(i + 3, e));
					if (this.tune.hasBeginMusic() && meter)
						this.tune.appendStartingElement('meter', -1, -1, meter);
					return [e - i + 1 + ws];
				case "[K:":
					let result = this.parseKey(line.substring(i + 3, e));
					if (result.foundClef && this.tune.hasBeginMusic())
						this.tune.appendStartingElement('clef', -1, -1, this.multilineVars.clef);
					if (result.foundKey && this.tune.hasBeginMusic())
						this.tune.appendStartingElement('key', -1, -1, this.fixKey(this.multilineVars.clef, this.multilineVars.key));
					return [e - i + 1 + ws];
				case "[P:":
					this.tune.appendElement('part', -1, -1, { title: line.substring(i + 3, e) });
					return [e - i + 1 + ws];
				case "[L:":
					this.setDefaultLength(line, i + 3, e);
					return [e - i + 1 + ws];
				case "[Q:":
					if (e > 0) {
						let tempo = this.setTempo(line, i + 3, e);
						if (tempo.type === 'delaySet')
							this.tune.appendElement('tempo', -1, -1, this.calcTempo(tempo.tempo));
						else if (tempo.type === 'immediate')
							this.tune.appendElement('tempo', -1, -1, tempo.tempo);
						return [e - i + 1 + ws, line[i + 1], line.substring(i + 3, e)];
					}
					break;
				case "[V:":
					if (e > 0) {
						this.parseVoice(line, i + 3, e);
						return [e - i + 1 + ws, line[i + 1], line.substring(i + 3, e)];
					}
					break;
				default:
				// TODO: complain about unhandled header
			}
		}
		return [0];
	}

	letter_to_body_header(line: string, i: number): (number | string)[] {
		if (line.length >= i + 3) {
			switch (line.substring(i, i + 2)) {
				case "I:":
					let err = this.addDirective(line.substring(i + 2));
					if (err) this.warn(err, line, i);
					return [line.length];
				case "M:":
					let meter = this.setMeter(line.substring(i + 2));
					if (this.tune.hasBeginMusic() && meter)
						this.tune.appendStartingElement('meter', -1, -1, meter);
					return [line.length];
				case "K:":
					let result = this.parseKey(line.substring(i + 2));
					if (result.foundClef && this.tune.hasBeginMusic())
						this.tune.appendStartingElement('clef', -1, -1, this.multilineVars.clef);
					if (result.foundKey && this.tune.hasBeginMusic())
						this.tune.appendStartingElement('key', -1, -1, this.fixKey(this.multilineVars.clef, this.multilineVars.key));
					return [line.length];
				case "P:":
					if (this.tune.hasBeginMusic())
						this.tune.appendElement('part', -1, -1, { title: line.substring(i + 2) });
					return [line.length];
				case "L:":
					this.setDefaultLength(line, i + 2, line.length);
					return [line.length];
				case "Q:":
					let e = line.indexOf('\x12', i + 2);
					if (e === -1) e = line.length;
					let tempo = this.setTempo(line, i + 2, e);
					if (tempo.type === 'delaySet')
						this.tune.appendElement('tempo', -1, -1, this.calcTempo(tempo.tempo));
					else if (tempo.type === 'immediate')
						this.tune.appendElement('tempo', -1, -1, tempo.tempo);
					return [e, line[i], line.substring(i + 2).trim()];
				case "V:":
					this.parseVoice(line, 2, line.length);
					return [line.length, line[i], line.substring(i + 2).trim()];
				default:
				// TODO: complain about unhandled header
			}
		}
		return [0];
	}

	metaTextHeaders = {
		A: 'author',
		B: 'book',
		C: 'composer',
		D: 'discography',
		F: 'url',
		I: 'instruction',
		N: 'notes',
		O: 'origin',
		R: 'rhythm',
		S: 'source',
		W: 'unalignedWords',
		Z: 'transcription'
	};

	parseHeader(line: string): {} | { recurse: boolean, str: string } | { newline: boolean } | { regular: boolean, str: string } | { words: boolean } {
		if (line.startsWith('%%')) {
			let err = this.addDirective(line.substring(2));
			if (err) this.warn(err, line, 2);
			return {};
		}

		line = this.tokenizer.stripComment(line);
		if (line.length === 0)
			return {};

		if (line.length >= 2) {
			if (line[1] === ':') {
				let nextLine = "";
				if (line.indexOf('\x12') >= 0 && line[0] !== 'w') {	// w: is the only header field that can have a continuation.
					nextLine = line.substring(line.indexOf('\x12') + 1);
					line = line.substring(0, line.indexOf('\x12'));	//This handles a continuation mark on a header field
				}
				let field = this.metaTextHeaders[line[0]];
				if (field !== undefined) {
					this.tune.addMetaText(field, this.tokenizer.translateString(this.tokenizer.stripComment(line.substring(2))));
					return {};
				} else {
					switch (line[0]) {
						case 'H':
							this.tune.addMetaText("history", this.tokenizer.translateString(this.tokenizer.stripComment(line.substring(2))));
							this.multilineVars.is_in_history = true;
							break;
						case 'K':
							// since the key is the last thing that can happen in the header, we can resolve the tempo now
							this.resolveTempo();
							let result = this.parseKey(line.substring(2));
							if (!this.multilineVars.is_in_header && this.tune.hasBeginMusic()) {
								if (result.foundClef)
									this.tune.appendStartingElement('clef', -1, -1, this.multilineVars.clef);
								if (result.foundKey)
									this.tune.appendStartingElement('key', -1, -1, this.fixKey(this.multilineVars.clef, this.multilineVars.key));
							}
							this.multilineVars.is_in_header = false;	// The first key signifies the end of the header.
							break;
						case 'L':
							this.setDefaultLength(line, 2, line.length);
							break;
						case 'M':
							this.multilineVars.origMeter = this.multilineVars.meter = this.setMeter(line.substring(2));
							break;
						case 'P':
							// TODO-PER: There is more to do with parts, but the writer doesn't care.
							if (this.multilineVars.is_in_header)
								this.tune.addMetaText("partOrder", this.tokenizer.translateString(this.tokenizer.stripComment(line.substring(2))));
							else
								this.multilineVars.partForNextLine = this.tokenizer.translateString(this.tokenizer.stripComment(line.substring(2)));
							break;
						case 'Q':
							let tempo = this.setTempo(line, 2, line.length);
							if (tempo.type === 'delaySet') this.multilineVars.tempo = tempo.tempo;
							else if (tempo.type === 'immediate') this.tune.metaText.tempo = tempo.tempo;
							break;
						case 'T':
							this.setTitle(line.substring(2));
							break;
						case 'U':
							this.addUserDefinition(line, 2, line.length);
							break;
						case 'V':
							this.parseVoice(line, 2, line.length);
							if (!this.multilineVars.is_in_header)
								return { newline: true };
							break;
						case 'w':
							return { words: true };
							break;
						case 'X':
							break;
						case 'E':
						case 'm':
							this.warn("Ignored header", line, 0);
							break;
						default:
							// It wasn't a recognized header value, so parse it as music.
							if (nextLine.length)
								nextLine = "\x12" + nextLine;
							//parseRegularMusicLine(line+nextLine);
							//nextLine = "";
							return { regular: true, str: line + nextLine };
					}
				}
				if (nextLine.length > 0)
					return { recurse: true, str: nextLine };
				return {};
			}
		}

		// If we got this far, we have a regular line of mulsic
		return { regular: true, str: line };
	};
}

