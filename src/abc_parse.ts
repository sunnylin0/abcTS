//    abc_parse.js: parses a string representing ABC Music Notation into a usable internal structure.
//    Copyright (C) 2010 Paul Rosen (paul at paulrosen dot net)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*global Class */
/*global AbcParseHeader, AbcTokenizer, AbcTune */
/*extern AbcParse */

//declare class AbcParse {
//	constructor();

//	getTune(): AbcTune;

//	parse(strTune: string): void;

//	getWarnings(): string[];
//}

//declare class AbcTune {
//	reset(): void;
//	getNumLines(): number;
//	startNewLine(params: {
//		startChar: number;
//		endChar: number;
//		part?: string;
//		clef?: { type: string; middle?: number };
//		key?: { extraAccidentals: any[]; };
//		meter?: { type: string; value: { num: string; den: string }[]; };
//		name?: string;
//		vocalfont?: any;
//		brace?: boolean;
//		bracket?: boolean;
//		connectBarLines?: boolean;
//		subname?: string;
//		stem?: any;
//	}): void;
//	appendElement(type: string, start: number, end: number, element: any): void;
//	addMetaText(type: string, text: string): void;
//	addTieToLastNote(): void;
//	getCurrentVoice(): any;
//	cleanUp(): void;
//}

//declare class AbcTokenizer {
//	getBrackettedSubstring(line: string, start: number, maxLen: number, endChar?: string): number, string, string];
//getBarLine(line: string, startPos: number): { len: number; token: string; warn ?: string; };
//getTokenOf(str: string, chars: string): { len: number; token: string; };
//isWhiteSpace(char: string): boolean;
//getFraction(line: string, start: number): { value: number; index: number; };
//stripComment(line: string): string;
//translateString(str: string): string;
//}

//declare class AbcParseHeader {
//	constructor(tokenizer: AbcTokenizer, warn: (str: string, line: string, col_num: number) => void, multilineVars: any, tune: AbcTune);
//	resolveTempo(): void;
//	letter_to_body_header(line: string, i: number): [number, any];
//letter_to_inline_header(line: string, i: number): [number, any];
//parseHeader(line: string): { regular: boolean; newline: boolean; words ?: string; recurse ?: string; str ?: string; };
//}


//declare function addWarning(str: string): void;
//declare function warn(str: string, line: string, col_num: number): void;

//declare namespace pitches {
//	const A: number;
//	const B: number;
//	const C: number;
//	const D: number;
//	const E: number;
//	const F: number;
//	const G: number;
//	const a: number;
//	const b: number;
//	const c: number;
//	const d: number;
//	const e: number;
//	const f: number;
//	const g: number;
//}

//declare namespace rests {
//	const x: string;
//	const y: string;
//	const z: string;
//}
//interface MultilineVars {
//	key: { regularKey: KeySignature };
//	meter: MeterElement;
//	hasMainTitle: boolean;
//	clef: { type: string, middle: number };
//	titlecaps: boolean;
//	score_is_present: boolean;
//	staves: any[];
//	voices: { [key: string]: any };
//	currentVoice: any;
//	macros: { [key: string]: string };
//	origMeter: any;
//	inTextBlock: boolean;
//	barNumbers: number;
//}

class MultilineVars {
	iChar: number;
	key: { regularKey: KeySignature };
	meter: MeterElement;
	hasMainTitle: boolean;
	default_length: number;
	tempo: TempoInfo;
	clef: { type: string, middle: number };
	next_note_duration: number;
	start_new_line: boolean;
	is_in_header: boolean;
	is_in_history: boolean;
	partForNextLine: string;
	havent_set_length: boolean;
	warnings: any;
	titlecaps: boolean;
	score_is_present: boolean;
	staves: any[];
	voices: { [key: string]: any };
	currentVoice: any;
	macros: { [key: string]: string };
	origMeter: any;
	currBarNumber: number;
	inTextBlock: boolean;
	textBlock: string;
	barNumbers: number;
	reset() {
		for (let property in this) {
			if (this.hasOwnProperty(property) && typeof this[property] !== "function") {
				delete this[property];
			}
		}
		this.iChar = 0;
		this.key = { extraAccidentals: [] };
		this.meter = { type: 'specified', value: [{ num: '4', den: '4' }] };	// if no meter is specified, there is an implied one.
		this.origMeter = { type: 'specified', value: [{ num: '4', den: '4' }] };	// this is for new voices that are created after we set the meter.
		this.hasMainTitle = false;
		this.default_length = 0.125;
		this.clef = { type: 'treble', middle: 6 };
		this.next_note_duration = 0;
		this.start_new_line = true;
		this.is_in_header = true;
		this.is_in_history = false;
		this.partForNextLine = "";
		this.havent_set_length = true;
		this.voices = {};
		this.staves = [];
		this.macros = {};
		this.currBarNumber = 1;
		this.inTextBlock = false;
		this.textBlock = "";
		this.score_is_present = false;	// Can't have original V: lines when there is the score directive
	}
};


