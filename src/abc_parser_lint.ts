//    abc_parser_lint.js: Analyzes the output of abc_parse.
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

//This file takes as input the output of AbcParser and analyzes it to make sure there are no
//unexpected elements in it. It also returns a person-readable version of it that is suitable
//for regression tests.

/*global Class */
/*global JSONSchema */
/*extern AbcParserLint */

//declare const Class: any; // Assume Class is from a library like Prototype.js, need a declaration for TypeScript
declare const jsonSchema: JSONSchema.Schema; // Assume JSONSchema is a validation library, need a declaration for TypeScript


export class AbcParserLint {
	decorationList;
	tempoProperties;
	fontType;
	clefProperties;
	barProperties;
	noteProperties;
	keyProperties;
	meterProperties;
	voiceItem;
	musicSchema;
	constructor() {
		this.decorationList = {
			type: 'array', optional: true, items: {
				type: 'string', Enum: [
					"trill", "lowermordent", "uppermordent", "mordent", "pralltriller", "accent",
					"emphasis", "fermata", "invertedfermata", "tenuto", "0", "1", "2", "3", "4", "5", "+", "wedge",
					"open", "thumb", "snap", "turn", "roll", "breath", "shortphrase", "mediumphrase", "longphrase",
					"segno", "coda", "D.S.", "D.C.", "fine", "crescendo(", "crescendo)", "diminuendo(", "diminuendo)",
					"p", "pp", "f", "ff", "mf", "ppp", "pppp", "fff", "ffff", "sfz", "repeatbar", "repeatbar2", "slide",
					"upbow", "downbow", "staccato"
				]
			}
		};
		this.tempoProperties = {
			duration: { type: "array", optional: true, output: "join", requires: ['bpm'], items: { type: "number" } },
			bpm: { type: "number", optional: true, requires: ['duration'] },
			preString: { type: 'string', optional: true },
			postString: { type: 'string', optional: true }
		};
		this.fontType = {
			type: 'object', optional: true, properties: {
				font: { type: 'string', optional: true },
				size: { type: 'number', optional: true }
			}
		};
		this.clefProperties = {
			type: { type: 'string', Enum: ['treble', 'tenor', 'bass', 'alto', 'treble+8', 'tenor+8', 'bass+8', 'alto+8', 'treble-8', 'tenor-8', 'bass-8', 'alto-8', 'none'] },
			middle: { type: 'number', minimum: -20, maximum: 8 } // the pitch that goes in the middle of the staff C=0
		};
		this.barProperties = {
			chord: {
				type: 'object', optional: true, properties: {
					name: { type: 'string' },
					position: { type: 'string' }
				}
			},
			decoration: this.decorationList,
			endEnding: { type: 'boolean', Enum: [true], optional: true },
			startEnding: { type: 'string', optional: true },
			type: { type: 'string', Enum: ['bar_dbl_repeat', 'bar_right_repeat', 'bar_left_repeat', 'bar_invisible', 'bar_thick_thin', 'bar_thin_thin', 'bar_thin', 'bar_thin_thick'] }
		};
		this.noteProperties = {
			barNumber: { type: 'number', optional: true },
			chord: {
				type: 'object', optional: true, properties: {
					name: { type: 'string' },
					position: { type: 'string' }
				}
			},
			decoration: this.decorationList,
			duration: { type: 'number' },
			endBeam: { type: 'boolean', Enum: [true], prohibits: ['startBeam'], optional: true },
			endSlur: { type: 'array', optional: true, output: "join", items: { type: 'number', minimum: 0 } },
			endTriplet: { type: 'boolean', Enum: [true], optional: true },
			gracenotes: {
				type: 'array', optional: true, output: "noindex", items: {
					type: "object", properties: {
						accidental: { type: 'string', Enum: ['sharp', 'flat', 'natural', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp'], optional: true },
						duration: { type: 'number' },
						end_beam: { type: 'boolean', Enum: [true], optional: true },
						endSlur: { type: 'array', optional: true, output: "join", items: { type: 'number', minimum: 0 } },
						endTie: { type: 'boolean', Enum: [true], optional: true },
						pitch: { type: 'number' },
						verticalPos: { type: 'number' },
						startSlur: { type: 'array', optional: true, output: "join", items: { type: 'number', minimum: 0 } },
						startTie: { type: 'boolean', Enum: [true], optional: true }
					}
				}
			},
			lyric: {
				type: 'array', optional: true, output: "noindex", items: {
					type: 'object', properties: {
						syllable: { type: 'string' },
						divider: { type: 'string', Enum: ['-', ' ', '_'] }
					}
				}
			},
			pitches: {
				type: 'array', optional: true, output: "noindex", prohibits: ['rest'], items: {
					type: 'object', properties: {
						accidental: { type: 'string', Enum: ['sharp', 'flat', 'natural', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp'], optional: true },
						endSlur: { type: 'array', optional: true, output: "join", items: { type: 'number', minimum: 0 } },
						endTie: { type: 'boolean', Enum: [true], optional: true },
						pitch: { type: 'number' },
						verticalPos: { type: 'number' },
						startSlur: { type: 'array', optional: true, output: "join", items: { type: 'number', minimum: 0 } },
						startTie: { type: 'boolean', Enum: [true], optional: true }
					}
				}
			},
			rest: {
				type: 'object', optional: true, prohibits: ['pitches', 'lyric'], properties: {
					type: { type: 'string', Enum: ['invisible', 'spacer', 'rest'] },
					endTie: { type: 'boolean', Enum: [true], optional: true },
					startTie: { type: 'boolean', Enum: [true], optional: true }
				}
			},
			startBeam: { type: 'boolean', Enum: [true], prohibits: ['endBeam'], optional: true },
			startSlur: { type: 'array', optional: true, output: "join", items: { type: 'number', minimum: 0 } },
			startTriplet: { type: 'number', minimum: 2, maximum: 9, optional: true }
		};
		this.keyProperties = {
			extraAccidentals: {
				type: 'array', optional: true, output: "noindex", items: {
					type: 'object', properties: {
						acc: { type: 'string', Enum: ['flat', 'natural', 'sharp', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp'] },
						note: { type: 'string', Enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'a', 'b', 'c', 'd', 'e', 'f', 'g'] },
						verticalPos: { type: 'number', minimum: 0, maximum: 13 }
					}
				}
			}
		};
		this.meterProperties = {
			type: { type: 'string', Enum: ['common_time', 'cut_time', 'specified'] },
			value: {
				type: 'array', optional: true, output: 'noindex', // TODO-PER: Check for type=specified and require these in that case.
				items: {
					type: 'object', properties: {
						num: { type: 'string' },
						den: { type: 'string' }
					}
				}
			}
		};
		this.voiceItem = {
			type: "union",
			field: "el_type",
			types: [
				{ value: "clef", properties: this.appendPositioning(this.clefProperties) },
				{ value: "bar", properties: this.prependPositioning(this.barProperties) },
				{ value: "key", properties: this.appendPositioning(this.keyProperties) },
				{ value: "meter", properties: this.appendPositioning(this.meterProperties) },
				{ value: "part", properties: this.prependPositioning({ title: { type: 'string' } }) },

				{
					value: 'stem', properties: {
						direction: { type: 'string', Enum: ['up', 'down'] }
					}
				},
				{ value: 'tempo', properties: this.appendPositioning(this.tempoProperties) },

				{ value: "note", properties: this.prependPositioning(this.noteProperties) }
			]
		};
		this.musicSchema = {
			description: "ABC Internal Music Representation",
			type: "object",
			properties: {
				version: { type: "string", Enum: ["1.0.0"] },

				formatting: {
					type: "object",
					properties: {
						alignbars: { type: "number", optional: true },
						aligncomposer: { type: "string", Enum: ['left', 'center', 'right'], optional: true },
						annotationfont: this.fontType,
						auquality: { type: "string", optional: true },
						bagpipes: { type: "boolean", optional: true },
						barlabelfont: this.fontType,
						barnumberfont: this.fontType,
						barsperstaff: { type: "number", optional: true },
						botmargin: { type: "number", optional: true },
						botspace: { type: "number", optional: true },
						bstemdown: { type: "boolean", optional: true },
						composerfont: this.fontType,
						composerspace: { type: "number", optional: true },
						continueall: { type: "boolean", optional: true },
						continuous: { type: "string", optional: true },
						dynalign: { type: "boolean", optional: true },
						exprabove: { type: "boolean", optional: true },
						exprbelow: { type: "boolean", optional: true },
						flatbeams: { type: "boolean", optional: true },
						footer: { type: "string", optional: true },
						footerfont: this.fontType,
						gchordbox: { type: "boolean", optional: true },
						gchordfont: this.fontType,
						graceslurs: { type: "boolean", optional: true },
						gracespacebefore: { type: "number", optional: true },
						gracespaceinside: { type: "number", optional: true },
						gracespaceafter: { type: "number", optional: true },
						header: { type: "string", optional: true },
						headerfont: this.fontType,
						historyfont: this.fontType,
						indent: { type: "number", optional: true },
						infofont: this.fontType,
						infospace: { type: "number", optional: true },
						landscape: { type: "boolean", optional: true },
						leftmargin: { type: "number", optional: true },
						linesep: { type: "number", optional: true },
						lineskipfac: { type: "number", optional: true },
						maxshrink: { type: "number", optional: true },
						maxstaffsep: { type: "number", optional: true },
						maxsysstaffsep: { type: "number", optional: true },
						measurebox: { type: "boolean", optional: true },
						measurefont: this.fontType,
						midi: { type: "string", optional: true },
						musicspace: { type: "number", optional: true },
						nobarcheck: { type: "string", optional: true },
						notespacingfactor: { type: "number", optional: true },
						pageheight: { type: "number", optional: true },
						pagewidth: { type: "number", optional: true },
						parskipfac: { type: "number", optional: true },
						partsbox: { type: "boolean", optional: true },
						partsfont: this.fontType,
						partsspace: { type: "number", optional: true },
						playtempo: { type: "string", optional: true },
						repeatfont: this.fontType,
						rightmargin: { type: "number", optional: true },
						scale: { type: "number", optional: true },
						score: { type: "string", optional: true },
						slurgraces: { type: "boolean", optional: true },
						slurheight: { type: "number", optional: true },
						splittune: { type: "boolean", optional: true },
						squarebreve: { type: "boolean", optional: true },
						staffsep: { type: "number", optional: true },
						staffwidth: { type: "number", optional: true },
						staves: { type: "string", optional: true },
						stemheight: { type: "number", optional: true },
						straightflags: { type: "boolean", optional: true },
						stretchlast: { type: "boolean", optional: true },
						stretchstaff: { type: "boolean", optional: true },
						subtitlefont: this.fontType,
						subtitlespace: { type: "number", optional: true },
						sysstaffsep: { type: "number", optional: true },
						systemsep: { type: "number", optional: true },
						tempofont: this.fontType,
						textfont: this.fontType,
						textspace: { type: "number", optional: true },
						titlefont: this.fontType,
						titleformat: { type: "string", optional: true },
						titleleft: { type: "boolean", optional: true },
						titlespace: { type: "number", optional: true },
						topmargin: { type: "number", optional: true },
						topspace: { type: "number", optional: true },
						vocalabove: { type: "boolean", optional: true },
						vocalfont: this.fontType,
						vocalspace: { type: "number", optional: true },
						voicefont: this.fontType,
						wordsfont: this.fontType,
						wordsspace: { type: "number", optional: true }
					}
				},

				lines: {
					type: "array",
					description: "This is an array of horizontal elements. It is usually a staff of music. For multi-stave music, each staff is an element, just like single-staff. The difference is the connector properties.",
					items: {
						type: "object",
						properties: {
							separator: {
								type: 'object', optional: true, prohibits: ['staff', 'text', 'subtitle'],
								properties: {
									lineLength: { type: 'number', optional: true },
									spaceAbove: { type: 'number', optional: true },
									spaceBelow: { type: 'number', optional: true }
								}
							},
							subtitle: { type: "string", optional: true, prohibits: ['staff', 'text', 'separator'] },
							text: { type: "string", optional: true, prohibits: ['staff', 'subtitle', 'separator'] },
							staff: {
								type: 'array', optional: true, prohibits: ['subtitle', 'text', 'separator'],
								items: {
									type: 'object',
									properties: {
										brace: { type: 'string', optional: true, Enum: ["start", "continue", "end"] },
										bracket: { type: 'string', optional: true, Enum: ["start", "continue", "end"] },
										clef: { type: 'object', optional: true, properties: this.clefProperties },
										connectBarLines: { type: 'string', optional: true, Enum: ["start", "continue", "end"] },
										vocalfont: this.fontType,
										key: { type: 'object', optional: true, properties: this.keyProperties },
										meter: { type: 'object', optional: true, properties: this.meterProperties },
										spacingBelow: { type: 'number', optional: true },
										title: { type: 'array', optional: true, items: { type: 'string' } },
										voices: {
											type: 'array', output: 'hidden',
											items: {
												type: "array", optional: true, output: "noindex",
												items: this.voiceItem
											}
										}
									}
								}
							}
						}
					}
				},

				metaText: {
					type: "object",
					properties: {
						author: { type: "string", optional: true },
						book: { type: "string", optional: true },
						composer: { type: "string", optional: true },
						discography: { type: "string", optional: true },
						history: { type: "string", optional: true },
						instruction: { type: "string", optional: true },
						notes: { type: "string", optional: true },
						origin: { type: "string", optional: true },
						partOrder: { type: "string", optional: true },
						rhythm: { type: "string", optional: true },
						source: { type: "string", optional: true },
						tempo: { type: "object", optional: true, properties: this.tempoProperties },
						textBlock: { type: "string", optional: true },
						title: { type: "string", optional: true },
						transcription: { type: "string", optional: true },
						unalignedWords: { type: "string", optional: true },
						url: { type: "string", optional: true }
					}
				}
			}
		};

	}
	appendPositioning(properties: any): any {
		const ret = { ...properties };
		ret.startChar = { type: 'number' }
		ret.endChar = { type: 'number' }
		return ret;
	}


	prependPositioning(properties): any {
		const ret: any = {
			startChar: { type: 'number' },
			endChar: { type: 'number' }
		};
		return Object.assign(ret, properties);
	}

	lint(tune: any, warnings?: string[]): string {
		const ret: JSONSchema.ValidationResult = JSONSchema.validate(tune, this.musicSchema as JSONSchema.Schema);
		let err = "";
		ret.errors.forEach((e: JSONSchema.ValidationError) => {
			err += e.property + ": " + e.message + "\n";
		});
		const out = ret.output.join("\n");

		let warn = warnings === undefined ? "No errors" : warnings.join('\n');
		// 替換字串樣式（假設原程式碼中的 `gsub` 是全局替換，這裡用正則表達式實現）
		warn = warn.replace(/<span style="text-decoration:underline;font-size:1.3em;font-weight:bold;">/g, '$$$$');
		warn = warn.replace(/<\/span>/g, '$$$$');

		return `Error:------\n${err}\nObj:-------\n${out}\nWarn:------\n${warn}`;
	}
}


