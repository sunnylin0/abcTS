// 設定元素屬性的函數
function setAttributes(elm: HTMLElement, attrs: { [key: string]: string }): HTMLElement {
	for (const attr in attrs) {
		elm.setAttribute(attr, attrs[attr]);
	}
	return elm;
}

// Midi 類別定義
class Midi {
	trackstrings: string = "";
	trackcount: number = 0;
	track: string = "";
	first: boolean = true;
	silencelength: number = 0;
	instrument: number = 0;

	setTempo(qpm: number): void {
		if (this.trackcount === 0) {
			this.startTrack();
			this.track += "%00%FF%51%03" + toHex(Math.round(60000000 / qpm), 6);
			this.endTrack();
		}
	}

	startTrack(): void {
		this.track = "";
		this.silencelength = 0;
		this.trackcount++;
		this.first = true;
		if (this.instrument) {
			this.setInstrument(this.instrument);
		}
	}

	endTrack(): void {
		const tracklength = toHex(this.track.length / 3 + 4, 8);
		this.track = "MTrk" + tracklength + // track header
			this.track +
			'%00%FF%2F%00'; // track end
		this.trackstrings += this.track;
	}

	setInstrument(number: number): void {
		this.track = "%00%C0" + toHex(number, 2) + this.track;
		this.instrument = number;
	}

	// 新增音符
	addNote(pitch: number, loudness: number, length: number): void {
		this.startNote(pitch, loudness);
		this.endNote(pitch, length);
	}

	// 開始音符
	startNote(pitch: number, loudness: number): void {
		this.track += toDurationHex(this.silencelength); // only need to shift by amount of silence (if there is any)
		this.silencelength = 0;
		if (this.first) {
			this.first = false;
			this.track += "%90";
		}
		this.track += "%" + pitch.toString(16) + "%" + loudness; //note
	}

	// 結束音符
	endNote(pitch: number, length: number): void {
		this.track += toDurationHex(length); //duration
		this.track += "%" + pitch.toString(16) + "%00";//end note
	}

	// 加入休止符
	addRest(length: number): void {
		this.silencelength += length;
	}

	// 嵌入MIDI 到頁面中
	embed(parent: HTMLElement): void {
		const data = "data:audio/midi," +
			"MThd%00%00%00%06%00%01" + toHex(this.trackcount, 4) + "%01%e0" + // header
			this.trackstrings;

		const embedElement: HTMLElement = setAttributes(document.createElement('embed'), {
			src: data,
			type: 'video/quicktime',
			controller: 'true',
			autoplay: 'false',
			loop: 'false',
			enablejavascript: 'true',
			style: 'display:block; height: 20px;'
		});

		parent.insertBefore(embedElement, parent.firstChild);
	}
}

// 輔助函數：將字串編碼為十六進位格式
function encodeHex(s: string): string {
	let ret = "";
	for (let i = 0; i < s.length; i += 2) {
		ret += "%";
		ret += s.substring(i, i + 2);
	}
	return ret;
}

// 輔助函數：將數字轉換為指定長度的十六進位字串
function toHex(n: number, padding: number): string {
	let s = n.toString(16);
	while (s.length < padding) {
		s = "0" + s;
	}
	return encodeHex(s);
}