class AbcParse {
	tune: AbcTune;
	tokenizer: AbcTokenizer;
	multilineVars: MultilineVars;
	pitches = { A: 5, B: 6, C: 0, D: 1, E: 2, F: 3, G: 4, a: 12, b: 13, c: 7, d: 8, e: 9, f: 10, g: 11 };
	rests = { x: 'invisible', y: 'spacer', z: 'rest' };
	private header: AbcParseHeader;

	legalAccents = ["trill", "lowermordent", "uppermordent", "mordent", "pralltriller", "accent",
		"emphasis", "fermata", "invertedfermata", "tenuto", "0", "1", "2", "3", "4", "5", "+", "wedge",
		"open", "thumb", "snap", "turn", "roll", "breath", "shortphrase", "mediumphrase", "longphrase",
		"segno", "coda", "D.S.", "D.C.", "fine", "crescendo(", "crescendo)", "diminuendo(", "diminuendo)",
		"p", "pp", "f", "ff", "mf", "ppp", "pppp", "fff", "ffff", "sfz", "repeatbar", "repeatbar2", "slide",
		"upbow", "downbow"];

	constructor() {
		this.tune = new AbcTune();
		this.tokenizer = new AbcTokenizer();
		this.multilineVars = new MultilineVars();
		this.header = new AbcParseHeader(this.tokenizer, this.warn, this.multilineVars, this.tune);
	}
	getTune() {
		return this.tune;
	};
	getWarnings() {
		return this.multilineVars.warnings;
	};

	private addWarning(str: string) {
		if (!this.multilineVars.warnings) {
			this.multilineVars.warnings = [];
		}
		this.multilineVars.warnings.push(str);
	};

	private warn(str: string, line: string, col_num: number) {
		let bad_char = line[col_num];
		if (bad_char === ' ') {
			bad_char = "SPACE";
		}
		let clean_line = line.substring(0, col_num).replace(/\x12/g, ' ') + '\n' + bad_char + '\n' + line.substring(col_num + 1).replace(/\x12/g, ' ');
		clean_line = clean_line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<span style="text-decoration:underline;font-size:1.3em;font-weight:bold;">').replace(/\n/g, '</span>');
		this.addWarning(`Music Line:${this.tune.getNumLines()}:${col_num + 1}: ${str}: ${clean_line}`);
	};



	private letter_to_chord(line: string, i: number) {
		if (line[i] === '"') {
			let chord = this.tokenizer.getBrackettedSubstring(line, i, 5);
			if (!chord[2])
				this.warn("Missing the closing quote while parsing the chord symbol", line, i);
			// If it starts with ^, then the chord appears above.
			// If it starts with _ then the chord appears below.
			// (note that the 2.0 draft standard defines them as not chords, but annotations and also defines < > and @.)
			if (chord[0] > 0 && chord[1].length > 0 && chord[1][0] === '^') {
				chord[1] = chord[1].substring(1);
				chord[2] = 'above';
			} else if (chord[0] > 0 && chord[1].length > 0 && chord[1][0] === '_') {
				chord[1] = chord[1].substring(1);
				chord[2] = 'below';
			} else
				chord[2] = 'default';
			return chord;
		}
		return [0, ""];
	};


	private letter_to_accent(line: string, i: number) {
		let macro = this.multilineVars.macros[line[i]];

		if (macro !== undefined) {
			if (macro[0] === '!' || macro[0] === '+')
				macro = macro.substring(1);
			if (macro[macro.length - 1] === '!' || macro[macro.length - 1] === '+')
				macro = macro.substring(0, macro.length - 1);
			if (this.legalAccents.includes(macro))
				return [1, macro];

		}
		switch (line[i]) {
			case '.': return [1, 'staccato'];
			case 'u': return [1, 'upbow'];
			case 'v': return [1, 'downbow'];
			case '~': return [1, 'roll'];
			case '!':
			case '+':
				let ret = this.tokenizer.getBrackettedSubstring(line, i, 5);
				// Be sure that the accent is recognizable.
				if (ret[1].length > 0 && (ret[1][0] === '^' || ret[1][0] === '_'))
					ret[1] = ret[1].substring(1);	// TODO-PER: The test files have indicators forcing the orniment to the top or bottom, but that isn't in the standard. We'll just ignore them.

				if (this.legalAccents.includes(ret[1])) {
					return ret;
				}
				// We didn't find the accent in the list, so consume the space, but don't return an accent.
				// Although it is possible that ! was used as a line break, so accept that.
				if (line[i] === '!' && (ret[0] === 1 || line[i + ret[0] - 1] !== '!'))
					return [1, null];
				this.warn("Unknown decoration: " + ret[1], line, i);
				ret[1] = "";
				return ret;
			case 'H': return [1, 'fermata'];
			case 'J': return [1, 'slide'];
			case 'M': return [1, 'mordent'];
			case 'R': return [1, 'roll'];
			case 'T': return [1, 'trill'];
		}
		return [0, 0];
	};



