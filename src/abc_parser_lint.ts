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

//interface DecorationList {
//	type: 'array';
//	optional: true;
//	items: {
//		type: 'string';
//		Enum: string[];
//	};
//}

//const decorationList: DecorationList = {
//	type: 'array',
//	optional: true,
//	items: {
//		type: 'string',
//		Enum: [
//			"trill", "lowermordent", "uppermordent", "mordent", "pralltriller", "accent",
//			"emphasis", "fermata", "invertedfermata", "tenuto", "0", "1", "2", "3", "4", "5", "+", "wedge",
//			"open", "thumb", "snap", "turn", "roll", "breath", "shortphrase", "mediumphrase", "longphrase",
//			"segno", "coda", "D.S.", "D.C.", "fine", "crescendo(", "crescendo)", "diminuendo(", "diminuendo)",
//			"p", "pp", "f", "ff", "mf", "ppp", "pppp", "fff", "ffff", "sfz", "repeatbar", "repeatbar2", "slide",
//			"upbow", "downbow", "staccato"
//		]
//	}
//};

//interface TempoProperties {
//	duration?: {
//		type: "array";
//		optional: true;
//		output: "join";
//		requires: string[];
//		items: { type: "number" };
//	};
//	bpm?: { type: "number"; optional: true; requires: string[]; };
//	preString?: string;
//	postString?: string;
//}

//function appendPositioning<T extends Record<string, any>>(properties: T): T & { startChar: { type: 'number'; output: 'hidden' }; endChar: { type: 'number'; output: 'hidden' }; } {
//	return { ...properties, startChar: { type: 'number', output: 'hidden' }, endChar: { type: 'number', output: 'hidden' } } as any;
//}

//interface FontType {
//	type: 'object';
//	optional: true;
//	properties: {
//		font?: string;
//		size?: number;
//	}
//}

//interface ClefProperties {
//	type: { type: 'string'; enum: string[]; };
//	middle: { type: 'number'; minimum: -; maximum: ; }; // the pitch that goes in the middle of the staff C=
//}

//interface KeyProperties {
//	extraAccidentals?: {
//		type: 'array';
//		optional: true;
//		output: "noindex";
//		items: {
//			type: 'object';
//			properties: {
//				acc: { type: 'string'; enum: string[]; };
//				note: { type: 'string'; enum: string[]; };
//				verticalPos: { type: 'number'; minimum: ; maximum: ; };
//			}
//		};
//	};
//	// regularKey?: { ... }; // Uncomment and define if needed
//}

//interface MeterProperties {
//	type: { type: 'string'; enum: string[]; };
//	value?: {
//		type: 'array';
//		optional: true;
//		output: 'noindex';
//		items: {
//			type: 'object';
//			properties: {
//				num: { type: 'string' };
//				den: { type: 'string' };
//			}
//		};
//	};
//}

//interface VoiceItem {
//	type: "union";
//	field: "el_type";
//	types: Array<{ value: string; properties: Record<string, any> }>;
//}

// abc_parser_lint.d.ts

declare namespace AbcParserLint {
	interface Decoration {
		type: 'string';
		Enum: [
			"trill", "lowermordent", "uppermordent", "mordent", "pralltriller", "accent",
			"emphasis", "fermata", "invertedfermata", "tenuto", "0", "1", "2", "3", "4", "5", "+", "wedge",
			"open", "thumb", "snap", "turn", "roll", "breath", "shortphrase", "mediumphrase", "longphrase",
			"segno", "coda", "D.S.", "D.C.", "fine", "crescendo(", "crescendo)", "diminuendo(", "diminuendo)",
			"p", "pp", "f", "ff", "mf", "ppp", "pppp", "fff", "ffff", "sfz", "repeatbar", "repeatbar2", "slide",
			"upbow", "downbow", "staccato"
		];
	}

	interface TempoProperties {
		duration?: {
			type: "array";
			optional: true;
			output: "join";
			requires: ['bpm'];
			items: { type: "number" };
		};
		bpm?: {
			type: "number";
			optional: true;
			requires: ['duration'];
		};
		preString?: { type: 'string'; optional: true };
		postString?: { type: 'string'; optional: true };
	}

	interface FontType {
		type: 'object';
		optional: true;
		properties: {
			font?: { type: 'string'; optional: true };
			size?: { type: 'number'; optional: true };
		};
	}

	interface ClefProperties {
		type: {
			type: 'string';
			Enum: [
				'treble', 'tenor', 'bass', 'alto', 'treble+', 'tenor+', 'bass+', 'alto+', 'treble-', 'tenor-', 'bass-', 'alto-', 'none'
			];
		};
		middle?: { type: 'number'; minimum: -14; maximum: 14 };
	}

