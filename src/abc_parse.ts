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
	//		chord: string
	//		end_beam = true or undefined if this is the last note in a beam.
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
	lines: Line[];
	metaText: MetaTextInfo= {};

	constructor() {
		this.reset();
	}

	reset(): void {
		this.metaText = {};
		this.lines = [];
	}

	appendElement(type: ElementType, startChar: number, endChar: number, hashParams: Omit<AbcElement, "el_type" | "startChar" | "endChar">): void {
		const element = {
			el_type: type,
			startChar,
			endChar,
			...hashParams,
		} as AbcElement;

		const lastLine = this.lines[this.lines.length - 1];
		if (lastLine && "staff" in lastLine) {
			lastLine.staff.push(element);
		} else {
			this.lines.push({ staff: [element] });
		}
	}
}


class ParseAbc {
	private tune: AbcTune;
	private nextNoteDuration: number = 0;
	private multilineVars: MultilineVars;
	private next_note_duration = 0;

	constructor() {
		this.tune = new AbcTune();

		this.multilineVars = {
			iChar: 0,
			key: { num: 0 },
			meter: { el_type: "meter", type: "specified", num: 4, den: 4 },
			hasMainTitle: false,
			default_length: 1,
			reset() {
				this.iChar = 0;
				this.key = { num: 0 };
				this.meter = { type: "specified", num: "4", den: "4" };
				this.hasMainTitle = false;
				this.default_length = 1;
			}
		}

	}

	getTune(): AbcTune {
		return this.tune;
	}

	/////////////////// private functions ////////////////////
	private parseKey(str: string): KeySignature {
		// First get the key letter: turn that into a index into the key array (0-11)
		// Then see if there is a sharp or flat. Increment or decrement.
		// Then see if there is a mode modifier. Add or subtract to the index.
		// Then do a mod 12 on the index and return the key.
		const keys: KeySignature[] = [
			{ num: 3, acc: "sharp" }, // A
			{ num: 2, acc: "flat" }, // Bb
			{ num: 5, acc: "sharp" }, // B
			{ num: 0 }, // C
			{ num: 5, acc: "flat" }, // Db
			{ num: 2, acc: "sharp" }, // D
			{ num: 3, acc: "flat" }, // Eb
			{ num: 4, acc: "sharp" }, // E
			{ num: 1, acc: "flat" }, // F
			{ num: 6, acc: "flat" }, // Gb
			{ num: 1, acc: "sharp" }, // G
			{ num: 4, acc: "flat" }, // Ab
		];

		str = str.replace(/ /g, "").toUpperCase();

		let key: number;
		switch (str[0]) {
			case "A": key = 0; break;
			case "B": key = 2; break;
			case "C": key = 3; break;
			case "D": key = 5; break;
			case "E": key = 7; break;
			case "F": key = 8; break;
			case "G": key = 10; break;
			default: key = 3; break;
		}

		let i = 1;
		if (i < str.length) {
			switch (str[i]) {
				case "#": key += 1; i += 1; break;
				case "B": key -= 1; i += 1; break;
			}
		}

		if (i < str.length) {
			const j = i + 3;
			const substr = str.substring(i, j + 1);
			switch (substr) {
				case "LYD": key -= 5; break;
				case "MIX": key -= 7; break;
				case "DOR": key -= 2; break;
				case "MIN": key -= 9; break;
				case "M": key -= 9; break;
				case "AEO": key -= 9; break;
				case "PHR": key -= 4; break;
				case "LOC": key -= 11; break;
			}
		}

		if (key < 0) key += 12;
		return keys[key];
	}

	private substInChord(str: string): string {
		return str.replace(/\\n/g, "\n");
	}

	private getBrackettedSubstring(line: string, i: number, maxErrorChars: number): [number, string] {
		// This extracts the sub string by looking at the first character and searching for that
		// character later in the line. For instance, if the first character is a quote it will look for
		// the end quote. If the end of the line is reached, then only up to the default number
		// of characters are returned, so that a missing end quote won't eat up the entire line.
		// It returns the substring and the number of characters consumed.
		// The number of characters consumed is normally two more than the size of the substring,
		// but in the error case it might not be.
		const matchChar = line[i];
		let pos = i + 1;
		while (pos < line.length && line[pos] !== matchChar) {
			pos++;
		}
		if (line[pos] === matchChar) {
			return [pos - i + 1, this.substInChord(line.substring(i + 1, pos))];
		} else {
			// we hit the end of line, so we'll just pick an arbitrary num of chars so the line doesn't disappear.
			pos = i + maxErrorChars;
			if (pos > line.length - 1) pos = line.length - 1;
			return [pos - i + 1, this.substInChord(line.substring(i + 1, pos))];
		}
	}