	letter_to_spacer(line: string, i: number) {
		let start = i;
		while (this.tokenizer.isWhiteSpace(line[i])) {
			i++;
		}
		return [i - start];
	};

	// returns the class of the bar line
	// the number of the repeat
	// and the number of characters used up
	// if 0 is returned, then the next element was not a bar line
	letter_to_bar(line: string, curr_pos: number) {
		let ret = this.tokenizer.getBarLine(line, curr_pos);
		if (ret.len === 0) {
			return [0, ""];
		}
		if (ret.warn) {
			this.warn(ret.warn, line, curr_pos);
			return [ret.len, ""];
		}

		// Now see if this is a repeated ending
		// A repeated ending is all of the characters 1,2,3,4,5,6,7,8,9,0,-, and comma
		// It can also optionally start with '[', which is ignored.
		// Also, it can have white space before the '['.
		let ws = 0;
		for (ws = 0; ws < line.length; ws++) {
			if (line[curr_pos + ret.len + ws] !== ' ') {
				break;
			}
		}
		let orig_bar_len = ret.len;
		if (line[curr_pos + ret.len + ws] === '[') {
			ret.len += ws + 1;
			// It can also be a quoted string. It is unclear whether that construct requires '[', but it seems like it would. otherwise it would be confused with a regular chord.
			if (line[curr_pos + ret.len] === '"') {
				let ending = this.tokenizer.getBrackettedSubstring(line, curr_pos + ret.len, 5);
				return [ret.len + ending[0], ret.token, ending[1]];
			}
		}
		let retRep = this.tokenizer.getTokenOf(line.substring(curr_pos + ret.len), "1234567890-,");
		if (retRep.len === 0) {
			return [orig_bar_len, ret.token];
		}

		return [ret.len + retRep.len, ret.token, retRep.token];
	};

	letter_to_open_slurs_and_triplets(line: string, i: number): { consumed?: number; } {
		// consume spaces, and look for all the open parens. If there is a number after the open paren,
		// that is a triplet. Otherwise that is a slur. Collect all the slurs and the first triplet.
		let ret: ABCElement = {};
		let start = i;
		while (line[i] === '(' || this.tokenizer.isWhiteSpace(line[i])) {
			if (line[i] === '(') {
				if (i + 1 < line.length && (line[i + 1] >= '2' && line[i + 1] <= '9')) {
					if (ret.triplet !== undefined)
						this.warn("Can't nest triplets", line, i);
					else {
						ret.triplet = line[i + 1] - '0';
						if (i + 2 < line.length && line[i + 2] === ':') {
							// We are expecting "(p:q:r" or "(p:q" or "(p::r" we are only interested in the first number (p) and the number of notes (r)
							// if r is missing, then it is equal to p.
							if (i + 3 < line.length && line[i + 3] === ':') {
								if (i + 4 < line.length && (line[i + 4] >= '1' && line[i + 4] <= '9')) {
									ret.num_notes = line[i + 4] - '0';
									i += 3;
								} else
									this.warn("expected number after the two colons after the triplet to mark the duration", line, i);
							} else if (i + 3 < line.length && (line[i + 3] >= '1' && line[i + 3] <= '9')) {
								// ignore this middle number
								if (i + 4 < line.length && line[i + 4] === ':') {
									if (i + 5 < line.length && (line[i + 5] >= '1' && line[i + 5] <= '9')) {
										ret.num_notes = line[i + 5] - '0'.toNumber();
										i += 4;
									}
								} else {
									ret.num_notes = ret.triplet;
									i += 3;
								}
							} else
								warn("expected number after the triplet to mark the duration", line, i);
						}
					}
					i++;
				} else {
					if (ret.startSlur === undefined)
						ret.startSlur = 1;
					else
						ret.startSlur++;
				}
			}
			i++;
		}
		ret.consumed = i - start;
		return ret;
	};