	interface ExtraAccidentals {
		type: 'object';
		properties: {
			acc: { type: 'string'; Enum: ['flat', 'natural', 'sharp', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp'] };
			note: { type: 'string'; Enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'a', 'b', 'c', 'd', 'e', 'f', 'g'] };
			verticalPos: { type: 'number'; minimum: -14; maximum: 14 };
		};
	}

	interface KeyProperties {
		extraAccidentals?: {
			type: 'array';
			optional: true;
			output: "noindex";
			items: ExtraAccidentals;
		};
	}

	interface MeterPropertiesValue {
		type: 'object';
		properties: {
			num: { type: 'string' };
			den: { type: 'string' };
		};
	}

	interface MeterProperties {
		type: { type: 'string'; Enum: ['common_time', 'cut_time', 'specified'] };
		value?: {
			type: 'array';
			optional: true;
			output: 'noindex';
			items: MeterPropertiesValue;
		};
	}

	interface VoiceItem {
		type: "union";
		field: "el_type";
		types: [
			{
				value: "clef",
				properties: ClefProperties & {
					startChar: { type: 'number'; output: 'hidden' };
					endChar: { type: 'number'; output: 'hidden' }
				}
			},
			{
				value: "bar", properties: {
					startChar: { type: 'number'; output: 'hidden' };
					endChar: { type: 'number'; output: 'hidden' };
					chord?: { type: 'object'; optional: true; properties: { name: { type: 'string' }; position: { type: 'string' } } };
					decoration: Decoration[];
					ending?: { type: 'string'; optional: true };
					type: { type: 'string'; Enum: ['bar_dbl_repeat', 'bar_right_repeat', 'bar_left_repeat', 'bar_invisible', 'bar_thick_thin', 'bar_thin_thin', 'bar_thin', 'bar_thin_thick'] };
				}
			},
			{ value: "key", properties: KeyProperties & { startChar: { type: 'number'; output: 'hidden' }; endChar: { type: 'number'; output: 'hidden' } } },
			{ value: "meter", properties: MeterProperties & { startChar: { type: 'number'; output: 'hidden' }; endChar: { type: 'number'; output: 'hidden' } } },
			{
				value: "part", properties: {
					startChar: { type: 'number'; output: 'hidden' };
					endChar: { type: 'number'; output: 'hidden' };
					title: { type: 'string' };
				}
			},
			{
				value: 'stem', properties: {
					startChar: { type: 'number'; output: 'hidden' };
					endChar: { type: 'number'; output: 'hidden' };
					direction: { type: 'string'; Enum: ['up', 'down'] };
				}
			},
			{ value: 'tempo', properties: TempoProperties & { startChar: { type: 'number'; output: 'hidden' }; endChar: { type: 'number'; output: 'hidden' } } },
			{
				value: "note", properties: {
					startChar: { type: 'number'; output: 'hidden' };
					endChar: { type: 'number'; output: 'hidden' };
					barNumber?: { type: 'number'; optional: true };
					chord?: { type: 'object'; optional: true; properties: { name: { type: 'string' }; position: { type: 'string' } } };
					decoration: Decoration[];
					duration: { type: 'number' };
					endTriplet?: {
						type: 'boolean'; Enum: [true]; optional: true
					};
					end_beam?: { type: 'boolean'; Enum: [true]; optional: true };
					gracenotes?: {
						type: 'array';
						optional: true;
						output: "noindex";
						items: {
							type: 'object';
							properties: {
								accidental?: { type: 'string'; Enum: ['sharp', 'flat', 'natural', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp']; optional: true };
								duration: { type: 'number' };
								startSlur?: { type: 'number'; minimum: 1; optional: true };
								startTie?: { type: 'boolean'; Enum: [true]; optional: true };
							};
						};
					};
					lyric?: {
						type: 'array';
						optional: true;
						output: "noindex";
						items: {
							type: 'object';
							properties: {
								syllable: { type: 'string' };
								divider: { type: 'string'; Enum: ['-', ' ', '_'] };
							};
						};
					};
					pitches?: {
						type: 'array';
						optional: true;
						output: "noindex";
						prohibits: ['pitch', 'duration', 'lyric'];
						items: {
							type: 'object';
							properties: {
								accidental?: { type: 'string'; Enum: ['sharp', 'flat', 'natural', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp']; optional: true };
								endSlur?: { type: 'number'; minimum: 1; optional: true };
								endTie?: { type: 'boolean'; Enum: [true]; optional: true };
								pitch: { type: 'number' };
								verticalPos: { type: 'number' };
								startSlur?: { type: 'number'; minimum: 1; optional: true };
								startTie?: { type: 'boolean'; Enum: [true]; optional: true };
							};
						};
					};
					rest?: {
						type: 'object';
						optional: true;
						prohibits: ['pitch', 'duration', 'lyric'];
						properties: {
							type: { type: 'string'; Enum: ['invisible', 'spacer', 'rest'] };
							endSlur?: { type: 'number'; minimum: 1; optional: true };
							endTie?: { type: 'boolean'; Enum: [true]; optional: true };
							startSlur?: { type: 'number'; minimum: 1; optional: true };
							startTie?: { type: 'boolean'; Enum: [true]; optional: true };
						};
					};
					startTriplet?: { type: 'number'; minimum: 2; maximum: 9; optional: true };
				}
			}
		];
	}

	interface MusicSchema {
		description: "ABC Internal Music Representation";
		type: "object";
		properties: {
			formatting?: {
				type: "object";
				properties: {
					auquality?: { type: "string"; optional: true };
					bagpipes?: { type: "boolean"; optional: true };
					voicefont?: FontType;
					wordsspace?: { type: "number"; optional: true };
				};
			};
			lines?: {
				type: "array";
				description: "This is an array of horizontal elements. It is usually a staff of music. For multi-stave music, each staff is an element, just like single-staff. The difference is the connector properties.";
				items: {
					type: "object";
					properties: {
						separator?: {
							type: 'object';
							optional: true;
							prohibits: ['staff', 'text', 'subtitle'];
							properties: {
								lineLength?: { type: 'number'; optional: true };
								spaceAbove?: { type: 'number'; optional: true };
								spaceBelow?: { type: 'number'; optional: true };
							};
						};
						subtitle?: { type: "string"; optional: true; prohibits: ['staff', 'text', 'separator'] };
						text?: { type: "string"; optional: true; prohibits: ['staff', 'subtitle', 'separator'] };
						staff?: {
							type: 'array';
							optional: true;
							prohibits: ['subtitle', 'text', 'separator'];
							items: {
								type: 'object';
								properties: {
									brace?: { type: 'string'; optional: true; Enum: ["start", "continue", "end"] };
									voices?: {
										type: 'array';
										output: 'hidden';
										items: {
											type: "array";
											optional: true;
											output: "noindex";
											items: VoiceItem;
										};
									};
								};
							};
						};
					};
				};
			};
			metaText?: {
				type: "object";
				properties: {
					author?: { type: "string"; optional: true };
					unalignedWords?: { type: "string"; optional: true };
					url?: { type: "string"; optional: true };
				};
			};
		};
	}

	interface LintResult {
		valid: boolean;
		errors: ValidationError[];
		output: string[];
	}

	interface ValidationError {
		property: string;
		message: string;
	}

	class AbcParserLint {
		constructor();
		lint(tune: any, warnings?: string[]): string;
	}

}


class AbcParserLint {
	decorationList;
	tempoProperties;
	fontType;
	clefProperties;
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
			middle: { type: 'number', minimum: -14, maximum: 14 } // the pitch that goes in the middle of the staff C=0
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
				{
					value: "bar", properties: {
						startChar: { type: 'number', output: 'hidden' },
						endChar: { type: 'number', output: 'hidden' },
						chord: {
							type: 'object', optional: true, properties: {
								name: { type: 'string' },
								position: { type: 'string' }
							}
						},
						decoration: this.decorationList,
						ending: { type: 'string', optional: true },
						type: { type: 'string', Enum: ['bar_dbl_repeat', 'bar_right_repeat', 'bar_left_repeat', 'bar_invisible', 'bar_thick_thin', 'bar_thin_thin', 'bar_thin', 'bar_thin_thick'] }
					}
				},
				{ value: "key", properties: this.appendPositioning(this.keyProperties) },
				{ value: "meter", properties: this.appendPositioning(this.meterProperties) },
				{
					value: "part", properties: {
						startChar: { type: 'number', output: 'hidden' },
						endChar: { type: 'number', output: 'hidden' },
						title: { type: 'string' }
					}
				},

				{
					value: 'stem', properties: {
						startChar: { type: 'number', output: 'hidden' },
						endChar: { type: 'number', output: 'hidden' },
						direction: { type: 'string', Enum: ['up', 'down'] }
					}
				},
				{ value: 'tempo', properties: this.appendPositioning(this.tempoProperties) },

				{
					value: "note", properties: {
						startChar: { type: 'number', output: 'hidden' },
						endChar: { type: 'number', output: 'hidden' },
						//accidental: { type: 'string', Enum: [ 'sharp', 'flat', 'natural', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp' ], optional: true },
						barNumber: { type: 'number', optional: true },
						chord: {
							type: 'object', optional: true, properties: {
								name: { type: 'string' },
								position: { type: 'string' }
							}
						},
						decoration: this.decorationList,
						duration: { type: 'number' },
						//     endSlur: { type: 'number', minimum: 1, optional: true },
						//     endTie: { type: 'boolean', Enum: [ true ], optional: true },
						endTriplet: { type: 'boolean', Enum: [true], optional: true },
						end_beam: { type: 'boolean', Enum: [true], optional: true },
						gracenotes: {
							type: 'array', optional: true, output: "noindex", items: {
								type: "object", properties: {
									accidental: { type: 'string', Enum: ['sharp', 'flat', 'natural', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp'], optional: true },
									duration: { type: 'number' },
									end_beam: { type: 'boolean', Enum: [true], optional: true },
									endSlur: { type: 'number', minimum: 1, optional: true },
									endTie: { type: 'boolean', Enum: [true], optional: true },
									pitch: { type: 'number' },
									verticalPos: { type: 'number' },
									startSlur: { type: 'number', minimum: 1, optional: true },
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
						//pitch: { optional: true, type: 'number', prohibits: [ 'rest', 'pitches' ] },
						pitches: {
							type: 'array', optional: true, output: "noindex", prohibits: ['pitch', 'duration', 'rest'], items: {
								type: 'object', properties: {
									accidental: { type: 'string', Enum: ['sharp', 'flat', 'natural', 'dblsharp', 'dblflat', 'quarterflat', 'quartersharp'], optional: true },
									endSlur: { type: 'number', minimum: 1, optional: true },
									endTie: { type: 'boolean', Enum: [true], optional: true },
									pitch: { type: 'number' },
									verticalPos: { type: 'number' },
									startSlur: { type: 'number', minimum: 1, optional: true },
									startTie: { type: 'boolean', Enum: [true], optional: true }
								}
							}
						},
						rest: {
							type: 'object', optional: true, prohibits: ['pitch', 'duration', 'lyric'], properties: {
								type: { type: 'string', Enum: ['invisible', 'spacer', 'rest'] },
								endSlur: { type: 'number', minimum: 1, optional: true },
								endTie: { type: 'boolean', Enum: [true], optional: true },
								startSlur: { type: 'number', minimum: 1, optional: true },
								startTie: { type: 'boolean', Enum: [true], optional: true }
							}
						},
						//     startSlur: { type: 'number', minimum: 1, optional: true },
						//     startTie: { type: 'boolean', Enum: [ true ], optional: true },
						startTriplet: { type: 'number', minimum: 2, maximum: 9, optional: true }
					}
				}
			]
		};
		this.musicSchema = {
			description: "ABC Internal Music Representation",
			type: "object",
			properties: {
				formatting: {
					type: "object",
					properties: {
						auquality: { type: "string", optional: true },
						bagpipes: { type: "boolean", optional: true },
						barlabelfont: this.fontType,
						barnumberfont: this.fontType,
						botmargin: { type: "number", optional: true },
						botspace: { type: "number", optional: true },
						composerfont: this.fontType,
						composerspace: { type: "number", optional: true },
						continuous: { type: "string", optional: true },
						gchordfont: this.fontType,
						indent: { type: "number", optional: true },
						landscape: { type: "boolean", optional: true },
						leftmargin: { type: "number", optional: true },
						linesep: { type: "number", optional: true },
						midi: { type: "string", optional: true },
						musicspace: { type: "number", optional: true },
						nobarcheck: { type: "string", optional: true },
						partsfont: this.fontType,
						partsspace: { type: "number", optional: true },
						playtempo: { type: "string", optional: true },
						scale: { type: "number", optional: true },
						score: { type: "string", optional: true },
						slurgraces: { type: "boolean", optional: true },
						staffsep: { type: "number", optional: true },
						staffwidth: { type: "number", optional: true },
						staves: { type: "string", optional: true },
						stretchlast: { type: "boolean", optional: true },
						subtitlefont: this.fontType,
						subtitlespace: { type: "number", optional: true },
						sysstaffsep: { type: "number", optional: true },
						systemsep: { type: "number", optional: true },
						tempofont: this.fontType,
						textspace: { type: "number", optional: true },
						titlefont: this.fontType,
						titleleft: { type: "boolean", optional: true },
						titlespace: { type: "number", optional: true },
						topmargin: { type: "number", optional: true },
						topspace: { type: "number", optional: true },
						vocalspace: { type: "number", optional: true },
						voicefont: this.fontType,
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
		ret.startChar = { type: 'number', output: 'hidden' };
		ret.endChar = { type: 'number', output: 'hidden' };
		return ret;
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


