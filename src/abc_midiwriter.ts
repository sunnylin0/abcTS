import { AbcTune } from "./abc_tune";

// 设置元素属性的函数
function setAttributes(elm: HTMLElement, attrs: { [key: string]: string }): HTMLElement {
	for (const attr in attrs) {
		elm.setAttribute(attr, attrs[attr]);
	}
	return elm;
}

// Midi 类定义
export class Midi {
	tracks: string[] = [];
	track: string = "%%0";
	first: boolean = true;
	silencelength: string = "%0";

	// 设置乐器
	setInstrument(number: number): void {
		this.track = "%00%C0" + toHex(number, 2) + this.track;
	}

	// 添加音符
	addNote(pitch: number, loudness: number, length: number): void {
		this.startNote(pitch, loudness);
		this.endNote(pitch, length);
	}

	// 开始音符
	startNote(pitch: number, loudness: number): void {
		if (this.first) {
			this.first = false;
		} else {
			this.track += this.silencelength; // only need to shift by amout of silence
			this.silencelength = "%00";
		}
		this.track += "%" + pitch.toString(16) + "%" + loudness; //note
	}

	// 结束音符
	endNote(pitch: number, length: number): void {
		this.track += toDurationHex(length); //duration
		this.track += "%" + pitch.toString(16) + "%00";//end note
	}

	// 添加休止符
	addRest(length: number): void {
		this.silencelength = toDurationHex(length);
	}

	// 嵌入 MIDI 到页面中
	embed(parent: HTMLElement): void {
		const tracklength = toHex(this.track.length / 3 + 4, 8);
		const data = "data:audio/midi," +
			"MThd%00%00%00%06%00%01%00%01%00%C0" + // header
			"MTrk" + tracklength + // track header
			this.track +
			'%00%FF%2F%00'; // track end

		const embedElement = setAttributes(document.createElement('embed'), {
			src: data,
			type: 'audio/midi', // Correct MIME type for MIDI files
			controller: 'true',
			autoplay: 'false',
			loop: 'false',
			enablejavascript: 'true',
			style: 'display:block; height: 20px;'
		});

		parent.insertBefore(embedElement, parent.firstChild);
	}
}

// 辅助函数：将字符串编码为十六进制格式
function encodeHex(s: string): string {
	let ret = "";
	for (let i = 0; i < s.length; i += 2) {
		ret += "%";
		ret += s.substr(i, 2);
	}
	return ret;
}

// 辅助函数：将数字转换为指定长度的十六进制字符串
function toHex(n: number, padding: number): string {
	let s = n.toString(16);
	while (s.length < padding) {
		s = "0" + s;
	}
	return encodeHex(s);
}

// 辅助函数：将音符长度转换为 MIDI 格式的十六进制字符串
function toDurationHex(n: number): string {
	let res = 0;
	let a: number[] = [];

	// cut up into 7 bit chunks
	while (n !== 0) {
		a.push(n & 0x7F);
		n = n >> 7;
	}

	// join the 7 bit chunks together, all but last chunk get leading 1
	for (let i = a.length - 1; i >= 0; i--) {
		res = res << 8;
		let bits = a[i];
		if (i !== 0) {
			bits = bits | 0x80;
		}
		res = res | bits;
	}

	let padding = res.toString(16).length;
	padding += padding % 2;

	return toHex(res, padding);
}
//interface ABCTune {
//	formatting?: {
//		midi?: string;
//	};
//	metaText?: {
//		tempo?: {
//			duration?: number[];
//			bpm?: number;
//		};
//	};
//	lines: ABCLine[];
//}


//interface ABCElement {
//	el_type: string;
//	duration?: number;
//	pitches?: Pitch[];
//	startTriplet?: boolean;
//	startTie?: boolean;
//	endTie?: boolean;
//}

//interface Pitch {
//	pitch: number;
//	accidental?: string;
//	startTie?: boolean;
//	endTie?: boolean;
//}