	addWords(line: Voice[], words: string) {
		if (!line) {
			this.warn("Can't add words before the first line of music", line, 0);
			return;
		}
		words = words.trim();
		if (words[words.length - 1] !== '-') {
			words += ' ';	// Just makes it easier to parse below, since every word has a divider after it.
		}
		let word_list = [];
		// first make a list of words from the string we are passed. A word is divided on either a space or dash.
		let last_divider = 0;
		let replace = false;
		const addWord = (i: number) => {
			let word = words.substring(last_divider, i).trim();
			last_divider = i + 1;
			if (word.length > 0) {
				if (replace) {
					word = word.replace(/~/g, ' ');
				}
				let div = words[i];
				if (div !== '_' && div !== '-') {
					div = ' ';
				}
				word_list.push({ syllable: this.tokenizer.translateString(word), divider: div });
				replace = false;
				return true;
			}
			return false;
		};
		for (let i = 0; i < words.length; i++) {
			switch (words[i]) {
				case ' ':
				case '\x12':
					addWord(i);
					break;
				case '-':
					if (!addWord(i) && word_list.length > 0) {
						word_list[word_list.length - 1].divider = '-';
						word_list.push({ skip: true, to: 'next' });
					}
					break;
				case '_':
					addWord(i);
					word_list.push({ skip: true, to: 'slur' });
					break;
				case '*':
					addWord(i);
					word_list.push({ skip: true, to: 'next' });
					break;
				case '|':
					addWord(i);
					word_list.push({ skip: true, to: 'bar' });
					break;
				case '~':
					replace = true;
					break;
			}
		}

		let inSlur = false;
		line.split('').forEach((el, index) => {
			if (word_list.length !== 0) {
				if (word_list[0].skip) {
					switch (word_list[0].to) {
						case 'next':
							if (el.el_type === 'note' && el.pitches !== null && !inSlur)
								word_list.shift();
							break;
						case 'slur':
							if (el.el_type === 'note' && el.pitches !== null)
								word_list.shift();
							break;
						case 'bar':
							if (el.el_type === 'bar')
								word_list.shift();
							break;
					}
				} else {
					if (el.el_type === 'note' && el.rest === undefined && !inSlur) {
						let lyric = word_list.shift();
						if (el.lyric === undefined) {
							el.lyric = [lyric];
						} else {
							el.lyric.push(lyric);
						}
					}
				}
			}
		});
	};

	getBrokenRhythm(line: string, index: number) {
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
	};

	// TODO-PER: make this a method in el.
	addEndBeam(el: any) {
		if (el.duration !== undefined && el.duration < 0.25) {
			el.end_beam = true;
		}
		return el;
	};

