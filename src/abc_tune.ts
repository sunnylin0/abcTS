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




export class AbcTune {
	/** 版本號碼。 */
	version: string = "1.0.0";
	/** 元資料文字，包含標題、作者等資訊 */
	metaText: MetaText = {};
	formatting: Formatting = {};
	/** 曲調的行資料 */
	lines: ABCLine[] = [];
	/** 目前五線譜編號 */
	staffNum: number = 0;
	/** 當前聲部編號 */
	voiceNum: number = 0;
	/** 當前行 編號 */
	lineNum: number = 0;
	potentialStartBeam: ABCElement;
	potentialEndBeam: ABCElement;
	/** 重置AbcTune物件的狀態 */
	reset() {
		this.version = "1.0.0";
		this.metaText = {};
		this.formatting = {};
		this.lines = [];
		this.staffNum = 0;
		this.voiceNum = 0;
		this.lineNum = 0;
	}
	/** 清理AbcTune物件中的資料 ，刪除空白行並修復裝飾線。 */
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

		function cleanUpSlursInLine(voiceList: NOTES_Element[]) {
			let currSlur: number[] = [];

			function addEndSlur(obj: NoteElement | Pitch | GraceNote, num: number | number[], chordPos: number) {
				obj.endSlur = [];
				if (currSlur[chordPos] === undefined)
					currSlur[chordPos] = chordPos * 100;
				const count = typeof num === 'number' ? num : num.length;
				for (let i = 0; i < count; i++) {
					obj.endSlur.push(currSlur[chordPos]);
					if (currSlur[chordPos] > 0) --currSlur[chordPos];
				}
			}

			function addStartSlur(obj: NOTES_Element | Pitch | GraceNote, num: number | number[], chordPos: number) {
				obj.startSlur = [];
				if (currSlur[chordPos] === undefined) {
					currSlur[chordPos] = chordPos * 100;
				}
				const count = typeof num === 'number' ? num : num.length;
				for (let i = 0; i < count; i++) {
					++currSlur[chordPos];
					obj.startSlur.push(currSlur[chordPos]);
				}
			}

			for (let i = 0; i < voiceList.length; i++) {
				let el = voiceList[i];
				if (el.el_type === 'note') {
					if (el.gracenotes) {
						for (let g of el.gracenotes) {
							if (g.endSlur) {
								addEndSlur(g, g.endSlur, 1);
							}
							if (g.startSlur) {
								addStartSlur(g, g.startSlur, 1);
							}
						}
					}
					if (el.endSlur) {
						addEndSlur(el, el.endSlur, 1);
					}
					if (el.startSlur) {
						addStartSlur(el, el.startSlur, 1);
					}
					if (el.pitches) {
						for (let p = 0; p < el.pitches.length; p++) {
							let pitch = el.pitches[p];
							if (pitch.endSlur) {
								addEndSlur(pitch, pitch.endSlur, p + 1);
							}
							if (pitch.startSlur) {
								addStartSlur(pitch, pitch.startSlur, p + 1);
							}
						}
					}
				}
			}
		}