//interface KeySignature {
//	accidentals?: Accidental[];
//}

//interface Accidental {
//	acc?: string;
//	note?: string;
//}

export class ABCMidiWriter {
	options: any;
	parent: HTMLElement;
	scale: number[];
	restart: MidiMark;
	visited: { [key: string]: any };
	multiplier: number;
	next: { line?: number, staff?: number, voice?: number, pos?: number } | null;
	qpm: number;
	program: number;
	midi: Midi; // Assuming Midi is some type defined elsewhere
	abctune: AbcTune;
	baseduration: number;
	baraccidentals: number[];
	accidentals: number[];
	tieduration: number;
	mark: MidiMark;
	lastmark: string;

	constructor(parent: HTMLElement, options: { qpm?: number, program?: number } = {}) {
		this.options = options || {};
		this.parent = parent;
		this.scale = [0, 2, 4, 5, 7, 9, 11];
		this.restart = { line: 0, staff: 0, voice: 0, pos: 0 };
		this.visited = {};
		this.multiplier = 1;
		this.next = null;
		this.qpm = options["qpm"] || 180;
		this.program = options["program"] || 2;
		this.baseduration = 384;
		this.baraccidentals = [];
		this.accidentals = [0, 0, 0, 0, 0, 0, 0];
		this.tieduration = 0;
	}

	getMark(): MidiMark {
		return this.mark
	}

	getMarkString(mark?: MidiMark): string {
		mark = mark || this.mark;
		return "line" + mark.line + "staff" + mark.staff +
			"voice" + mark.voice + "pos" + mark.pos;
	};

	goToMark(mark: MidiMark): void {
		this.mark = mark
	}

	markVisited(): void {
		this.lastmark = this.getMarkString();
		this.visited[this.lastmark] = true;
	}

	isVisited(): boolean {
		return this.visited[this.getMarkString()] !== undefined;
	}

	setJumpMark(mark: MidiMark): void {
		this.visited[this.lastmark] = mark;
	}

	getJumpMark(): MidiMark {
		return this.visited[this.getMarkString()] as MidiMark;
	}

	getLine(): ABCLine {
		return this.abctune.lines[this.mark.line];
	}

	getStaff(): Staff {
		return this.getLine().staff[this.mark.voice];
	}
	getVoice(): NoteElement[] {
		return this.getStaff().voices[this.mark.voice];
	};
	getElem(): NoteElement {// ABCElement {
		return this.getVoice()[this.mark.pos];
	}

	writeABC(abctune: AbcTune): void {
		try {
			this.midi = new Midi();
			this.baraccidentals = [];
			this.abctune = abctune;
			this.baseduration = 384;

			let wholeduration: number;
			if (abctune.formatting?.midi) {
				this.midi.setInstrument(Number(abctune.formatting.midi.substring(8)));

			} else {
				this.midi.setInstrument(this.program);
			}
			wholeduration = (60 / this.qpm) * 4;
			if (abctune.metaText?.tempo) {
				let duration = 1 / 4;
				if (abctune.metaText.tempo.duration) {
					duration = abctune.metaText.tempo.duration[0];
				}
				let bpm = 60;
				if (abctune.metaText.tempo.bpm) {
					bpm = abctune.metaText.tempo.bpm;
				}
				wholeduration = (60 / bpm) / duration;

			}

			this.baseduration = this.baseduration * wholeduration;
			for (this.mark.line = 0; this.mark.line < abctune.lines.length; this.mark.line++) {
				const abcline = abctune.lines[this.mark.line];
				if (this.getLine().staff) {
					this.writeABCLine();
				}
			}
			this.midi.embed(this.parent);
		} catch (e) {
			this.parent.innerHTML = "Couldn't write midi: " + e;
		}
	}

	writeABCLine(): void {
		this.mark.staff = 0;
		this.mark.voice = 0;
		this.setKeySignature(this.getStaff().key);
		this.writeABCVoiceLine();
	}

