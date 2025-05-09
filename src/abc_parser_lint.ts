/**
 * @author paulrosen
 *
 * This file takes as input the output of AbcParser and analyzes it to make sure there are no
 * unexpected elements in it. It also returns a person-readable version of it that is suitable
 * for regression tests.
 */

/*global Class */
/*extern AbcParserLint */


//interface MeterInfo {
//	type: 'C' | 'C|' | 'fraction';
//	value?: string;
//}


//interface KeyInfo {
//	type: 'major' | 'minor';
//	accidentals?: Accidental[];
//	startChar: number;
//	endChar: number;
//}


//interface NoteInfo {
//	pitch: string;
//	duration: number;
//	grace?: GraceNote;
//	slur?: boolean;
//	startChar: number;
//}


///* 基础类型定义 */
//declare type ParsePosition = {
//	startChar: number;
//	endChar: number;
//	line?: number;
//};

//declare type ValidationError = {
//	code: number;
//	message: string;
//	position: ParsePosition;
//};

///* 解析器配置接口 */
//declare interface ParserConfig {
//	strictMode: boolean;
//	allowUnknownProperties: boolean;
//	maxNestingDepth: number;
//}


///* 主解析器类声明 */
//declare class AbcParserLint {
//	constructor(config?: Partial<ParserConfig>);

//	parse(input: string): ParseResult;
//	addError(error: ValidationError): void;
//	addOutput(message: string, indentLevel?: number): void;

//	/* 核心解析方法 */
//	private parseKey(obj: KeyInfo): void;
//	private parseBar(obj: BarInfo): void;
//	private parseNote(obj: NoteInfo): void;
//	private parseStaff(obj: StaffInfo): void;
//}



//declare interface StaffInfo extends ParsePosition {
//	lines: LineInfo[];
//	clef?: ClefType;
//}

//declare interface LineInfo {
//	elements: (NoteInfo | BarInfo)[];
//	lineNumber: number;
//}

///* 复合结构接口 */
//declare interface KeyInfo extends ParsePosition {
//	type: 'major' | 'minor';
//	accidentals?: Accidental[];
//}

//declare interface BarInfo extends ParsePosition {
//	type: 'single' | 'repeat';
//	repeatCount?: number;
//}

//declare interface NoteInfo extends ParsePosition {
//	pitch: string;
//	duration: number;
//	grace?: GraceNote;
//	slur?: boolean;
//}

///* 为可能的外部依赖声明类型 */
//declare module 'abc-music-notation' {
//	export interface Accidental {
//		symbol: string;
//		alter: number;
//	}

//	export type GraceNote = {
//		type: 'appoggiatura' | 'acciaccatura';
//		durationRatio: number;
//	};
//}

/////* 扩展原始解析器的验证逻辑 */
////declare namespace AbcParserLint {
////	interface ValidationRules {
////		checkNoteDuration(note: NoteInfo): boolean;
////		validateKeyAccidentals(key: KeyInfo): ValidationError[];
////	}
////}

//declare type ParseResult<T = unknown> = {
//	ast: T;
//	errors: ValidationError[];
//	warnings: string[];
//	metadata: {
//		parseTime: number;
//		memoryUsage: number;
//	};
//};

//declare type ParserMethod =
//	| 'parseKey'
//	| 'parseBar'
//	| 'parseNote'
//	| 'parseStaff';


class AbcParserLint {
	private errors: string[] = [];
	private output: string[] = [];

	private addError(str: string, indent: number = 0): void {
		this.errors.push(str);
	}

	private addOutput(str: string, indent: number = 0): void {
		let spacing = "\t".repeat(indent);
		this.output.push(spacing + str);
		if (str.indexOf("[object Object]") >= 0)
			this.addError("Object not expanded: " + str);
		if (str.indexOf("undefined") >= 0)
			this.addError("property undefined: " + str);
	};

	private needs(obj: any, attr: string, name: string): void {
		if (obj[attr] === undefined) {
			this.addError(`${name} must contain: ${attr}`);
		}
	}

	private lacks(obj: any, attr: string, name: string): void {
		if (obj[attr] !== undefined) {
			this.addError(`${name} cannot contain: ${attr}`);
		}
	}