// 輔助函數：將音符長度轉換為MIDI 格式的十六進位字串
function toDurationHex(n: number): string {
	let res = 0;
	let a: number[] = [];

	// 切成 7 位元區塊
	while (n !== 0) {
		a.push(n & 0x7F);
		n = n >> 7;
	}

	// 將7位元資料塊連接起來，除最後一個資料塊外，其餘資料塊都以1開頭。
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
	midi: Midi;
	abctune: AbcTune;
	baseduration: number;
	baraccidentals: number[];
	accidentals: number[];
	tieduration: number;
	mark: MidiMark;
	lastmark: string;
	staffcount: number = 0;
	voicecount: number = 0;

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
		this.baseduration = 1920; // 480*4
		this.baraccidentals = [];
		this.accidentals = [0, 0, 0, 0, 0, 0, 0];
		this.tieduration = 0;
		this.mark = { line: 0, staff: 0, voice: 0, pos: 0 };
	}

	getMark(): MidiMark {
		return {
			line: this.mark.line,
			staff: this.mark.staff,
			voice: this.mark.voice,
			pos: this.mark.pos
		};
	}

	getMarkString(mark?: MidiMark): string {
		mark = mark || this.mark;
		return "line" + mark.line + "staff" + mark.staff +
			"voice" + mark.voice + "pos" + mark.pos;
	}

	goToMark(mark: MidiMark): void {
		this.mark.line = mark.line ?? 0;
		this.mark.staff = mark.staff ?? 0;
		this.mark.voice = mark.voice ?? 0;
		this.mark.pos = mark.pos ?? 0;
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
		return this.abctune.lines[this.mark.line ?? 0];
	}

	getStaff(): Staff | undefined {
		try {
			return this.getLine().staff?.[this.mark.staff ?? 0];
		} catch (e) {
			return undefined;
		}
	}

	getVoice(): NOTES_Element[] {
		const staff = this.getStaff();
		return staff ? staff.voices[this.mark.voice ?? 0] : [];
	}

	getElem(): NOTES_Element {
		return this.getVoice()[this.mark.pos ?? 0];
	}

	writeABC(abctune: AbcTune): void {
		try {
			this.midi = new Midi();
			this.baraccidentals = [];
			this.abctune = abctune;
			this.baseduration = 1920; // 480*4

			if (abctune.formatting?.midi) {
				this.midi.setInstrument(Number(abctune.formatting.midi.substring(8)));
			} else {
				this.midi.setInstrument(this.program);
			}

			if (abctune.metaText?.tempo) {
				let duration = 1 / 4;
				if (abctune.metaText.tempo.durationTempo) {
					duration = abctune.metaText.tempo.durationTempo[0];
				}
				let bpm = 60;
				if (abctune.metaText.tempo.bpm) {
					bpm = abctune.metaText.tempo.bpm;
				}
				this.qpm = bpm * duration * 4;
			}
			this.midi.setTempo(this.qpm);

			this.staffcount = 1;
			for (this.mark.staff = 0; this.mark.staff < this.staffcount; this.mark.staff++) {
				this.voicecount = 1;
				for (this.mark.voice = 0; this.mark.voice < this.voicecount; this.mark.voice++) {
					this.midi.startTrack();
					this.restart = { line: 0, staff: this.mark.staff, voice: this.mark.voice, pos: 0 };
					this.next = null;
					for (this.mark.line = 0; this.mark.line < abctune.lines.length; this.mark.line++) {
						const abcline = abctune.lines[this.mark.line];
						if (abcline.staff) {
							this.writeABCLine();
						}
					}
					this.midi.endTrack();
				}
			}
			this.midi.embed(this.parent);
		} catch (e) {
			this.parent.innerHTML = "Couldn't write midi: " + e;
		}
	}

	writeABCLine(): void {
		const staff = this.getStaff();
		if (!staff) return;
		this.staffcount = this.getLine().staff.length;
		this.voicecount = staff.voices.length;
		this.setKeySignature(staff.key);
		this.writeABCVoiceLine();
	}

	writeABCVoiceLine(): void {
		this.mark.pos = 0;
		while ((this.mark.pos ?? 0) < this.getVoice().length) {
			this.writeABCElement(this.getElem());
			if (this.next) {
				this.goToMark(this.next);
				this.next = null;
				if (!this.getLine().staff) return;
			} else {
				this.mark.pos = (this.mark.pos ?? 0) + 1;
			}
		}
	}

	writeABCElement(elem: NOTES_Element): void {
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

	writeNote(elem: NoteElement): void {
		if (elem.startTriplet) {
			this.multiplier = 2 / 3;
		}

		let mididuration = elem.duration * this.baseduration * this.multiplier;
		if (elem.pitches) {
			const midipitches: number[] = [];
			for (let i = 0; i < elem.pitches.length; i++) {
				const note = elem.pitches[i];
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

				midipitches[i] = 60 + 12 * this.extractOctave(pitch) + this.scale[this.extractNote(pitch)];

				if (this.baraccidentals[pitch] !== undefined) {
					midipitches[i] += this.baraccidentals[pitch];
				} else { // use normal accidentals
					midipitches[i] += this.accidentals[this.extractNote(pitch)];
				}

				this.midi.startNote(midipitches[i], 64);

				if (note.startTie) {
					this.tieduration = mididuration;
				}
			}

			for (let i = 0; i < elem.pitches.length; i++) {
				const note = elem.pitches[i];
				if (note.startTie) continue; // don't terminate it
				if (note.endTie) {
					this.midi.endNote(midipitches[i], mididuration + this.tieduration);
				} else {
					this.midi.endNote(midipitches[i], mididuration);
				}
				mididuration = 0;
				this.tieduration = 0;
			}
		} else {
			this.midi.addRest(mididuration);
		}

		if (elem.endTriplet) {
			this.multiplier = 1;
		}
	}

	handleBar(elem: BarElement): void {
		this.baraccidentals = [];
		const repeat: boolean = (elem.type === "bar_right_repeat" || elem.type === "bar_dbl_repeat");
		const skip: boolean = (elem.startEnding) ? true : false;
		const setvisited: boolean = (repeat || skip);
		const setrestart: boolean = (elem.type === "bar_left_repeat" || elem.type === "bar_dbl_repeat" || elem.type === "bar_thick_thin" || elem.type === "bar_thin_thick" || elem.type === "bar_thin_thin" || elem.type === "bar_right_repeat");
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

	setKeySignature(elem: KeySigElement): void {
		this.accidentals = [0, 0, 0, 0, 0, 0, 0];
		if (this.abctune.formatting?.bagpipes) {
			elem.accidentals = [{ acc: 'natural', note: 'g' }, { acc: 'sharp', note: 'f' }, { acc: 'sharp', note: 'c' }];
		}
		if (!elem.accidentals) return;
		for (let acc of elem.accidentals) {
			const d = (acc.acc === "sharp") ? 1 : (acc.acc === "natural") ? 0 : -1;
			const lowercase = acc.note.toLowerCase();
			const note = this.extractNote(lowercase.charCodeAt(0) - 'c'.charCodeAt(0));
			this.accidentals[note] += d;
		}
	}

	extractNote(pitch: number): number {
		pitch = pitch % 7;
		if (pitch < 0) pitch += 7;
		return pitch;
	}

	extractOctave(pitch: number): number {
		return Math.floor(pitch / 7);
	}
}