	writeABCVoiceLine(): void {
		this.mark.pos = 0;
		while (this.mark.pos < this.getVoice().length) {
			this.writeABCElement(this.getElem());
			if (this.next) {
				this.goToMark(this.next);
				this.next = null;
				if (!this.getLine().staff) return;
			} else {
				this.mark.pos++;
			}
		}
	}

	writeABCElement(elem: ABCElement): void {
		switch (elem.el_type) {
			case "note":
				this.writeNote(elem);
				break;

			case "key":
				this.setKeySignature(elem);
				break;
			case "bar":
				this.handleBar(elem);
				break;
			case "meter":
			case "clef":
			default:
				break;
		}
	}

	writeNote(elem: { startTriplet?: boolean, duration: number, pitches?: Pitch[], startTie?: boolean, endTie?: boolean }): void {
		if (elem.startTriplet) {
			this.multiplier = 2 / 3;
		}

		let mididuration = elem.duration * this.baseduration * this.multiplier;
		if (elem.pitches) {
			const note = elem.pitches[0];
			const pitch = note.pitch;
			if (note.accidental) {
				switch (note.accidental) {
					case "sharp":
						this.baraccidentals[pitch] = 1;
						break;
					case "flat":
						this.baraccidentals[pitch] = -1;
						break;
					case "nat":
						this.baraccidentals[pitch] = 0;
						break;
				}
			}

			let midipitch = 60 + 12 * this.extractOctave(pitch) + this.scale[this.extractNote(pitch)];

			if (this.baraccidentals[pitch] !== undefined) {
				midipitch += this.baraccidentals[pitch];
			} else { // use normal accidentals
				midipitch += this.accidentals[this.extractNote(pitch)]
			}

			if (note.startTie) {
				this.midi.startNote(midipitch, 64);
				this.tieduration = mididuration;
			} else if (note.endTie) {
				this.midi.endNote(midipitch, mididuration + this.tieduration);
				this.tieduration = 0;
			} else {
				this.midi.addNote(midipitch, 64, mididuration);
			}
		} else {
			this.midi.addRest(mididuration);
		}

		if (elem.startTriplet) {
			this.multiplier = 1;
		}

	};

	handleBar(elem) {
		this.baraccidentals = [];


		let repeat = (elem.type === "bar_right_repeat" || elem.type === "bar_dbl_repeat");
		let skip = (elem.startEnding) ? true : false;
		let setvisited = (repeat || skip);
		let setrestart = (elem.type === "bar_left_repeat" || elem.type === "bar_dbl_repeat" || elem.type === "bar_thick_thin" || elem.type === "bar_thin_thick" || elem.type === "bar_thin_thin" || elem.type === "bar_right_repeat");

		let next = null;

		if (this.isVisited()) {
			next = this.getJumpMark();
		} else {

			if (skip || repeat) {
				if (this.visited[this.lastmark] === true) {
					this.setJumpMark(this.getMark());
				}
			}

			if (setvisited) {
				this.markVisited();
			}

			if (repeat) {
				next = this.restart;
				this.setJumpMark(this.getMark());
			}
		}

		if (setrestart) {
			this.restart = this.getMark();
		}

		if (next && this.getMarkString(next) !== this.getMarkString()) {
			this.next = next;
		}

	}

	setKeySignature(elem) {
		this.accidentals = [0, 0, 0, 0, 0, 0, 0];
		if (!elem.accidentals) return;
		for (let acc of elem.accidentals) {
			var d = (acc.acc === "sharp") ? 1 : (acc.acc === "natural") ? 0 : -1;

			var lowercase = acc.note.toLowerCase();
			var note = this.extractNote(lowercase.charCodeAt(0) - 'c'.charCodeAt(0));
			this.accidentals[note] += d;
		};

	}

	extractNote(pitch: number) {
		pitch = pitch % 7;
		if (pitch < 0) pitch += 7;
		return pitch;
	}

	extractOctave(pitch: number) {
		return Math.floor(pitch / 7);
	}

}