	getCoreNote(line: string, index: number, el: any, canHaveBrokenRhythm: boolean) {
		const isComplete = (state: string) => {
			return (state === 'octave' || state === 'duration' || state === 'broken_rhythm' || state === 'end_slur');
		};

		let state = 'startSlur';
		let durationSetByPreviousNote = false;
		while (true) {
			switch (line[index]) {
				case '(':
					if (state === 'startSlur') {
						if (el.startSlur === undefined)
							el.startSlur = 1;
						else
							el.startSlur++;
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					}
					else return null;
					break;
				case ')':
					if (isComplete(state)) {
						if (el.endSlur === undefined)
							el.endSlur = 1;
						else
							el.endSlur++;
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
					} else
						return null;
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
					} else
						return null;
					break;
				case '=':
					if (state === 'startSlur') {
						el.accidental = 'natural';
						state = 'pitch';
					} else if (isComplete(state)) {
						el.endChar = index;
						return el;
					} else
						return null;
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
						if (canHaveBrokenRhythm && this.multilineVars.next_note_duration !== 0) {
							el.duration = this.multilineVars.next_note_duration;
							this.multilineVars.next_note_duration = 0;
							durationSetByPreviousNote = true;
						} else
							el.duration = this.multilineVars.default_length;

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
						el.rest = { type: this.rests[line[index]] };
						// There shouldn't be some of the properties that notes have. If some sneak in due to bad syntax in the abc file,
						// just nix them here.
						delete el.accidental;
						delete el.startSlur;
						delete el.startTie;
						delete el.endSlur;
						delete el.endTie;
						delete el.end_beam;
						delete el.grace_notes;
						// At this point we have a valid note. The rest is optional. Set the duration in case we don't get one below
						if (canHaveBrokenRhythm && this.multilineVars.next_note_duration !== 0) {
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
						let fraction = this.tokenizer.getFraction(line, index);
						if (!durationSetByPreviousNote) {
							el.duration = el.duration * fraction.value;
						}
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
					} else if (state === 'sharp2') {
						el.accidental = 'quartersharp';
						state = 'pitch';
					} else if (state === 'flat2') {
						el.accidental = 'quarterflat';
						state = 'pitch';
					} else {
						return null;
					}
					break;
				case '-':
					if (state === 'startSlur') {
						// This is the first character, so it must have been meant for the previous note. Correct that here.
						this.tune.addTieToLastNote();
						el.endTie = true;
					} else if (state === 'octave' || state === 'duration' || state === 'end_slur') {
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
						el.end_beam = true;
						// look ahead to see if there is a tie
						while (index < line.length && (this.tokenizer.isWhiteSpace(line[index]) || line[index] === '-')) {
							if (line[index] === '-')
								el.startTie = true;

							index++;
						}
						el.endChar = index;
						if (!durationSetByPreviousNote && canHaveBrokenRhythm && (line[index] === '<' || line[index] === '>')) {
							index--;
							state = 'broken_rhythm';
						} else
							return el;
					} else
						return null;
					break;
				case '>':
				case '<':
					if (isComplete(state)) {
						if (canHaveBrokenRhythm) {
							let br2 = this.getBrokenRhythm(line, index);
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

	startNewLine() {
		let params: ParamsOther = { startChar: -1, endChar: -1 };
		if (this.multilineVars.partForNextLine.length) {
			params.part = this.multilineVars.partForNextLine;
		}
		params.clef = this.multilineVars.currentVoice &&
			this.multilineVars.staves[this.multilineVars.currentVoice.staffNum].clef !== undefined ?
			this.multilineVars.staves[this.multilineVars.currentVoice.staffNum].clef :
			this.multilineVars.clef;
		params.key = Object.assign({}, this.multilineVars.key);
		this.header.addPosToKey(params.clef, params.key);
		if (this.multilineVars.meter !== null) {
			if (this.multilineVars.currentVoice) {
				this.multilineVars.staves.forEach(st => {
					st.meter = this.multilineVars.meter;
				});
				params.meter = this.multilineVars.staves[this.multilineVars.currentVoice.staffNum].meter;
				this.multilineVars.staves[this.multilineVars.currentVoice.staffNum].meter = null;
			} else {
				params.meter = this.multilineVars.meter;
				this.multilineVars.meter = null;
			}
		} else if (this.multilineVars.currentVoice && this.multilineVars.staves[this.multilineVars.currentVoice.staffNum].meter) {
			// Make sure that each voice gets the meter marking.
			params.meter = this.multilineVars.staves[this.multilineVars.currentVoice.staffNum].meter;
			this.multilineVars.staves[this.multilineVars.currentVoice.staffNum].meter = null;
		}
		if (this.multilineVars.currentVoice && this.multilineVars.currentVoice.name) {
			params.name = this.multilineVars.currentVoice.name;
		}
		if (this.multilineVars.vocalfont) {
			params.vocalfont = this.multilineVars.vocalfont;
		}
		if (this.multilineVars.currentVoice) {
			let staff = this.multilineVars.staves[this.multilineVars.currentVoice.staffNum];
			if (staff.brace) params.brace = staff.brace;
			if (staff.bracket) params.bracket = staff.bracket;
			if (staff.connectBarLines) params.connectBarLines = staff.connectBarLines;
			if (staff.name) params.name = staff.name[this.multilineVars.currentVoice.index];
			if (staff.subname) params.subname = staff.subname[this.multilineVars.currentVoice.index];
			if (this.multilineVars.currentVoice.stem)
				params.stem = this.multilineVars.currentVoice.stem;

		}
		this.tune.startNewLine(params);

		this.multilineVars.partForNextLine = "";
		if (this.multilineVars.currentVoice === undefined ||
			(this.multilineVars.currentVoice.staffNum === this.multilineVars.staves.length - 1 &&
				this.multilineVars.staves[this.multilineVars.currentVoice.staffNum].numVoices - 1 === this.multilineVars.currentVoice.index)) {
			if (this.multilineVars.barNumbers === 0)
				this.multilineVars.barNumOnNextNote = this.multilineVars.currBarNumber;
		}
	};

	letter_to_grace(line: string, i: number): [number, any] {
		// Grace notes are an array of: startslur, note, endslur, space; where note is accidental, pitch, duration
		if (line[i] === '{') {
			// fetch the gracenotes string and consume that into the array
			const gra = this.tokenizer.getBrackettedSubstring(line, i, 1, '}');
			if (!gra[2])
				this.warn("Missing the closing '}' while parsing grace note", line, i);


			const gracenotes: any = [];
			let ii = 0;
			let inTie = false;
			while (ii < gra[1].length) {
				const note = this.getCoreNote(gra[1], ii, {}, false);
				if (note !== null) {
					gracenotes.push(note);

					if (inTie) {
						note.endTie = true;
						inTie = false;
					}
					if (note.startTie)
						inTie = true;

					ii = note.endChar;
					delete note.endChar;
				} else {
					// We shouldn't get anything but notes or a space here, so report an error
					if (gra[1][ii] === ' ') {
						if (gracenotes.length > 0)
							gracenotes[gracenotes.length - 1].end_beam = true;
					} else
						this.warn("Unknown character '" + gra[1][ii] + "' while parsing grace note", line, i);
					ii++;
				}
			}
			if (gracenotes.length)
				return [gra[0], gracenotes];

		}
		return [0];
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
	nonDecorations = "ABCDEFGabcdefg[]|^_{";	// use this to prescreen so we don't have to look for a decoration at every note.


	parseRegularMusicLine(line: string): void {
		this.header.resolveTempo();
		this.multilineVars.is_in_header = false;	// We should have gotten a key header by now, but just in case, this is definitely out of the header.
		let i = 0;
		let startOfLine = this.multilineVars.iChar;

		// Skip leading whitespaces and ignore lines with only a comment
		while (this.tokenizer.isWhiteSpace(line[i]) && i < line.length)
			i++;

		if (i === line.length || line[i] === '%')
			return;


		this.multilineVars.start_new_line = true;
		let tripletNotesLeft = 0;
		let inTie = false;
		let inTieChord: { [key: number]: boolean } = {};

		// Check for a header field at the start of the line
		const retHeader = this.header.letter_to_body_header(line, i);
		if (retHeader[0] > 0) {
			i += retHeader[0];
			// TODO-PER: Handle inline headers
		}

		let el: any = {};

		while (i < line.length) {
			const startI = i;
			if (line[i] === '%') {
				break;
			}

			const retInlineHeader = this.header.letter_to_inline_header(line, i);
			if (retInlineHeader[0] > 0) {
				i += retInlineHeader[0];
				// TODO-PER: Handle inline headers
				//multilineVars.start_new_line = false;
			} else {
				// Wait until here to actually start the line because we know we're past the inline statements.
				if (this.multilineVars.start_new_line) {
					this.startNewLine();
					this.multilineVars.start_new_line = false;
				}
				// We need to decide if the following characters are a bar-marking or a note-group.
				// Unfortunately, that is ambiguous. Both can contain chord symbols and decorations.
				// If there is a grace note either before or after the chord symbols and decorations, then it is definitely a note-group.
				// If there is a bar marker, it is definitely a bar-marking.
				// If there is either a core-note or chord, it is definitely a note-group.
				// So, loop while we find grace-notes, chords-symbols, or decorations. [It is an error to have more than one grace-note group in a row; the others can be multiple]
				// Then, if there is a grace-note, we know where to go.
				// Else see if we have a chord, core-note, slur, triplet, or bar.
				let ret: any;

				while (1) {
					ret = this.tokenizer.eatWhiteSpace(line, i);
					if (ret > 0) {
						i += ret;
					}
					if (i > 0 && line[i - 1] === '\x12') {
						// there is one case where a line continuation isn't the same as being on the same line, and that is if the next character after it is a header.
						ret = this.header.letter_to_body_header(line, i);
						if (ret[0] > 0) {
							// TODO: insert header here
							i = ret[0];
							this.multilineVars.start_new_line = false;
						}
					}
					// gather all the grace notes, chord symbols and decorations
					ret = this.letter_to_spacer(line, i);
					if (ret[0] > 0) {
						i += ret[0];
					}

					ret = this.letter_to_chord(line, i);
					if (ret[0] > 0) {
						// TODO-PER: There could be more than one chord here if they have different positions.
						el.chord = { name: this.tokenizer.translateString(ret[1]), position: ret[2] };
						i += ret[0];
						i += this.tokenizer.skipWhiteSpace(line.substring(i));
					} else {
						if (this.nonDecorations.indexOf(line[i]) === -1)
							ret = this.letter_to_accent(line, i);
						else ret = [0];
						if (ret[0] > 0) {
							if (ret[1] === null) {
								if (i + 1 < line.length)
									this.startNewLine();	// There was a ! in the middle of the line. Start a new line if there is anything after it.
							} else if (ret[1].length > 0) {
								if (el.decoration === undefined)
									el.decoration = [];

								el.decoration.push(ret[1]);
							}
							i += ret[0];
						} else {
							ret = this.letter_to_grace(line, i);
							// TODO-PER: Be sure there aren't already grace notes defined. That is an error.
							if (ret[0] > 0) {
								el.gracenotes = ret[1];
								i += ret[0];
							} else {
								break;
							}
						}
					}
				}

				ret = this.letter_to_bar(line, i);
				if (ret[0] > 0) {
					// This is definitely a bar
					if (el.gracenotes !== undefined) {
						// Attach the grace note to an invisible note
						el.rest = { type: 'spacer' };
						el.duration = 0.125; // TODO-PER: I don't think the duration of this matters much, but figure out if it does.
						this.tune.appendElement('note', -1, -1, el);
						el = {};
					}
					const bar = { type: ret[1] };
					if (bar.type.length === 0) {
						this.warn("Unknown bar type", line, i);
					} else {
						if (ret[2]) {
							bar.ending = ret[2];
						}
						if (el.decoration !== undefined) {
							bar.decoration = el.decoration;
						}
						if (el.chord !== undefined) {
							bar.chord = el.chord;
						}
						if (bar.type !== 'bar_invisible') {
							this.multilineVars.currBarNumber++;
							if (this.multilineVars.barNumbers && this.multilineVars.currBarNumber % this.multilineVars.barNumbers === 0) {
								this.multilineVars.barNumOnNextNote = this.multilineVars.currBarNumber;
							}
						}
						this.tune.appendElement('bar', startOfLine + i, startOfLine + i + ret[0], bar);
						el = {};
					}
					i += ret[0];
				} else {
					// This is definitely a note group
					ret = this.letter_to_open_slurs_and_triplets(line, i);
					if (ret.consumed > 0) {
						if (ret.startSlur !== undefined) {
							el.startSlur = ret.startSlur;
						}
						if (ret.triplet !== undefined) {
							if (tripletNotesLeft > 0) {
								this.warn("Can't nest triplets", line, i);
							} else {
								el.startTriplet = ret.triplet;
								tripletNotesLeft = ret.num_notes === undefined ? ret.triplet : ret.num_notes;
							}
						}
						i += ret.consumed;
					}

					// Handle chords
					if (line[i] === '[') {
						i++;
						let chordDuration: number | null = null;
						let done = false;
						while (!done) {
							const chordNote = this.getCoreNote(line, i, {}, false);
							if (chordNote !== null) {
								if (chordNote.end_beam) {
									el.end_beam = true;
									delete chordNote.end_beam;
								}
								if (el.pitches === undefined) {
									el.duration = chordNote.duration;
									el.pitches = [chordNote];
								} else 	// Just ignore the note lengths of all but the first note. The standard isn't clear here, but this seems less confusing.
									el.pitches.push(chordNote);
								delete chordNote.duration;

								if (inTieChord[el.pitches.length]) {
									chordNote.endTie = true;
									inTieChord[el.pitches.length] = undefined;
								}
								if (chordNote.startTie) {
									inTieChord[el.pitches.length] = true;
								}
								i = chordNote.endChar;
								delete chordNote.endChar;
							} else if (line[i] === ' ') {
								this.warn("Spaces are not allowed in chords", line, i);
								i++;
							} else {
								if (i < line.length && line[i] === ']') {
									// consume the close bracket
									i++;

									if (this.multilineVars.next_note_duration !== 0) {
										el.duration = el.duration * this.multilineVars.next_note_duration;
										this.multilineVars.next_note_duration = 0;
									}

									if (inTie) {
										el.pitches.forEach(pitch => { pitch.endTie = true; });
										inTie = false;
									}

									if (tripletNotesLeft > 0) {
										tripletNotesLeft--;
										if (tripletNotesLeft === 0) {
											el.endTriplet = true;
										}
									}

									if (el.startSlur !== undefined) {
										el.pitches.forEach(pitch => {
											if (pitch.startSlur === undefined) {
												pitch.startSlur = el.startSlur;
											} else {
												pitch.startSlur += el.startSlur;
											}
										});
										delete el.startSlur;
									}

									let postChordDone = false;
									while (i < line.length && !postChordDone) {
										switch (line[i]) {
											case ' ':
											case '\t':
												this.addEndBeam(el);
												break;
											case ')':
												el.pitches.forEach(pitch => {
													if (pitch.endSlur === undefined) {
														pitch.endSlur = 1;
													} else {
														pitch.endSlur++;
													}
												});
												break;
											case '-':
												el.pitches.forEach(pitch => { pitch.startTie = true; });
												inTie = true;
												break;
											case '>':
											case '<':
												const br2 = this.getBrokenRhythm(line, i);
												i += br2[0] - 1;	// index gets incremented below, so we'll let that happen
												this.multilineVars.next_note_duration = br2[2];
												chordDuration = br2[1];
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
											case '/':
												const fraction = this.tokenizer.getFraction(line, i);
												chordDuration = fraction.value;
												i = fraction.index;
												postChordDone = true;
												break;
											default:
												postChordDone = true;
												break;
										}
										if (!postChordDone) {
											i++;
										}
									}
								} else
									this.warn("Expected ']' to end the chords", line, i);


								if (el.pitches !== undefined) {
									if (chordDuration !== null) {
										el.duration = el.duration * chordDuration;
									}
									if (this.multilineVars.barNumOnNextNote) {
										el.barNumber = this.multilineVars.barNumOnNextNote;
										this.multilineVars.barNumOnNextNote = null;
									}
									this.tune.appendElement('note', startOfLine + i, startOfLine + i, el);
									el = {};
								}
								done = true;
							}
						}
					} else {
						// Single pitch
						const el2: any = {};
						const core = this.getCoreNote(line, i, el2, true);
						if (el.endTie !== undefined) {
							inTie = true;
						}
						if (core !== null) {
							if (core.pitch !== undefined) {
								el.pitches = [{}];
								// TODO-PER: straighten this out so there is not so much copying: getCoreNote shouldn't change e'
								if (core.accidental !== undefined) el.pitches[0].accidental = core.accidental;
								el.pitches[0].pitch = core.pitch;
								if (core.endSlur !== undefined) el.pitches[0].endSlur = core.endSlur;
								if (core.endTie !== undefined) el.pitches[0].endTie = core.endTie;
								if (core.startSlur !== undefined) el.pitches[0].startSlur = core.startSlur;
								if (el.startSlur !== undefined) el.pitches[0].startSlur = el.startSlur;
								if (core.startTie !== undefined) el.pitches[0].startTie = core.startTie;
								if (el.startTie !== undefined) el.pitches[0].startTie = el.startTie;
							} else {
								el.rest = core.rest;
								if (core.endSlur !== undefined) el.rest.endSlur = core.endSlur;
								if (core.endTie !== undefined) el.rest.endTie = core.endTie;
								if (core.startSlur !== undefined) el.rest.startSlur = core.startSlur;
								if (el.startSlur !== undefined) el.rest.startSlur = el.startSlur;
								if (core.startTie !== undefined) el.rest.startTie = core.startTie;
								if (el.startTie !== undefined) el.rest.startTie = el.startTie;
							}

							if (core.chord !== undefined) el.chord = core.chord;
							if (core.duration !== undefined) el.duration = core.duration;
							if (core.decoration !== undefined) el.decoration = core.decoration;
							if (core.graceNotes !== undefined) el.graceNotes = core.graceNotes;

							delete el.startSlur;
							if (inTie) {
								if (el.pitches !== undefined) {
									el.pitches[0].endTie = true;
								} else {
									el.rest.endTie = true;
								}
								inTie = false;
							}
							if (core.startTie || el.startTie)
								inTie = true;

							i = core.endChar;

							if (tripletNotesLeft > 0) {
								tripletNotesLeft--;
								if (tripletNotesLeft === 0) {
									el.endTriplet = true;
								}
							}

							if (core.end_beam) {
								this.addEndBeam(el);
							}

							if (this.multilineVars.barNumOnNextNote) {
								el.barNumber = this.multilineVars.barNumOnNextNote;
								this.multilineVars.barNumOnNextNote = null;
							}
							this.tune.appendElement('note', startOfLine + i, startOfLine + 1, el);
							el = {};
						}
					}

					if (i === startI) {	// don't know what this is, so ignore it.
						if (line[i] !== ' ' && line[i] !== '`') {
							this.warn("Unknown character ignored", line, i);
						}
						i++;
					}
				}
			}
		}
	}
	parseLine(line: string): void {
		const ret = this.header.parseHeader(line);
		if (ret.regular) {
			this.parseRegularMusicLine(ret.str);
		}
		if (ret.newline) {
			this.startNewLine();
		}
		if (ret.words) {
			this.addWords(this.tune.getCurrentVoice(), line.substring(2));
		}
		if (ret.recurse) {
			this.parseLine(ret.str);
		}
	}

	parse(strTune: string): void {
		this.tune.reset();
		this.multilineVars.reset();

		// Normalize line endings
		strTune = strTune.replace(/\r\n/g, '\n');
		strTune = strTune.replace(/\r/g, '\n');
		strTune += '\n'; // Tacked on temporarily to make the last line continuation work
		strTune = strTune.replace(/\n\\.*\n/g, "\n"); // get rid of latex commands.
		strTune = strTune.replace(/\\([ \t]*)\n/g, "$1 \x12"); // take care of line continuations right away, but keep the same number of characters
		const lines = strTune.split('\n');
		if (lines[lines.length - 1].length === 0) {
			lines.pop();
		}

		lines.forEach(line => {
			if (this.multilineVars.is_in_history) {
				if (line[1] === ':') {
					this.multilineVars.is_in_history = false;
					this.parseLine(line);
				} else {
					this.tune.addMetaText("history", this.tokenizer.translateString(this.tokenizer.stripComment(line)));
				}
			} else if (this.multilineVars.inTextBlock) {
				if (line.startsWith("%%endtext")) {
					this.tune.addMetaText("textBlock", this.multilineVars.textBlock);
					this.multilineVars.inTextBlock = false;
				} else {
					this.multilineVars.textBlock += ' ' + line;
				}
			} else {
				this.parseLine(line);
			}
			this.multilineVars.iChar += line.length + 1;
		});
		this.tune.cleanUp();
	}
}