		function fixClefPlacement(el: ClefElement) {
			let min = -2;
			let max = 5;
			switch (el.type) {
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
						cleanUpSlursInLine(this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum]);
						for (let j = 0; j < this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum].length; j++) {
							let el = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum][j];
							if (el.el_type === 'clef') {
								fixClefPlacement(el as unknown as ClefElement);
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

	/**
	* 取得目前行的最後一個對話。
	* @returns 最後一個通訊元素，如果不存在則傳回 null。
	*/
	getLastNote(): NOTES_Element | null {
		if (this.lines[this.lineNum] && this.lines[this.lineNum].staff &&
			this.getCurrentStaff() && this.getCurrentVoice()) {
			for (let i = this.getCurrentVoice().length - 1; i >= 0; i--) {
				const el: NOTES_Element = this.getCurrentVoice()[i];
				if (el.el_type === 'note') {
					return el;
				}
			}
		}
		return null;
	}
	/**
	* 將最後一個註解元素加入連音線。
	* @returns 如果新增連音線成功則傳回 true，否則傳回 false。
	*/
	addTieToLastNote(): boolean {
		// TODO-PER: if this is a chord, which note?
		let el: NOTES_Element = this.getLastNote();
		if (el && el.pitches[0]) {
			el.pitches[0].startTie = true;
			return true;
		}
		return false;
	}
	/**
	* 取得元素的持續時間。
	* @param el 元素物件。
	* @returns 持續時間，如果不存在則傳回 {} 。
	*/
	getDuration(el: ABCElement): number {
		if (el.duration)
			return el.duration;
		return;
	}
	/** 關閉目前行，處理可能的開始和結束對話 */
	closeLine() {
		if (this.potentialStartBeam && this.potentialEndBeam) {
			this.potentialStartBeam.startBeam = true;
			this.potentialEndBeam.endBeam = true;
		}
		delete this.potentialStartBeam;
		delete this.potentialEndBeam;
	}
	/**
	* 在目前行新增元素。
	* @param type 元素型別。
	* @param startChar 起始字元。
	* @param endChar 結束字元。
	* @param hashParams 包含元素詳細資訊的雜湊參數。
	*/
	appendElement(type: ElementType, startChar: number, endChar: number, hashParams2?: ABCElement) {
		let hashParams: ABCElement = hashParams2 || {};
		let This = this;
		function pushNote(hp: ABCElement) {
			if (hp.pitches !== undefined) {
				let mid = This.lines[This.lineNum].staff[This.staffNum].clef?.verticalPos ?? 0;
				hp.pitches.forEach((p: Pitch) => p.verticalPos = (p.pitch ?? 0) - mid);
			}
			if (hp.gracenotes !== undefined) {
				let mid2 = This.lines[This.lineNum].staff[This.staffNum].clef?.verticalPos ?? 0;
				hp.gracenotes.forEach((p: GraceNote) => p.verticalPos = (p.pitch ?? 0) - mid2);
			}
			This.lines[This.lineNum].staff[This.staffNum].voices[This.voiceNum].push(hp as NOTES_Element);
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
			} else if (hashParams.force_end_beam_last && This.potentialStartBeam !== undefined) {
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
		delete hashParams.force_end_beam_last;	// We don't want this temporary variable hanging around.

		pushNote(hashParams);
	}
	/**
	* 在目前行新增起始元素。
	* @param type 元素型別。
	* @param startChar 起始字元。
	* @param endChar 結束字元。
	* @param hashParams 包含元素詳細資訊的雜湊參數。
	*/
	appendStartingElement(type: ElementType, startChar?: number, endChar?: number, hashParams2?: ABCElement) {
		// Clone the object because it will be sticking around for the next line and we don't want the extra fields in it.
		let hashParams: ABCElement = hashParams2 ? { ...hashParams2 } : {};
		// These elements should not be added twice, so if the element exists on this line without a note or bar before it, just replace the staff version.
		let voice = this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum];
		for (let i = 0; i < voice.length; i++) {
			if (voice[i].el_type === 'note' || voice[i].el_type === 'bar') {
				hashParams.el_type = type;
				hashParams.startChar = startChar;
				hashParams.endChar = endChar;
				voice.push(hashParams as NOTES_Element);
				return;
			}
			if (voice[i].el_type === type) {
				hashParams.el_type = type;
				hashParams.startChar = startChar;
				hashParams.endChar = endChar;
				voice[i] = hashParams as NOTES_Element;
				return;
			}
		}
		// We didn't see either that type or a note, so replace the element to the staff.
		(this.lines[this.lineNum].staff[this.staffNum] as any)[type] = hashParams2;
	}
	/**
	* 取得行數。
	* @returns 行數。
	*/
	getNumLines(): number {
		return this.lines.length;
	}
	/**
	* 新增副標題。
	* @param str 副標題文字。
	*/
	addSubtitle(str: string): void {
		this.lines.push({ subtitle: str });
	}
	/**
	* 新增分隔符號。
	* @param spaceAbove 分區符號上方的空間。
	* @param spaceBelow 分隔符號下方的空間。
	* @param lineLength 分隔符號的長度。
	*/
	addSeparator(spaceAbove?: number, spaceBelow?: number, lineLength?: number): void {
		this.lines.push({ separator: { spaceAbove, spaceBelow, lineLength } });
	}
	/**
	* 新增文字。
	* @param str 文字內容。
	*/
	addText(str: string): void {
		this.lines.push({ text: str });
	}
	/**
	* 檢查聲部是否包含音符。
	* @param voice 聲部物件。
	* @returns 如果包含音符則傳回 true，否則傳回 false。
	*/
	containsNotes(voice: NOTES_Element[]): boolean {
		return voice.some(v => v.el_type === 'note' ||
			v.el_type === 'bar');
	}
	/**
	* 開始新的一行。
	* @param params 包含行參數的物件。
	*/
	startNewLine(params: ParamsOther): void {
		// If the pointed to line doesn't exist, just create that. If the line does exist, but doesn't have any music on it, just use it.
		// If it does exist and has music, then increment the line number. If the new element doesn't exist, create it.
		let This = this;
		this.closeLine();

		function createVoice(params: ParamsOther) {
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
						if (This.lines[This.lineNum].staff[This.staffNum].voices[0][i].el_type === 'stem')
							found = true;
					}
					if (!found) {
						var stem: StemElement = { el_type: 'stem', direction: 'up' };
						This.lines[This.lineNum].staff[This.staffNum].voices[0].splice(0, 0, stem);
					}
				}
				This.appendElement('stem', null, null, { direction: 'down' });
			}
		};

		function createStaff(params: ParamsOther) {
			This.setCurrentStaff({ voices: [], clef: params.clef, key: params.key });
			if (params.vocalfont) This.getCurrentStaff().vocalfont = params.vocalfont;
			if (params.bracket) This.getCurrentStaff().bracket = params.bracket;
			if (params.brace) This.getCurrentStaff().brace = params.brace;
			if (params.connectBarLines) This.getCurrentStaff().connectBarLines = params.connectBarLines;
			if (params.jianpuOctave !== undefined) This.getCurrentStaff().jianpuOctave = params.jianpuOctave;
			createVoice(params);
			// Some stuff just happens for the first voice
			if (params.part)
				This.appendElement('part', params.startChar, params.endChar, { title: params.part });
			if (params.meter !== undefined)
				This.lines[This.lineNum].staff[This.staffNum].meter = params.meter;
		};

		function createLine(params: ParamsOther) {
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
	/**
	* 檢查是否已經開始音樂。
	* @returns 如果已經開始音樂則傳回 true，否則傳回 false。
	*/
	hasBeginMusic(): boolean {
		return this.lines.length > 0;
	}
	/**
	* 檢查是否為第一行。
	* @param 索引行索引。
	* @returns 如果是第一行則傳回 true，否則傳回 false。
	*/
	isFirstLine(index: number): boolean {
		for (let i = index - 1; i >= 0; i--) {
			if (this.lines[i].staff !== undefined) return false;
		}
		return true;
	}
	/** 取得目前 Staff */
	getCurrentStaff(): Staff {
		if (this.lines[this.lineNum] !== undefined &&
			this.lines[this.lineNum].staff[this.staffNum] !== undefined)
			return this.lines[this.lineNum].staff[this.staffNum];
		else
			return null;
	}
	/**
	* 取得目前聲部。
	* @returns 目前聲部對象，如果不存在則傳回null。
	*/
	getCurrentVoice(): NOTES_Element[] {
		if (this.lines[this.lineNum] !== undefined &&
			this.lines[this.lineNum].staff[this.staffNum] !== undefined &&
			this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum] !== undefined)
			return this.lines[this.lineNum].staff[this.staffNum].voices[this.voiceNum];
		else return null;
	};
	/** 設定目前 Staff */
	setCurrentStaff(opt: Staff): Staff {
		if (this.lines[this.lineNum] !== undefined &&
			this.getCurrentStaff() !== undefined)
			return this.lines[this.lineNum].staff[this.staffNum] = opt;
		else
			return null;
	}
	/**
	* 設定當前聲部。
	* @param staffNum 五線譜編號。
	* @param voiceNum 聲部編號。
	*/
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
	/**
	* 新增元資料文字。
	* @param key 元資料鍵。
	* @param value 元資料值。
	*/
	addMetaText(key: keyof MetaText, value: string): void {
		if (this.metaText[key] === undefined)
			this.metaText[key] = value;
		else
			this.metaText[key] += "\n" + value;
	}
}
