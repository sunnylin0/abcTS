//    abc_tune.ts: a computer usable internal structure representing one tune.
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

import { ABCBeamElem } from "./abc_graphelements";

/*extern AbcTune */

//declare class AbcTune {
//	constructor();
//	// 重置AbcTune对象的状态
//	reset(): void;
//	// 清理AbcTune对象中的数据
//	cleanUp(): void;
//	// 获取最后一个音符元素
//	getLastNote(): { el_type: string } | null;
//	// 给最后一个音符元素添加连音线
//	addTieToLastNote(): boolean;
//	// 获取元素的持续时间
//	getDuration(el: { duration?: number }): number;
//	// 关闭当前行，处理可能的连音符
//	closeLine(): void;
//	// 向当前行添加元素
//	appendElement(
//		type: string,
//		startChar: number | null,
//		endChar: number | null,
//		hashParams: { el_type: string; startChar?: number; endChar?: number }
//	): void;
//	// 向当前行添加起始元素（如谱号、调号等）
//	appendStartingElement(
//		type: string,
//		startChar: number | null,
//		endChar: number | null,
//		hashParams: { el_type: string; startChar?: number; endChar?: number }
//	): void;

//	// 获取行数
//	getNumLines(): number;
//	// 添加副标题
//	addSubtitle(str: string): void;
//	// 添加分隔符
//	addSeparator(spaceAbove: number, spaceBelow: number, lineLength: number): void;
//	// 添加文本
//	addText(str: string): void;
//	// 检查某个声部是否包含音符
//	containsNotes(voice: { el_type: string }[]): boolean;
//	// 开始新的一行
//	startNewLine(params: {
//		name?: string;
//		subname?: string;
//		stem?: string;
//		clef?: { type: string; verticalPos?: number };
//		key?: { accidentals?: { acc: string; note: string }[] };
//		vocalfont?: any;
//		bracket?: string;
//		brace?: string;
//		connectBarLines?: string;
//		part?: string;
//		meter?: { type: string; num?: string; den?: string };
//	}): void;
//	// 检查是否已经开始音乐内容
//	hasBeginMusic(): boolean;
//	// 检查是否为第一行
//	isFirstLine(index: number): boolean;
//	// 获取当前声部
//	getCurrentVoice(): { el_type: string } | null;
//	// 设置当前声部
//	setCurrentVoice(staffNum: number, voiceNum: number): void;
//	// 添加元数据文本
//	addMetaText(key: string, value: string): void;
//}



// abc_tune.d.ts

/**
 * AbcTune 类表示一个曲调的内部数据结构。
 */
//declare class AbcTune {
//	/**
//	 * 版本号。
//	 */
//	version: string;

//	/**
//	 * 元数据文本，包含标题、作者等信息。
//	 */
//	metaText: { [key: string]: string };

//	/**
//	 * 格式化信息。
//	 */
//	formatting: { [key: string]: any };

//	/**
//	 * 曲调的行数据。
//	 */
//	lines: any[];

//	/**
//	 * 当前五线谱编号。
//	 */
//	staffNum: number;

//	/**
//	 * 当前声部编号。
//	 */
//	voiceNum: number;

//	/**
//	 * 当前行编号。
//	 */
//	lineNum: number;

//	/**
//	 * 重置 AbcTune 实例的状态。
//	 */
//	reset(): void;

//	/**
//	 * 清理数据，移除空白行并修复装饰线。
//	 */
//	cleanUp(): void;

//	/**
//	 * 获取当前行的最后一个音符。
//	 * @returns 最后一个音符元素，如果不存在则返回 null。
//	 */
//	getLastNote(): any | null;

//	/**
//	 * 给最后一个音符添加连音线。
//	 * @returns 如果成功添加连音线则返回 true，否则返回 false。
//	 */
//	addTieToLastNote(): boolean;

//	/**
//	 * 获取元素的持续时间。
//	 * @param el 元素对象。
//	 * @returns 持续时间，如果不存在则返回 。
//	 */
//	getDuration(el: any): number;

//	/**
//	 * 关闭当前行，设置光束的起始和结束。
//	 */
//	closeLine(): void;