	private letter_to_chord(line: string, i: number): [number, string] {
		if (line[i] === '"') {
			var chord = this.getBrackettedSubstring(line, i, 5);
			if (chord[0] > 0 && chord[1].length > 0 && chord[1][0] === '^')	// If it starts with ^, then the chord appears above, but that is also the default, so strip it.
				chord[1] = chord[1].substring(1);
			return chord;
		}
		return [0, ""];
	}

	private letter_to_accent(line: string, i: number): AccentInfo {
		switch (line[i]) {
			case ".":
				return [1, "staccato"];
			case "u":
				return [1, "up_bow"];
			case "v":
				return [1, "down_bow"];
			case "~":
				return [1, "trill"];
			case "!":
				const ret = this.getBrackettedSubstring(line, i, 5);
				// Be sure that the accent is recognizable.
				var legalAccents = ["trill", "lowermordent", "uppermordent", "mordent", "pralltriller", "accent",
					"emphasis", "fermata", "invertedfermata", "tenuto", "0", "1", "2", "3", "4", "5", "+", "wedge",
					"open", "thumb", "snap", "turn", "roll", "breath", "shortphrase", "mediumphrase", "longphrase",
					"segno", "coda", "D.S.", "D.C.", "fine", "crescendo(", "crescendo)", "diminuendo(", "diminuendo)",
					"p", "pp", "f", "ff", "mf", "ppp", "pppp", "fff", "ffff", "sfz", "repeatbar", "repeatbar2",
					"upbow", "downbow"];
				if (legalAccents.includes(ret[1])) {
					return ret;
				}
				// We didn't find the accent in the list, so consume the space, but don't return an accent.
				ret[1] = "";
				return ret;
			case 'H': return [1, 'fermata'];
		}
		return [0, "0"];
	}

	private letter_to_accidental(line: string, i: number): AccidentalInfo {
		switch (line[i]) {
			case "^":
				return [1, "sharp"];
			case "=":
				return [1, "natural"];
			case "_":
				return [1, "flat"];
		}
		return [0, ""];
	}
	// The legal durations for L:1/8 are:
	// <nothing>=eighth
	// 2= quarter
	// 3= dotted quarter
	// 4=half
	// 6=dotted half
	// 8=whole
	// /2=sixteenth
	// 3/2=dotted eigthth
	// > =dotted eighth; next note is sixteenth
	// < =sixteenth; next note is dotted eighth
	// 2> =dotted quarter; next note is eighth
	// 2< =eighth; next note is dotted quarter

	private letter_to_duration2(line: string, i: number): DurationInfo {
		switch (line[i]) {
			case '>': return [1, 1.5, 0.5];
			case '<': return [1, 0.5, 1.5];
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				if (line[i] === '2' && (i < line.length - 1) && (line[i + 1] === '>'))
					return [2, 3, 1];
				else if (line[i] === '2' && (i < line.length - 1) && (line[i + 1] === '<'))
					return [2, 1, 3];
				else {
					// we are looking for: 999/999 where 999 is 0 to an arbitrary number of digits and the slash and second number are optional
					var start = i;
					var num = parseInt(line[i]);
					var den = 1;	// if it isn't set below, then it is 1 so that it doesn't change the division
					i++;
					while (i < line.length && line[i] >= '0' && line[i] <= '9') {
						num = num * 10 + parseInt(line[i]);
						i++;
					}
					// num now has the first number. Look for a slash.
					if (i < line.length && line[i] === '/') {
						i++;
						// now look for the denominator.
						var d = 0;
						while (i < line.length && line[i] >= '0' && line[i] <= '9') {
							d = d * 10 + parseInt(line[i]);
							i++;
						}
						if (d !== 0)
							den = d;
					}
					return [i - start, num / den];
				}
				break;
			case '/':
				// assume the numerator is 1; if the next character is not a number, then assume it is a 2
				var start2 = i;
				i++;
				var dd = 0;
				while (i < line.length && line[i] >= '0' && line[i] <= '9') {
					dd = dd * 10 + parseInt(line[i]);
					i++;
				}
				if (dd === 0)
					return [1, .5];
				else
					return [i - start2, 1 / dd];
				break;
		}
		return [0, 0];
	};