	private onlyArray(obj: any, name: string): void {
		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			const t = typeof obj[property];
			if (t !== 'function') {
				const index = parseInt(property, 10);
				if (index === 0 && property !== '0') {
					this.addError(`${name} should not contain: ${property}`);
				}
			}
		});
	}



	private onlyContains(name: string, obj: any, arr: string[]): void {
		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			const t = typeof obj[property];
			if (t !== 'function') {
				if (!arr.includes(property)) {
					this.addError(`${name} cannot contain: ${property}`);
				}
			}
		});
	}

	private parseMetaText(obj: any): void {
		this.addOutput("MetaText:", 0);
		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			const t = typeof obj[property];
			if (t !== 'function') {
				switch (property) {
					case 'title':
					case 'notes':
					case 'origin':
					case 'rhythm':
					case 'author':
					case 'composer':
					case 'url':
					case 'history':
					case 'discography':
					case 'source':
					case 'book':
					case 'partOrder':
					case 'transcription':
					case 'unalignedWords':
						this.addOutput(`${property}: ${obj[property]}`, 1);
						break;
					case 'tempo':
						this.addOutput(`${property}: duration = ${obj[property].duration} bpm = ${obj[property].bpm} `, 1);
						this.onlyContains("tempo", obj[property], ['duration', 'bpm']);
						break;
					default:
						this.addError(`MetaText should not contain: ${property} `);
				}
			}
		});
	}

	private parseFormatting(obj: any): void {
		this.addOutput("Formatting:", 0);
		const formattingKeys = [
			'stretchlast', 'staffwidth', 'scale', 'sep', 'score', 'indent', 'voicefont',
			'titlefont', 'barlabelfont', 'barnumfont', 'barnumberfont', 'barnumbers',
			'topmargin', 'botmargin', 'topspace', 'titlespace', 'subtitlespace',
			'composerspace', 'musicspace', 'partsspace', 'wordsspace', 'textspace',
			'vocalspace', 'staffsep', 'linesep', 'midi', 'titlecaps', 'titlefont',
			'composerfont', 'indent', 'playtempo', 'auquality', 'text', 'begintext',
			'endtext', 'vocalfont', 'systemsep', 'sysstaffsep', 'landscape',
			'gchordfont', 'leftmargin', 'partsfont', 'staves', 'slurgraces',
			'titleleft', 'subtitlefont', 'tempofont', 'continuous', 'botspace',
			'nobarcheck'
		];

		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			const t = typeof obj[property];
			if (t !== 'function') {
				const lowerProperty = property.toLowerCase();
				if (formattingKeys.includes(lowerProperty)) {
					this.addOutput(`${property}: ${obj[property]} `, 1);
				} else {
					this.addError(`Formatting should not contain: ${property} `);
				}
			}
		});
	}

	private parseClef(obj: any): void {
		const name = "Clef";
		this.addOutput(`${name}: (${obj.startChar},${obj.endChar})`, 3);
		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			const t = typeof obj[property];
			if (t !== 'function') {
				switch (property) {
					case 'type':
						this.addOutput(`${property}: ${obj[property]} `, 4);
						break;
					case 'startChar':
					case 'endChar':
					case 'el_type':
						break;
					default:
						this.addError(`${name} should not contain: ${property} `);
				}
			}
		});
	}


	private parseRegularKey(obj: any): void {
		const name = "Regular Key";
		const regularKeys = ["num", "acc"]
		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			var t = typeof obj[property];
			if (t !== 'function') {
				switch (property) {
					case 'num': break;
					case 'acc': break;
					default:
						this.addError(name + " should not contain: " + property);
				}
			}
		});
		this.needs(obj, "num", name);
		this.needs(obj, "acc", name);
		this.addOutput("(" + obj.num + ", " + obj.acc + ")", 4);
	}

	private parseGrace(obj: any): void {
		const name = "Gracenote";
		this.onlyArray(obj, name);
		obj.forEach(el => {
			this.addOutput(el.el_type + " " + el.pitch, 5);
		});
	}

	private parseKey(obj: any): void {
		const name = "Key";
		this.addOutput(name + ": (" + obj.startChar + "," + obj.endChar + ")", 3);
		var processExtraAccidentals = function (obj, property) {
			var strAcc = "";
			obj[property].each(function (o) {
				this.onlyContains(property, o, ["acc", 'note']);
				strAcc += o.acc + " " + o.note + " ";
			});
			return strAcc;
		};

		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			var t = typeof obj[property];
			if (t !== 'function') {
				switch (property) {
					case 'regularKey':
						this.parseRegularKey(obj[property]); break;
					case 'extraAccidentals':
						this.onlyArray(property, obj[property]);
						var strAcc = processExtraAccidentals(obj, property);
						this.addOutput(property + ": " + strAcc, 4);
						break;
					case 'startChar':
					case 'endChar':
					case 'el_type': break;
					default:
						this.addError(name + " should not contain: " + property);
				}
			}
		});
	};

	private parseMeter(obj: any): void {
		const name = "Meter";
		this.addOutput(`${name}:`, 3);

		if (!obj.type) this.addError(`${name} 缺少必要属性: type`);

		switch (obj.type) {
			case 'fraction':
				this.addOutput(`分数拍号: ${obj.value}`, 4);
				if (!obj.value?.match(/^\d+\/\d+$/)) {
					this.addError("无效分数拍号格式");
				}
				break;
			case 'C':
			case 'C|':
				this.addOutput(`符号拍号: ${obj.type}`, 4);
				break;
			default:
				this.addError(`未知拍号类型: ${obj.type}`);
		}
	}

	private parseBar(obj: any): void {
		const name = "Bar";
		this.addOutput(`${name}: ${obj.type}`, 3);

		const keys = Object.keys(obj).sort()
		keys.forEach(property => {
			switch (property) {
				case 'type':
				case 'decoration':
				case 'number':
					this.addOutput(property + ": " + obj[property], 4);
					break;
				case 'chord':
					this.onlyContains(property, obj[property], ['name', 'position']);
					this.addOutput(property + ": " + obj[property].name + " " + obj[property].position, 4);
					break;
				case 'startChar':
				case 'endChar':
				case 'el_type':
					break;
				default:
					this.addError(name + " should not contain: " + property);
			}
		});
	};
	private parseNote(obj: any): void {
		const name = "Note";
		this.addOutput(`${name}: ${obj.pitch}@${obj.duration}`, 3);

		this.needs(obj, 'pitch', name); // 强制要求音高属性

		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			const t = obj[property ];
			if (typeof t === 'function') return;
			if (t !== 'function') {
				switch (property) {
					case 'pitch':
					case 'duration':
					case 'end_beam':
					case 'startSlur':
					case 'endSlur':
					case 'startTriplet':
					case 'endTriplet':
					case 'startTie':
					case 'endTie':
					case 'decoration':
					case 'accidental':
					case 'rest_type':
						this.addOutput(property + ": " + obj[property], 4);
						break;
					case 'lyric':
						this.onlyContains(property, obj[property], ['divider', 'syllable']);
						this.addOutput(property + ": " + obj[property].syllable + " div=" + obj[property].divider, 4);
						break;
					case 'gracenotes':
						this.parseGrace(obj[property]); break;
					case 'chord':
						this.onlyContains(property, obj[property], ['name', 'position']);
						this.addOutput(property + ": " + obj[property].name + " " + obj[property].position, 4);
						break;
					case 'pitches':
						this.onlyArray(obj[property], property);
						for (var i = 0; i < obj[property].length; i++) {
							var pitch = obj[property][i];
							this.onlyContains('pitches[' + i + ']', pitch, ['pitch', 'duration', 'endChar', 'startTie', 'endTie', 'startSlur', 'endSlur', 'accidental']);
							var str = property + ": p=" + pitch.pitch;
							if (pitch.accidental !== undefined) str += ' a: ' + pitch.accidental;
							str += " d=" + pitch.duration;
							if (pitch.startTie === true) str += " startTie";
							if (pitch.endTie === true) str += " endTie";
							this.addOutput(str, 5);
						}
						break;
					case 'startChar':
					case 'endChar':
					case 'el_type': break;
					default:
						this.addError(name + " should not contain: " + property);
				}
			}
		});
	};

	private parseStaff(obj: any): void {
		const name = "Staff";
		this.addOutput(`${name}:`, 2);

		this.onlyArray(obj, "Staff");

		obj.forEach(el => {
			var ty = el.el_type;
			switch (ty) {
				case "part":
					this.onlyContains(ty, el, ['el_type', 'title', 'startChar', 'endChar']);
					this.addOutput("Part: " + el.title, 3);
					break;
				case "clef": this.parseClef(el); break;
				case "key": this.parseKey(el); break;
				case "meter": this.parseMeter(el); break;
				case "note": this.parseNote(el); break;
				case "bar": this.parseBar(el); break;
				default:
					this.addError("No staff element type of: " + ty);
			}
			if (el.startChar === undefined)
				this.addError("All elements need a startChar: " + el.el_type);
			if (el.endChar === undefined)
				this.addError("All elements need an endChar:" + el.el_type);
		});
	};

	private parseLine(obj: any, index: number): void {
		const name = "Line";
		this.addOutput(`${name} ${index + 1} :`, 4);

		const keys = Object.keys(obj).sort();
		keys.forEach(property => {
			var t = typeof obj[property];
			if (t !== 'function') {
				switch (property) {
					case 'staff':
						this.parseStaff(obj[property]);
						break;
					case 'subtitle':
						this.addOutput("Subtitle: " + obj[property]);
						break;
					default:
						this.addError("Line should not contain: " + property);
				}
			}
		});
	};


	private parseLines(obj: any): void {
		const name = "Lines";
		this.addOutput(`${name}:`, 0);

		const keys = Object.keys(obj);//.sort();
		keys.forEach(property => {
			var t = typeof obj[property];
			if (t !== 'function') {
				var index = parseInt(property);
				if (index === 0 && property !== '0')
					this.addError("Lines should not contain: " + property);
				else {
					this.parseLine(obj[index], index);
				}
			}
		});
	};
	public lint(tune: any, warnings?: string[]): string {
		this.errors = [];
		this.output = [];

		const keys = Object.keys(tune).sort();
		keys.forEach(property => {
			const t = typeof tune[property];
			if (t !== 'function') {
				switch (property) {
					case 'metaText': this.parseMetaText(tune[property]); break;
					case 'formatting': this.parseFormatting(tune[property]); break;
					case 'lines': this.parseLines(tune[property]); break;
					default:
						this.addError(`tune should not contain: ${property} `);
				}
			}
		});

		let warn = warnings ? warnings.join('\n') : "No errors";
		warn = warn.replace(/<span style="text-decoration:underline;font-size:1.3em;font-weight:bold;">/g, '$$$$');
		warn = warn.replace(/<\/span>/g, '$$$$');

		return `Error: ------\n${this.errors.join('\n')} \nObj: -------\n${this.output.join('\n')} \nWarn: ------\n${warn} `;
	}



}