//	/**
//	 * 向当前行添加元素。
//	 * @param type 元素类型。
//	 * @param startChar 起始字符。
//	 * @param endChar 结束字符。
//	 * @param hashParams 包含元素详细信息的哈希参数。
//	 */
//	appendElement(type: string, startChar: string | null, endChar: string | null, hashParams: any): void;

//	/**
//	 * 向当前行添加起始元素。
//	 * @param type 元素类型。
//	 * @param startChar 起始字符。
//	 * @param endChar 结束字符。
//	 * @param hashParams 包含元素详细信息的哈希参数。
//	 */
//	appendStartingElement(type: string, startChar: string | null, endChar: string | null, hashParams: any): void;

//	/**
//	 * 获取行数。
//	 * @returns 行数。
//	 */
//	getNumLines(): number;

//	/**
//	 * 添加副标题。
//	 * @param str 副标题文本。
//	 */
//	addSubtitle(str: string): void;

//	/**
//	 * 添加分隔符。
//	 * @param spaceAbove 分隔符上方的空间。
//	 * @param spaceBelow 分隔符下方的空间。
//	 * @param lineLength 分隔符的长度。
//	 */
//	addSeparator(spaceAbove: number, spaceBelow: number, lineLength: number): void;

//	/**
//	 * 添加文本。
//	 * @param str 文本内容。
//	 */
//	addText(str: string): void;

//	/**
//	 * 检查声部是否包含音符。
//	 * @param voice 声部对象。
//	 * @returns 如果包含音符则返回 true，否则返回 false。
//	 */
//	containsNotes(voice: any): boolean;

//	/**
//	 * 开始新的一行。
//	 * @param params 包含行参数的对象。
//	 */
//	startNewLine(params: any): void;

//	/**
//	 * 检查是否已经开始音乐。
//	 * @returns 如果已经开始音乐则返回 true，否则返回 false。
//	 */
//	hasBeginMusic(): boolean;

//	/**
//	 * 检查是否是第一行。
//	 * @param index 行索引。
//	 * @returns 如果是第一行则返回 true，否则返回 false。
//	 */
//	isFirstLine(index: number): boolean;

//	/**
//	 * 获取当前声部。
//	 * @returns 当前声部对象，如果不存在则返回 null。
//	 */
//	getCurrentVoice(): any | null;

//	/**
//	 * 设置当前声部。
//	 * @param staffNum 五线谱编号。
//	 * @param voiceNum 声部编号。
//	 */
//	setCurrentVoice(staffNum: number, voiceNum: number): void;

//	/**
//	 * 添加元数据文本。
//	 * @param key 元数据键。
//	 * @param value 元数据值。
//	 */
//	addMetaText(key: string, value: string): void;
//}


// abc_tune.ts: a computer usable internal structure representing one tune. 
// Copyright (C)  Paul Rosen (paul at paulrosen dot net) 
// 
// This program is free software: you can redistribute it and/or modify 
// it under the terms of the GNU General Public License as published by 
// the Free Software Foundation, either version  of the License, or 
// (at your option) any later version. 
// 
// This program is distributed in the hope that it will be useful, 
// but WITHOUT ANY WARRANTY; without even the implied warranty of 
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the 
// GNU General Public License for more details. 
// 
// You should have received a copy of the GNU General Public License 
// along with this program. If not, see <http://www.gnu.org/licenses/>. 




//interface AbcTune {
//	version: string;
//	metaText: MetaText;
//	formatting: {};
//	lines: Line[];
//	staffNum: number;
//	voiceNum: number;
//	lineNum: number;
//	reset(): void;
//	cleanUp(): void;
//	getLastNote(): Note | null;
//	addTieToLastNote(): boolean;
//	getDuration(el: Element): number;
//	closeLine(): void;
//	appendElement(type: string, startChar?: string, endChar?: string, hashParams: Element): void;
//	appendStartingElement(type: string, startChar?: string, endChar?: string, hashParams: Element): void;
//	getNumLines(): number;
//	addSubtitle(str: string): void;
//	addSeparator(spaceAbove: number, spaceBelow: number, lineLength: number): void;
//	addText(str: string): void;
//	containsNotes(voice: Voice): boolean;
//	startNewLine(params: {
//		clef: Clef;
//		key?: KeySig;
//		stem?: 'up' | 'down';
//		part?: string;
//		meter?: Meter;
//		name?: string;
//		subname?: string;
//		vocalfont?: string;
//		bracket?: boolean;
//		brace?: boolean;
//		connectBarLines?: boolean;
//	}): void;
//	hasBeginMusic(): boolean;
//	isFirstLine(index: number): boolean;
//	getCurrentVoice(): Voice | null;
//	setCurrentVoice(staffNum: number, voiceNum: number): void;
//	addMetaText(key: string, value: string): void;
//}