	private letter_to_duration(line: string, i: number): DurationInfo {
		if (this.nextNoteDuration !== 0) {
			const ret: DurationInfo = [0, this.nextNoteDuration];
			this.nextNoteDuration = 0;
			return ret;
		}

		const ret2 = this.letter_to_duration2(line, i);
		if (ret2.length > 2) {
			this.nextNoteDuration = ret2[2];
		}
		return ret2;
	}

	private letter_to_spacer(line: string, i: number): SpacerInfo {
		if (line[i] === " " || line[i] === "\t") {
			return [1, "spacer"];
		}
		return [0, ""];
	}

	// returns the class of the bar line
	// the number of the repeat
	// and the number of characters used up
	// if 0 is returned, then the next element was not a bar line
	private letter_to_bar(line, curr_pos) {
		let str1 = line.substring(curr_pos, curr_pos + 1);
		let str2 = line.substring(curr_pos, curr_pos + 2);
		let str3 = line.substring(curr_pos, curr_pos + 3);
		let str4 = line.substring(curr_pos, curr_pos + 4);

		if (str4 === ":||:") return [4, "bar_dbl_repeat"];
		else if (str3 === ":|2") return [3, "bar_right_repeat", 2];
		else if (str3 === "[|:") return [3, "bar_left_repeat"];
		else if (str3 === "||:") return [3, "bar_left_repeat"];
		else if (str2 === ":|") return [2, "bar_right_repeat"];
		else if (str2 === "|:") return [2, "bar_left_repeat"];
		else if (str2 === "||") return [2, "bar_thin_thin"];
		else if (str2 === "::") return [2, "bar_dbl_repeat"];
		else if (str2 === "[2" || str2 === "[1") return [2, "bar_thin", 2]; // should it guess a repeat?
		else if (str2 === "[1" || str2 === "|1") return [2, "bar_thin", 1];
		else if (str2 === "|]") return [2, "bar_thin_thick"];
		else if (str2 === "[|") return [2, "bar_thick_thin"];
		else if (str1 === "|") return [1, "bar_thin"];
		else return [0, ""];
	};