export class AbcTune {
	version: string = "1.0.0";
	metaText: MetaText = {};
	formatting: Formatting = {};
	lines: ABCLine[] = [];
	staffNum: number = 0;
	voiceNum: number = 0;
	lineNum: number = 0;
	potentialStartBeam: ABCBeamElem;
	potentialEndBeam: ABCBeamElem;

	reset() {
		this.version = "1.0.0";
		this.metaText = {};
		this.formatting = {};
		this.lines = [];
		this.staffNum = 0;
		this.voiceNum = 0;
		this.lineNum = 0;
	}

	cleanUp() {
		this.closeLine(); // Close the last line.
		// Remove any blank lines
		let anyDeleted = false;
		for (let i = 0; i < this.lines.length; i++) {
			if (this.lines[i].staff !== undefined) {
				let hasAny = false;
				for (let s = 0; s < this.lines[i].staff.length; s++) {
					if (this.lines[i].staff[s] === undefined) {
						anyDeleted = true;
						this.lines[i].staff[s] = null;
						//this.lines[i].staff[s] = { voices: []};	// TODO-PER: There was a part missing in the abc music. How should we recover?
					} else {
						for (let v = 0; v < this.lines[i].staff[s].voices.length; v++) {
							if (this.lines[i].staff[s].voices[v] === undefined)
								this.lines[i].staff[s].voices[v] = [];	// TODO-PER: There was a part missing in the abc music. How should we recover?
							else
								if (this.containsNotes(this.lines[i].staff[s].voices[v])) hasAny = true;
						}
					}
				}
				if (!hasAny) {
					this.lines[i] = null;
					anyDeleted = true;
				}
			}
		}
		if (anyDeleted) {
			this.lines = this.lines.filter(Boolean) as ABCLine[];
			this.lines.forEach(line => {
				if (line.staff) {
					line.staff = line.staff.filter(Boolean) as Staff[];
				}
			});
		}

		function cleanUpSlursInLine(voiceList: NoteElement[]) {
			let currSlur = 0;

			function addEndSlur(obj: any, num: number) {
				obj.endSlur = [];
				for (let i = 0; i < num; i++) {
					obj.endSlur.push(currSlur);
					if (currSlur > 0) --currSlur;
				}
			}

			function addStartSlur(obj: any, num: number) {
				obj.startSlur = [];
				for (let i = 0; i < num; i++) {
					++currSlur;
					obj.startSlur.push(currSlur);
				}
			}

			for (let i = 0; i < voiceList.length; i++) {
				let el = voiceList[i];
				if (el.el_type === 'note') {
					if (el.gracenotes) {
						for (let g of el.gracenotes) {
							if (g.endSlur) {
								addEndSlur(g, g.endSlur);
							}
							if (g.startSlur) {
								addStartSlur(g, g.startSlur);
							}
						}
					}
					if (el.endSlur) {
						addEndSlur(el, el.endSlur);
					}
					if (el.startSlur) {
						addStartSlur(el, el.startSlur);
					}
					if (el.pitches) {
						for (let p of el.pitches) {
							if (p.endSlur) {
								addEndSlur(p, p.endSlur);
							}
							if (p.startSlur) {
								addStartSlur(p, p.startSlur);
							}
						}
					}
				}
			}
		}



		function fixClefPlacement(el: ClefElement) {
			let min = -2;
			let max = 5;
			switch (el.typeClef) {
				case 'tenor': el.verticalPos += 2; min += 6; max += 6; break;
				case 'bass': el.verticalPos--; min += 6; max += 6; break;
				case 'alto': el.verticalPos -= 2; min += 4; max += 4; break;
				case 'treble+8': break;
				case 'tenor+8': el.verticalPos += 2; min += 6; max += 6; break;
				case 'bass+8': el.verticalPos--; min += 6; max += 6; break;
				case 'alto+8': el.verticalPos -= 2; min += 4; max += 4; break;
				case 'treble-8': break;
				case 'tenor-8': el.verticalPos += 2; min += 6; max += 6; break;
				case 'bass-8': el.verticalPos--; min += 6; max += 6; break;
				case 'alto-8': el.verticalPos -= 2; min += 4; max += 4; break;
			}
			if (el.verticalPos < min) {
				while (el.verticalPos < min) el.verticalPos += 7;
			} else if (el.verticalPos > max) {
				while (el.verticalPos > max) el.verticalPos -= 7;
			}
		}

		for (this.lineNum = 0; this.lineNum < this.lines.length; this.lineNum++) {
			if (this.lines[this.lineNum].staff) {
				for (this.staffNum = 0; this.staffNum < this.lines[this.lineNum].staff.length; this.staffNum++) {
					if (this.lines[this.lineNum].staff[this.staffNum].clef) {
						fixClefPlacement(this.lines[this.lineNum].staff[this.staffNum].clef);
					}
					for (this.voiceNum = 0; this.voiceNum < this.lines[this.lineNum].staff[this.staffNum].voices.length; this.voiceNum++) {
						cleanUpSlursInLine(this.lines[this.lineNum]);
						for (let j = 0; j < this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum].length; j++) {
							let el = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum][j];
							if (el.type === 'clef') {
								fixClefPlacement(el);
							}
						}
					}
				}
			}
		}

		// Remove temporary variables that the outside doesn't need to know about
		delete this.staffNum;
		delete this.voiceNum;
		delete this.lineNum;
	}


	getLastNote(): NoteElement {
		if (this.lines[this.lineNum] && this.lines[this.lineNum].staff &&
			this.getCurrentStaff() && this.getCurrentVoice()) {
			for (let i = this.getCurrentVoice().length - 1; i >= 0; i--) {
				const el = this.getCurrentVoice()[i];
				if (el.el_type === 'note') {
					return el;
				}
			}
		}
		return null;
	}

	addTieToLastNote(): boolean {
		// TODO-PER: if this is a chord, which note?
		let el = this.getLastNote();
		if (el && el.pitches[0]) {
			el.pitches[0].startTie = true;
			return true;
		}
		return false;
	}

	getDuration(el: NoteElement): number {
		if (el.duration)
			return el.duration;
		return;
	}

	closeLine() {
		if (this.potentialStartBeam && this.potentialEndBeam) {
			this.potentialStartBeam.startBeam = true;
			this.potentialEndBeam.endBeam = true;
		}
		delete this.potentialStartBeam;
		delete this.potentialEndBeam;
	}

	appendElement(type: string, startChar: number, endChar: number, hashParams?: ABCElement) {

		let This = this;
		function pushNote(hp: NoteElement) {
			if (hp.pitches !== undefined) {
				let mid = This.lines[This.lineNum].staff[This.staffNum].clef?.verticalPos ?? 0;
				hp.pitches.forEach(p => p.verticalPos = p.pitch - mid);
			}
			if (hp.gracenotes !== undefined) {
				let mid2 = This.lines[This.lineNum].staff[This.staffNum].clef?.verticalPos ?? 0;
				hp.gracenotes.forEach(p => p.verticalPos = p.pitch - mid2);
			}
			This.lines[This.lineNum].staff[This.staffNum].voices[This.voiceNum].push(hp);
		}

		hashParams.el_type = type;
		if (startChar !== null) hashParams.startChar = startChar;
		if (endChar !== null) hashParams.endChar = endChar;

		function endBeamHere() {
			This.potentialStartBeam.startBeam = true;
			hashParams.endBeam = true;
			delete This.potentialStartBeam;
			delete This.potentialEndBeam;
		}

		function endBeamLast() {
			if (This.potentialStartBeam !== undefined && This.potentialEndBeam !== undefined) {
				This.potentialStartBeam.startBeam = true;
				This.potentialEndBeam.endBeam = true;
			}
			delete This.potentialStartBeam;
			delete This.potentialEndBeam;
		}

		if (type === 'note') { // && (hashParams.rest !== undefined || hashParams.end_beam === undefined)) {
			// Now, add the startBeam and endBeam where it is needed.
			// end_beam is already set on the places where there is a forced end_beam. We'll remove that here after using that info.
			// this.potentialStartBeam either points to null or the start beam.
			// this.potentialEndBeam either points to null or the start beam.
			// If we have a beam break (note is longer than a quarter, or an end_beam is on this element), then set the beam if we have one.
			// reset the variables for the next notes.
			let dur = This.getDuration(hashParams);
			if (dur >= 0.25) {	// The beam ends on the note before this.
				endBeamLast();
			} else if (hashParams.end_beam && This.potentialStartBeam !== undefined) {
				if (hashParams.rest === undefined)
					endBeamHere();
				else
					endBeamLast();
			} else if (hashParams.rest === undefined) {	// this a short note and we aren't about to end the beam
				if (This.potentialStartBeam === undefined) {	// We aren't collecting notes for a beam, so start here.
					if (!hashParams.end_beam) {
						This.potentialStartBeam = hashParams;
						delete This.potentialEndBeam;
					}
				} else {
					This.potentialEndBeam = hashParams;	// Continue the beaming, look for the end next note.
				}
			}
		} else {	// It's not a note, so there definitely isn't beaming after it.
			endBeamLast();
		}

		delete hashParams.end_beam;	// We don't want this temporary variable hanging around.

		pushNote(hashParams);
	}

	appendStartingElement(type: string, startChar?: number, endChar?: number, hashParams2: ABCElement) {
		// Clone the object because it will be sticking around for the next line and we don't want the extra fields in it.
		let hashParams = { ...hashParams2 };
		// These elements should not be added twice, so if the element exists on this line without a note or bar before it, just replace the staff version.
		let voice = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum];
		for (let i = 0; i < voice.length; i++) {
			if (voice[i].el_type === 'note' || voice[i].el_type === 'bar') {
				hashParams.el_type = type;
				hashParams.startChar = startChar;
				hashParams.endChar = endChar;
				voice.push(hashParams);
				return;
			}
			if (voice[i].el_type === type) {
				hashParams.el_type = type;
				hashParams.startChar = startChar;
				hashParams.endChar = endChar;
				voice[i] = hashParams;
				return;
			}
		}
		// We didn't see either that type or a note, so replace the element to the staff.
		this.lines[this.lineNum].staff[this.staffNum][type] = hashParams2;
	}

	getNumLines(): number {
		return this.lines.length;
	}

	addSubtitle(str: string): void {
		this.lines.push({ subtitle: str });
	}

	addSeparator(spaceAbove?: number, spaceBelow?: number, lineLength?: number): void {
		this.lines.push({ separator: { spaceAbove, spaceBelow, lineLength } });
	}

	addText(str: string): void {
		this.lines.push({ text: str });
	}

	containsNotes(voice: NoteElement[]): boolean {
		return voice.some(v => v.el_type === 'note' ||
			v.el_type === 'bar');
	}



	startNewLine(params: {
		clef: ClefElement;
		key?: KeySigElement;
		stem?: 'up' | 'down';
		part?: string;
		meter?: MeterElement;
		name?: string;
		subname?: string;
		vocalfont?: string;
		bracket?: boolean;
		brace?: boolean;
		connectBarLines?: string;
	}): void {
		// If the pointed to line doesn't exist, just create that. If the line does exist, but doesn't have any music on it, just use it.
		// If it does exist and has music, then increment the line number. If the new element doesn't exist, create it.
		let This = this;
		this.closeLine();

		function createVoice(params: ABCElement) {
			This.lines[This.lineNum].staff[This.staffNum].voices[This.voiceNum] = [];
			if (This.isFirstLine(This.lineNum)) {
				if (params.name) {
					if (!This.lines[This.lineNum].staff[This.staffNum].title)
						This.lines[This.lineNum].staff[This.staffNum].title = [];
					This.lines[This.lineNum].staff[This.staffNum].title[This.voiceNum] = params.name;
				}
			} else {
				if (params.subname) {
					if (!This.lines[This.lineNum].staff[This.staffNum].title)
						This.lines[This.lineNum].staff[This.staffNum].title = [];
					This.lines[This.lineNum].staff[This.staffNum].title[This.voiceNum] = params.subname;
				}
			}
			if (params.stem)
				This.appendElement('stem', null, null, { direction: params.stem });
			else if (This.voiceNum > 0) {
				if (This.lines[This.lineNum].staff[This.staffNum].voices[0] !== undefined) {
					var found = false;
					for (var i = 0; i < This.lines[This.lineNum].staff[This.staffNum].voices[0].length; i++) {
						if (This.lines[This.lineNum].staff[This.staffNum].voices[0].el_type === 'stem')
							found = true;
					}
					if (!found) {
						var stem = { el_type: 'stem', direction: 'up' };
						This.lines[This.lineNum].staff[This.staffNum].voices[0].splice(0, 0, stem);
					}
				}
				This.appendElement('stem', null, null, { direction: 'down' });
			}
		};

		function createStaff(params:ParamsOther) {
			This.setCurrentStaff({ voices: [], clef: params.clef, key: params.key });
			if (params.vocalfont) This.getCurrentStaff().vocalfont = params.vocalfont;
			if (params.bracket) This.getCurrentStaff().bracket = params.bracket;
			if (params.brace) This.getCurrentStaff().brace = params.brace;
			if (params.connectBarLines) This.getCurrentStaff().connectBarLines = params.connectBarLines;
			createVoice(params);
			// Some stuff just happens for the first voice
			if (params.part)
				This.appendElement('part', params.startChar, params.endChar, { title: params.part });
			if (params.meter !== undefined)
				This.lines[This.lineNum].staff[This.staffNum].meter = params.meter;
		};

		function createLine(params: { clef: ClefElement; key?: KeySigElement }) {
			This.lines[This.lineNum] = { staff: [] };
			createStaff(params);
		}
		if (this.lines[this.lineNum] === undefined) createLine(params);
		else if (this.lines[this.lineNum].staff === undefined) {
			this.lineNum++;
			this.startNewLine(params);
		} else if (this.lines[this.lineNum].staff[this.staffNum] === undefined)
			createStaff(params);
		else if (this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum] === undefined)
			createVoice(params);
		else if (!this.containsNotes(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum]))
			return;
		else {
			this.lineNum++;
			this.startNewLine(params);
		}
	};

	hasBeginMusic(): boolean {
		return this.lines.length > 0;
	}

	isFirstLine(index: number): boolean {
		for (let i = index - 1; i >= 0; i--) {
			if (this.lines[i].staff !== undefined) return false;
		}
		return true;
	}

	getCurrentStaff(): Staff {
		if (this.lines[this.lineNum] !== undefined &&
			this.lines[this.lineNum].staff[this.staffNum] !== undefined)
			return this.lines[this.lineNum].staff[this.staffNum];
		else
			return null;
	}


	getCurrentVoice(): NoteElement[] {
		if (this.lines[this.lineNum] !== undefined &&
			this.lines[this.lineNum].staff[this.staffNum] !== undefined &&
			this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum] !== undefined)
			return this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum];
		else return null;
	};

	setCurrentStaff(opt: any): Staff {
		if (this.lines[this.lineNum] !== undefined &&
			this.getCurrentStaff() !== undefined)
			return this.lines[this.lineNum].staff[this.staffNum] = opt;
		else
			return null;
	}

	setCurrentVoice(staffNum: number, voiceNum: number): void {
		this.staffNum = staffNum;
		this.voiceNum = voiceNum;
		let i
		for (i = 0; i < this.lines.length; i++) {
			if (this.lines[i].staff) {
				if (this.lines[i].staff[staffNum] === undefined ||
					this.lines[i].staff[staffNum].voices[voiceNum] === undefined ||
					!this.containsNotes(this.lines[i].staff[staffNum].voices[voiceNum])) {
					this.lineNum = i;
					return;
				}
			}
		}
		this.lineNum = i;
	};

	addMetaText(key: string, value: string): void {
		if (this.metaText[key] === undefined)
			this.metaText[key] = value;
		else
			this.metaText[key] += "\n" + value;
	}
}