	// returns the pitch (null for a rest) and the number of chars used up
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
			case 'z': ret = [1, null]; break; // missing x, y
		}
		if (ret[0] !== 0 && curr_pos < line.length - 1) {
			if (line[curr_pos + 1] === ",") {
				ret[0]++;
				ret[1] -= 7;
			} else if (line[curr_pos + 1] === "'") {
				ret[0]++;
				ret[1] += 7;
			}
		}
		return ret;
	}


	private setTitle(title: string): void {
		if (this.multilineVars.hasMainTitle) {
			this.tune.lines.push({ subtitle: title });
		} else {
			this.addMetaText("title", title);
			this.multilineVars.hasMainTitle = true;
		}
	}

	private setMeter(meter: string): void {
		meter = this.stripComment(meter);
		if (meter === "C") {
			this.multilineVars.meter = { el_type: "meter", type: "common_time" };
		} else if (meter === "C|") {
			this.multilineVars.meter = { el_type: "meter", type: "cut_time" };
		} else {
			const a = meter.split("/");
			if (a.length === 2) {
				this.multilineVars.meter = {
					el_type: "meter",
					type: "specified",
					num: parseInt(a[0].trim(), 10),
					den: parseInt(a[1].trim(), 10),
				};
			}
		}
	}
	private addWords(line, words) {
		words = words.trim();
		if (words[words.length - 1] != '-')
			words = words + ' ';	// Just makes it easier to parse below, since every word has a divider after it.
		var word_list = [];
		// first make a list of words from the string we are passed. A word is divided on either a space or dash.
		var last_divider = -1;
		for (var i = 0; i < words.length; i++) {
			if ((words[i] === ' ') || (words[i] === '-')) {
				word_list.push({ syllable: words.substring(last_divider + 1, i), divider: words[i] });
				last_divider = i;
			}
		}

		line.each(function (el) {
			if (el.el_type === 'note' && word_list.length > 0) {
				el.lyric = word_list.shift();
			}
		});
	};


	//
	// Parse line of music
	//
	private parseRegularMusicLine(line: string): void {
		let i = 0;
		// see if there is nothing but a comment on this line. If so, just ignore it. A full line comment is optional white space followed by %
		while ((line[i] === " " || line[i] === "\t") && i < line.length)
			i++;
		if (i === line.length || line[i] === "%")
			return;


		// Start with the standard staff, clef and key symbols on each line
		this.tune.lines.push({ staff: [] });
		this.tune.appendElement("clef", -1, -1, { type: "treble" });
		this.tune.appendElement("key", -1, -1, this.multilineVars.key);
		if (!this.multilineVars.meter) {
			this.tune.appendElement("meter", -1, -1, this.multilineVars.meter);
			this.multilineVars.meter = {
				el_type: "meter",
				type: ""
			};
		}

		let inGrace = false;
		while (i < line.length) {
			if (line[i] === "%") {
				break;
			}

			const ret = this.letter_to_bar(line, i);
			if (ret[0] > 0) {
				i += Number(ret[0]);
				this.multilineVars.iChar += Number(ret[0]);

				var bar = { type: ret[1], number: ret[2] };
				this.tune.appendElement(
					"bar",
					this.multilineVars.iChar,
					this.multilineVars.iChar + Number(ret[0]),
					bar
				);
			} else {
				// Looking for a note. The note syntax looks like this:
				// note :=  [chord] [accents] [accidental] pitch [duration]
				// TODO: straighten out all the start and end chars
				// a note, or group of notes, can also be enclosed in {}. If so, the first gets the attribute "grace_start", and the last gets the attribute "grace_end"
				let el: any = {};
				if (!inGrace && line[i] === '{') {
					el.grace_start = true;
					inGrace = true;
					if (i < line.length + 1) {
						i++;
						this.multilineVars.iChar++;
					}
				}
				let retChord = this.letter_to_chord(line, i);
				if (retChord[0] > 0) {
					el.chord = retChord[1];
					i += retChord[0];
					this.multilineVars.iChar += retChord[0];
				}
				let done = false;
				while (!done) {
					retChord = this.letter_to_accent(line, i);
					if (retChord[0] > 0) {
						if (retChord[1].length > 0) {
							if (el.decoration === undefined) {
								el.decoration = [];
							}
							el.decoration.push(retChord[1]);
						}
						i += retChord[0];
						this.multilineVars.iChar += retChord[0];
					} else {
						done = true;
					}
				}
				retChord = this.letter_to_accidental(line, i);
				if (retChord[0] > 0) {
					el.accidental = retChord[1];
					i += retChord[0];
					this.multilineVars.iChar += retChord[0];
				}
				const retPitch = this.letter_to_pitch(line, i);
				if (retPitch[0] > 0) {
					el.pitch = retPitch[1];
					i += retPitch[0];
					this.multilineVars.iChar += retPitch[0];

					const ret2 = this.letter_to_duration(line, i);
					el.duration = this.multilineVars.default_length;
					if (ret2[1] > 0) {
						el.duration = ret2[1] * this.multilineVars.default_length;;
						i += ret2[0];
						this.multilineVars.iChar += ret2[0];
					}
					const ret3 = this.letter_to_spacer(line, i);
					if (ret3[1] === "spacer") {
						el.end_beam = true;
					}

					// look ahead to see if we are ending a grace note series
					if (inGrace && i < line.length && line[i] === '}') {
						el.grace_end = true;
						inGrace = false;
						if (i < line.length + 1) {
							i++;
							this.multilineVars.iChar++;
						}
					}
					if (ret[1] !== null)	// not rest
						this.tune.appendElement('note', this.multilineVars.iChar, this.multilineVars.iChar, el);
					else
						this.tune.appendElement('rest', this.multilineVars.iChar, this.multilineVars.iChar, el);
				} else {// don't know what this is, so ignore it.
					i++;
					this.multilineVars.iChar++;
				}
			}
		}
		this.multilineVars.iChar++; // for the newline
	}
	private stripComment(str) {
		var i = str.indexOf('%');
		if (i >= 0)
			return str.substring(0, i).trim();
		return str.trim();
	}

	private addMetaText(key, value) {
		if (this.tune.metaText[key] === undefined)
			this.tune.metaText[key] = this.stripComment(value) + "\n";
		else
			this.tune.metaText[key] += this.stripComment(value) + "\n";
	}

	private getNumber(str) {
		// This parses the beginning of the string for a number and returns { value: num, digits: num }
		// If digits is 0, then the string didn't point to a number.
		var x = parseInt(str);
		if (isNaN(x)) {
			return { digits: 0 };
		}
		const s = x.toString();
		const i = str.indexOf(s);	// This is to account for leading spaces
		return { value: x, digits: i + s.length };
	};


	private setTempo(str) {
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
		// The temporary variables we keep are the multiplier and the bpm. In the first two forms, the multiplier is 1.
		var commentStart = str.indexOf('%');	// get rid of any comment part
		if (commentStart >= 0)
			str = str.substring(0, commentStart);
		str = str.trim();
		if (str.length === 0)
			return;	// just ignore a blank field.

		if (str[0] === 'C') {	// either type 2 or type 3
			if (str.length >= 3 && str[1] === '=') {
				// This is a type 2 format. The multiplier is an implied 1
				var x = this.getNumber(str.substring(2));
				if (x.digits === 0)
					return;	// TODO-PER: flag as an error.
				this.multilineVars.tempo = { multiplier: 1, bpm: x.value };
				return;
			} else if (str.length >= 2 && str[1] >= '0' && str[1] <= '9') {
				// This is a type 3 format.
				var mult = this.getNumber(str.substring(1));
				str = str.substring(mult.digits + 1);
				if (str.length < 2 || str[0] !== '=')
					return;	// TODO-PER: flag an error
				var speed = this.getNumber(str.substring(1));
				if (speed.digits === 0)
					return;	// TODO-PER: flag as an error.
				this.multilineVars.tempo = { multiplier: mult.value, bpm: speed.value };
				return;
			}	// TODO-PER: if it isn't one of the above, flag as an error

		} else if (str[0] >= '0' && str[0] <= '9') {	// either type 1 or type 4
			var num = this.getNumber(str);
			if (num.digits === 0)
				return;	// TODO-PER: flag as an error.
			str = str.substring(num.digits);
			if (str.length === 0 || str[0] !== '/') {
				// This is type 1
				this.multilineVars.tempo = { multiplier: 1, bpm: num.value };
				return;
			}
			str = str.substring(1);
			var num2 = this.getNumber(str);
			if (num2.digits === 0)
				return;	// TODO-PER: flag as an error.

			str = str.substring(num2.digits);
			if (str.length === 0 || str[0] !== '=')
				return;	// TODO-PER: flag as an error.

			var num3 = this.getNumber(str.substring(1));
			if (num3.digits === 0)
				return;	// TODO-PER: flag as an error.
			this.tune.metaText.tempo = { duration: num.value / num2.value, bpm: num3.value };
		}
		// TODO-PER: if it isn't one of the above, flag as an error
	};

	private parseLine(line: string): void {
		const str = line.length >= 2 ? line.substring(0, 2) : "";
		switch (str) {
			case 'B:':
				this.addMetaText("book", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'C:':
				this.addMetaText("author", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'D:':
				this.addMetaText("discography", line.substring(2));
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
					var dur = this.multilineVars.default_length ? this.multilineVars.default_length / 8 : 1 / 8;
					this.tune.metaText.tempo = { duration: dur * this.multilineVars.tempo.multiplier, bpm: this.multilineVars.tempo.bpm };
					this.multilineVars.tempo = null;
				}
				this.multilineVars.key = this.parseKey(line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'L:':
				var len = line.substring(2).replace(/ /, "");
				var len_arr = len.split('/');
				if (len_arr.length === 2) {
					var n = parseInt(len_arr[0]);
					var d = parseInt(len_arr[1]);
					if (d > 0) {
						var q = n / d;
						this.multilineVars.default_length = q * 8;	// an eighth note is 1
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
				// TODO: handle parts.
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
				this.addMetaText("copyright", line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'T:':
				this.setTitle(line.substring(2));
				this.multilineVars.iChar += line.length + 1;
				break;
			case 'w:':
				this.tune.lines[2].staff
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
			case '%%':
				// TODO: handle meta commands.
				this.multilineVars.iChar += line.length + 1;
				break;
			default:
				if (line.length > 0)
					this.parseRegularMusicLine(line);
		}
	}

	private parseTune(strTune: string): void {
		// take care of line continuations right away, but keep the same number of characters
		strTune = strTune.replace(/\\\n/g, "  ");
		strTune = strTune.replace(/\\ \n/g, "   ");	// take care of line continuations right away, but keep the same number of characters
		const lines = strTune.split("\n");
		lines.forEach((line) => {
			this.parseLine(line);
		});
	};

	parse(strTune: string): void {
		this.tune.reset();
		this.multilineVars.reset();
		this.parseTune(strTune);
	}
}


