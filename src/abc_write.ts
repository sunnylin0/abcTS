/*global Class */
/*global sprintf */
/*extern  ABCBeamElem, ABCGraphElem, ABCPrinter, AbcGlyphs, AbcSpacing, getDuration */

function getDuration(elem: any): number {
	if (!elem || !elem.duration) return 0;
	return elem.duration / 8; // the parser calls a 1 an eighth note.
}

class AbcSpacing {
	static FONTEM: number = 360;
	static FONTSIZE: number = 30;
	static STEP: number = (AbcSpacing.FONTSIZE * 93) / 720;
	static SPACE: number = 10;
	static TOPNOTE: number = 20;
	static STAVEHEIGHT: number = 100;
}

class ABCGraphElem {
	constructor(
		public elem: any,
		public notehead: any,
		public fixedspace: number,
		public propspace: number,
		public bbox: BBox
	) { }

	getSpace(propunit: number): number {
		return this.fixedspace + this.propspace * propunit;
	}
}

class ABCBeamElem {
	elems: ABCGraphElem[] = [];
	notes: any[] = [];
	total: number = 0;
	min?: number;
	max?: number;
	asc?: boolean;
	pos?: number;
	starty?: number;
	endy?: number;
	startx?: number;
	endx?: number;
	auxbeamx?: number;
	auxbeamy?: number;
	auxbeamsingle?: boolean;

	add(elem: ABCGraphElem, note: any): void {
		this.elems[this.elems.length] = elem;
		this.notes[this.notes.length] = note;
		this.total += note.pitch;
		if (!this.min || note.pitch < this.min) {
			this.min = note.pitch;
		}
		if (!this.max || note > this.max) {
			this.max = note.pitch;
		}
	}

	average(): number {
		try {
			return this.total / this.elems.length;
		} catch (e) {
			return 0;
		}
	}

	draw(paper: any, y: number): void {
		if (this.elems.length === 0) return;
		this.drawBeam(paper, y);
		this.drawStems(paper);
	}

	drawBeam(paper: any, basey: number): void {
		const average = this.average();
		this.asc = average < 6; // hardcoded 6 is B
		this.pos = Math.round(
			this.asc ? Math.max(average + 7, this.max + 5) : Math.min(average - 7, this.min - 5)
		);
		let slant = this.notes[0].pitch - this.notes[this.notes.length - 1].pitch;
		const maxslant = this.notes.length / 2;

		if (slant > maxslant) slant = maxslant;
		if (slant < -maxslant) slant = -maxslant;
		this.starty = basey + ((AbcSpacing.TOPNOTE - (this.pos + Math.round(slant / 2))) * AbcSpacing.STEP);
		this.endy = basey + ((AbcSpacing.TOPNOTE - (this.pos + Math.round(-slant / 2))) * AbcSpacing.STEP);

		this.startx = this.elems[0].bbox.x;
		if (this.asc) this.startx += this.elems[0].bbox.width;
		this.endx = this.elems[this.elems.length - 1].bbox.x;
		if (this.asc) this.endx += this.elems[this.elems.length - 1].bbox.width;

		const dy = this.asc ? AbcSpacing.STEP : -AbcSpacing.STEP;

		paper
			.path(
				`M${this.startx} ${this.starty} L${this.endx} ${this.endy} L${this.endx} ${this.endy + dy} L${this.startx} ${this.starty + dy}z`
			)
			.attr({ fill: "#000000" });
	}

	drawStems(paper: any): void {
		for (let i = 0, ii = this.elems.length; i < ii; i++) {
			const bbox = this.elems[i].bbox;
			const y = bbox.y + (this.asc ? -bbox.height / 3 : bbox.height / 3);
			const x = bbox.x + (this.asc ? bbox.width : 0);
			const dx = this.asc ? -0.6 : 0.6;
			const bary = this.getBarYAt(x);
			paper.path(sprintf("M %f %f L %f %f L %f %f L %f %f z", x, y, x, bary,
				x + dx, bary, x + dx, y)).attr({ stroke: "none", fill: "#000000" });

			if (getDuration(this.notes[i]) < 1 / 8) {
				const sy = this.asc ? 1.5 * AbcSpacing.STEP : -1.5 * AbcSpacing.STEP;

				if (!this.auxbeamx) { // TODO replace with a pile/stack of auxbeams for each depth
					this.auxbeamx = x;
					this.auxbeamy = bary + sy;
					this.auxbeamsingle = true;
				} else {
					this.auxbeamsingle = false;
				}

				if (i === ii - 1 || getDuration(this.notes[i + 1]) >= 1 / 8) {
					let auxbeamendx = x;
					let auxbeamendy = bary + sy;
					const dy = this.asc ? AbcSpacing.STEP : -AbcSpacing.STEP;
					if (this.auxbeamsingle) {
						auxbeamendx = i === 0 ? x + 5 : x - 5;
						auxbeamendy = this.getBarYAt(auxbeamendx) + sy;
					}
					paper
						.path(
							`M${this.auxbeamx} ${this.auxbeamy} L${auxbeamendx} ${auxbeamendy} L${auxbeamendx} ${auxbeamendy + dy} L${this.auxbeamx} ${this.auxbeamy + dy}z`
						)
						.attr({ fill: "#000000" });

					this.auxbeamx = null;
					this.auxbeamy = null;
				}
			}
		}
	}

	getBarYAt(x: number): number {
		return (
			this.starty! +
			((this.endy! - this.starty!) / (this.endx! - this.startx!)) * (x - this.startx!)
		);
	}
}



class ABCPrinter {
	x: number;
	y: number;
	paper: any;
	space: number;
	font: any;
	glyphs: ABCGlyphs;
	abcline: any[];
	pos: number;
	partstartx?: number = null;
	room: number = 0;

	static pathcache?: { [key: string]: any } = {};

	constructor(paper: any) {
		this.x = 0;
		this.y = 0;
		this.paper = paper;
		this.space = 2 * AbcSpacing.SPACE;
		this.glyphs = new ABCGlyphs(paper);
	}
	// assumes this.y is set appropriately
printSymbol(x:number, offset:number, symbol:string) {
		var ycorr = this.glyphs.getYCorr(symbol);
		return this.glyphs.printSymbol(x, this.calcY(offset + ycorr), symbol);
	};

calcY(ofs:number) {
		return this.y + ((AbcSpacing.TOPNOTE - ofs) * AbcSpacing.STEP);
	};

updateX(elem:ABCGraphElem) {
		var d = elem.getSpace(this.space);
		this.x += d;
		this.room = d - this.glyphs.getSymbolWidth("w");
	}
	getElem(): any | null {
		if (this.abcline.length <= this.pos)
			return null;
		return this.abcline[this.pos];
	}

	getNextElem(): any | null {
		if (this.abcline.length <= this.pos + 1)
			return null;
		return this.abcline[this.pos + 1];
	}

	nextElemType(): string {
		const elem = this.getElem();
		if (elem === null)
			return "spacer";

		if (elem.el_type === "note" && (getDuration(elem) >= 1 / 4 || elem.end_beam))
			return "spacer";

		const nextElem = this.getNextElem();
		if (nextElem === null)
			return "spacer";
		if (nextElem.el_type === "note" &&
			getDuration(nextElem) >= 1 / 4) {
			return "spacer";
		}

		return nextElem.el_type;
	}

	debugMsg(msg: string): void {
		this.paper.text(this.x, this.y, msg);
	}

	printABC(abctune: any): void {
		//this.currenttune = abctune;
		//ABCNote.duration = eval(this.currenttune.header.fields["L"]);
		this.y = 15;
		if (abctune.formatting.stretchlast) { this.paper.text(200, this.y, "Format: stretchlast"); this.y += 20; }
		if (abctune.formatting.staffwidth) { this.paper.text(200, this.y, "Format: staffwidth=" + abctune.formatting.staffwidth); this.y += 20; }
		if (abctune.formatting.scale) { this.paper.text(200, this.y, "Format: scale=" + abctune.formatting.scale); this.y += 20; }
		this.paper.text(300, this.y, abctune.metaText.title).attr({ "font-size": 20 });
		this.y += 20;
		if (abctune.metaText.author)
			this.paper.text(100, this.y, abctune.metaText.author);
		this.y += 15;
		if (abctune.metaText.origin)
			this.paper.text(100, this.y, "(" + abctune.metaText.origin + ")");
		if (abctune.metaText.tempo)
			this.paper.text(100, this.y + 20, "Tempo: " + abctune.metaText.tempo.duration + '=' + abctune.metaText.tempo.bpm);

		for (var line = 0; line < abctune.lines.length; line++) {
			var abcline = abctune.lines[line];
			if (abcline.staff) {
				this.printABCLine(abcline);
				this.y += AbcSpacing.STAVEHEIGHT;
			} else if (abcline.subtitle) {
				this.printSubtitleLine(abcline);
				this.y += 20; //hardcoded
			}
		}
		var extraText = "";	// TODO-PER: This is just an easy way to display this info for now.
		if (abctune.metaText.notes) extraText += "Notes:\n" + abctune.metaText.notes;
		if (abctune.metaText.book) extraText += "Book: " + abctune.metaText.book;
		if (abctune.metaText.copyright) extraText += "Source: " + abctune.metaText.copyright;
		if (abctune.metaText.transcription) extraText += "Transcription: " + abctune.metaText.transcription;
		if (abctune.metaText.rhythm) extraText += "Rhythm: " + abctune.metaText.rhythm;
		if (abctune.metaText.discography) extraText += "Discography: " + abctune.metaText.discography;
		if (abctune.metaText.history) extraText += "History: " + abctune.metaText.history;
		if (abctune.metaText.unalignedWords) extraText += "Words:\n" + abctune.metaText.unalignedWords;
		this.paper.text(10, this.y + 30, extraText).attr({ "text-anchor": "start" });
	};


	printSubtitleLine(abcline) {
		this.paper.text(100, this.y, abcline.subtitle);
	}

	printABCLine(abcline: any): void {
		this.x = 0;
		this.room = 0;
		this.abcline = abcline.staff;
		var elem;
		var start = (this.partstartx) ? true : false;
		for (this.pos = 0; this.pos < this.abcline.length; this.pos++) {
			var type = this.getElem().el_type;
			this.partstartx && start && type != "key" && type != "meter" && type != "clef" && (this.partstartx = this.x) && (start = false);
			elem = this.printABCElement();
			if (elem) {
				this.updateX(elem);
			}
		}
		if (this.abcline[this.abcline.length - 1].el_type === "bar") {
			this.x -= elem.getSpace(this.space);
		}
		this.printStave(this.x - 1); // don't use the last pixel over the barline
		if (this.partstartx) {
			this.paper.path(sprintf("M %f %f L %f %f",
				this.x, this.y, this.partstartx, this.y)).attr({ stroke: "#000000" });
		}
	}
	// return array: [absolute width, relative spacing after]
	// or maybe return element, and relative spacing after, so that the element can later be translated
	printABCElement(): any | null {
		let graphelem: (ABCGraphElem | null) = null;
		const elem = this.getElem();
		switch (elem.el_type) {
			case "note":
				graphelem = this.printBeam();
				break;
			case "bar":
				graphelem = this.printBarLine(elem);
				break;
			case "meter":
				this.printTimeSignature(elem);
				break;
			case "clef":
				break;
			case "key":
				this.printKeySignature(elem);
				break;
			case "rest":
				graphelem = this.printRest(elem);
				break;
		}
		return graphelem;
	}

	private printBeam(): any {
		let graphelem: (ABCGraphElem |null)= null;
		if (this.nextElemType() === 'note') {
			const beamelem = new ABCBeamElem();
			for (; ;) {
				graphelem = this.printNote(this.getElem(), true);
				beamelem.add(graphelem, this.getElem());
				if (this.getElem().end_beam !== undefined || this.nextElemType() !== "note") {
					break;
				}
				this.pos++;
				this.updateX(graphelem);
			}
			beamelem.draw(this.paper, this.y);
		} else {
			graphelem = this.printNote(this.getElem());
		}
		return graphelem;
	}

	printRest(elem) {
		elem.pitch = 7;
		return this.printNote(elem);
	}

	printNote(elem: any, stem?: boolean): ABCGraphElem {
		let elemset = this.paper.set();
		let notehead: any = null;
		let roomtaken:number = 0; // room needed to the left of the note
		
		// 處理升降記號
		if (elem.accidental !== undefined && elem.accidental !== 'none') {
			let symb: string;
			switch (elem.accidental) {
				case "dbl_sharp":
				case "sharp":
					symb = "#";
					break;
				case "flat":
				case "dbl_flat":
					symb = "b";
					break;
				case "natural":
					symb = "n";
					break;
				default:
					symb = "";
			}
			const acc = this.printSymbol(this.x, elem.pitch, symb); // 1 is hardcoded
			roomtaken += (this.glyphs.getSymbolWidth(symb) + 2)
			acc.translate(-roomtaken, 0); // hardcoded
			elemset.push(acc);
		}

		if (elem.lyric !== undefined) {
			this.debugMsg(elem.lyric.syllable + "  " + elem.lyric.divider);
		}
		// 音符頭符號對應表
		const chartable: { [key: string]: { [key: number]: string } } = {
			up: { 0: "w", 1: "h", 2: "q", 3: "e", 4: "x" },
			down: { 0: "w", 1: "H", 2: "Q", 3: "E", 4: "X" },
			rest: { 0: "\u2211", 1: "\u00d3", 2: "\u0152", 3: "\u2030", 4: "\u2248" }
		};

		const dur = getDuration(elem);
		const durlog = Math.floor(Math.log(dur) / Math.log(2));
		const dot = (Math.pow(2, durlog) !== dur);
		let c = "";
		let dir = "";
		let bbox = {
			x: 0, y: 0, width: 0, height: 0
		};
		// 根據音符方向和時值選擇符號
		if (!stem) {
			dir = (elem.pitch >= 6) ? "down" : "up";
			(elem.el_type === "rest") && (dir = "rest");
			c = chartable[dir][-durlog];
		} else {
			c = "\u0153"; // 1 是硬編碼
		}

		if (c === undefined)
			this.debugMsg("chartable[" + dir + "][" + (-durlog) + '] is undefined');
		else {


			// 打印音符頭
			notehead = this.printSymbol(this.x, elem.pitch, c);
			elemset.push(notehead);

			// 處理附點
			if (dot) {
				var dotadjust = (1 - elem.pitch % 2);
				elemset.push(this.glyphs.printSymbol(this.x + 12, 1 + this.calcY(elem.pitch + 2 - 1 + dotadjust), ".")); // 12 and 1 is hardcoded. some weird bug with dot y-pos ??!
			}
		}


		for (var i = elem.gracenotes.length - 1; i >= 0; i--) {
			var grace = this.printSymbol(this.x, elem.gracenotes[i].pitch, ";");
			roomtaken += 10; // hardcoded
			grace.translate(-roomtaken, 0); // hardcoded
			elemset.push(grace);
		}

		if (elem.decoration) {
			var dec;
			var unknowndecs = [];
			var yslot = (elem.pitch > 9) ? elem.pitch + 3 : 12;
			var ypos;
			(elem.pitch === 5) && (yslot = 14); // avoid upstem of the A

			for (var i = 0; i < elem.decoration.length; i++) { // treat staccato first (may need to shift other markers)
				if (elem.decoration[i] === "staccato") {
					ypos = (elem.pitch >= 6) ? elem.pitch + 2 : elem.pitch - 2;
					(elem.pitch === 4) && ypos--; // don't place on a stave line
					((elem.pitch === 6) || (elem.pitch === 8)) && ypos++;
					(elem.pitch > 9) && yslot++; // take up some room of those that are above
					var deltax = (this.glyphs.getSymbolWidth("\u0153") - this.glyphs.getSymbolWidth(".")) / 2;
					elemset.push(this.printSymbol(this.x + deltax, ypos, "."));
				}
			}

			for (var i = 0; i < elem.decoration.length; i++) {
				switch (elem.decoration[i]) {
					case "trill": dec ='\u0178'; break;
					case "roll": dec = "~"; break;
					case "marcato": dec = "^"; break;
					case "marcato2": dec = "v"; break;//other marcato
					case "turn": dec = "T"; break;
					case "uppermordent": dec = "m"; break;
					case "mordent":
					case "lowermordent": dec = "M"; break;
					case "staccato": continue;
					case "downbow": dec = "\u2265"; break;
					case "upbow": dec = "\u2264"; break;
					case "fermata": dec = "U"; break;
					case "invertedfermata": dec = "u"; break;
					case "breath": dec = ","; break;
					case "accent": dec = ">"; break;
					case "tenuto": dec = "-"; break;
					case "coda": dec = "\ufb01"; break;
					case "segno": dec = "%"; break;
					case "p": dec = "p"; break;
					case "mp": dec = "P"; break;
					case "ppp": dec = "\u220f"; break;
					case "pppp": dec = "u00d8"; break;
					case "f": dec = "f"; break;
					case "ff": dec = "\u0192"; break;
					case "fff": dec = "\u00cf"; break;
					case "ffff": dec = "\u00ce"; break;
					case "sffz": dec = "\u00e7"; break;
					case "mf": dec = "F"; break;
					case "repeatbar": dec = "\u2108"; break;
					case "repeatbar2": dec = "\u00ab"; break;
					default:
						unknowndecs[unknowndecs.length] = elem.decoration[i];
						continue;
				}
				ypos = yslot;
				yslot += 3;
				var deltax = (this.glyphs.getSymbolWidth("\u0153") - this.glyphs.getSymbolWidth(dec)) / 2;
				elemset.push(this.printSymbol(this.x + deltax, ypos, dec));

			}
			(unknowndecs.length > 0) && this.debugMsg(unknowndecs.join(','));
		}
			

		// 打印上方加線
		for (let i = elem.pitch; i > 11; i--) {
			if (i % 2 === 0) {
				elemset.push(this.printSymbol(this.x - 1, i, "_"));
			}
		}

		// 打印下方加線
		for (let i = elem.pitch; i < 1; i++) {
			if (i % 2 === 0) {
				elemset.push(this.printSymbol(this.x - 1, this.calcY(i + 1), "_")); // 1 是硬編碼
			}
		}

		var extraroom = roomtaken - this.room;

		if (extraroom > 0) {
			elemset.translate(extraroom, 0);
			this.x += extraroom;
		}

		if (c) {
			bbox = { "x": this.x, "y": this.calcY(elem.pitch + this.glyphs.getYCorr(c)), "width": this.glyphs.getSymbolWidth(c), height: this.glyphs.getSymbolHeight(c) };
		}

		if (elem.chord !== undefined) {
			var chord = this.paper.text(this.x, this.y + 15 + (elem.chord.position === 'below' ? 65 : 0), elem.chord.name);
			chord.translate(chord.getBBox().width / 2, 0);
			elemset.push(chord);
		}

		// 返回 ABCGraphElem 對象
		return new ABCGraphElem(elemset, notehead, 0, Math.sqrt(getDuration(elem) * 8), bbox);
	}

	printBarLine(elem: BarElement): ABCGraphElem {
	// bar_thin, bar_thin_thick, bar_thin_thin, bar_thick_thin, bar_right_repeat, bar_left_repeat, bar_double_repeat

		var elemset = this.paper.set();
		var symb; // symbol which sets the spacing
		var symbscale = 1; //width of that symbol

		var firstdots = (elem.type === "bar_right_repeat" || elem.type === "bar_dbl_repeat");
		var firstthin = (elem.type != "bar_left_repeat" && elem.type != "bar_thick_thin");
		var thick = (elem.type === "bar_right_repeat" || elem.type === "bar_dbl_repeat" || elem.type === "bar_left_repeat" ||
			elem.type === "bar_thin_thick" || elem.type === "bar_thick_thin");
		var secondthin = (elem.type === "bar_left_repeat" || elem.type === "bar_thick_thin" || elem.type === "bar_thin_thin");
		var seconddots = (elem.type === "bar_left_repeat" || elem.type === "bar_dbl_repeat");

		if (firstdots) {
			elemset.push(this.glyphs.printSymbol(this.x, 1 + this.calcY(7 + 1), "."));
			elemset.push(this.glyphs.printSymbol(this.x, 1 + this.calcY(5 + 1), "."));
			this.x += 5; //2 hardcoded, twice;
		}

		if (firstthin) {
			symb = this.printSymbol(this.x, 3, "\\"); // 3 is hardcoded
			symbscale = 1;
		}


		if (thick) { // also means end of nth part
			this.x += 3; //3 hardcoded;

			if (this.partstartx) {
				this.paper.path(sprintf("M %f %f L %f %f L %f %f",
					this.x, this.y + 10, this.x, this.y, this.partstartx, this.y)).attr({ stroke: "#000000" });
				this.partstartx = null;
			}
			symb = this.printSymbol(this.x, 3, "\\"); // 3 is hardcoded
			symb.scale(10, 1, this.x);
			symbscale = 10;
			elemset.push(symb);
			this.x += 6;
		}

		if (this.partstartx && (elem.type === "bar_thin_thin")) { // means end of nth part but at different place
			this.paper.path(sprintf("M %f %f L %f %f L %f %f",
				this.x, this.y + 10, this.x, this.y, this.partstartx, this.y)).attr({ stroke: "#000000" });
			this.partstartx = null;
		}


		if (secondthin) {
			this.x += 3; //3 hardcoded;
			symb = this.printSymbol(this.x, 3, "\\"); // 3 is hardcoded
			symbscale = 1;
			elemset.push(symb);
		}

		if (seconddots) {
			this.x += 2; //3 hardcoded;
			elemset.push(this.glyphs.printSymbol(this.x, 1 + this.calcY(7 + 1), "."));
			elemset.push(this.glyphs.printSymbol(this.x, 1 + this.calcY(5 + 1), "."));
		} // 2 is hardcoded

		if (elem.number) {
			this.partstartx = this.x;
			this.paper.path(sprintf("M %f %f L %f %f",
				this.x, this.y, this.x, this.y + 10)).attr({ stroke: "#000000" });
			this.paper.text(this.x + 5, this.y + 7, elem.number);
		}

		return new ABCGraphElem(elemset, null, this.glyphs.getSymbolWidth("\\") * symbscale, 0.5, null);

	};

	printStave(width: number): void {
		const staff = this.printSymbol(0, 3, "="); // 3 is hardcoded
		width = width / this.glyphs.getSymbolWidth("=");
		staff.scale(width, 1, 0);
	}

	printKeySignature(elem: { acc: string; num: number }): void {
		const clef = this.printSymbol(this.x, 5, "&"); //5 is hardcoded
		this.x += this.glyphs.getSymbolWidth("&") + 10; // hardcoded
		const FLATS: number[] = [6, 9, 5, 8, 4, 7];
		const SHARPS: number[] = [10, 7, 11, 8, 5, 9];
		const accidentals = (elem.acc !== "sharp") ? FLATS : SHARPS;
		const number = elem.num;
		const symbol = (elem.acc !== "sharp") ? "b" : "#";
		for (let i = 0; i < number; i++) {
			const path = this.printSymbol(this.x, accidentals[i], symbol);
			this.x += this.glyphs.getSymbolWidth(symbol);
		}
		this.x += 10; // hardcoded
	}

	printTimeSignature(elem: MeterElement): void {
		//var timesig = this.currenttune.header.fields["M"];
		//var parts=timesig.match(/([\d]+)\/([\d]+)/);
		let graphelem: any; // Replace with actual type
		if (elem.type === "specified") {
			// TODO make the alignment for time signatures centered
			graphelem = this.paper.set();
			graphelem.push(this.printSymbol(this.x, 9, elem.num.toString())); //7 is hardcoded
			graphelem.push(this.printSymbol(this.x, 5, elem.den.toString())); //3 is hardcoded
		} else if (elem.type === "common_time") {
			graphelem = this.printSymbol(this.x, 7, "c"); //5 is hardcoded
		} else if (elem.type === "cut_time") {
			graphelem = this.printSymbol(this.x, 7, "C"); //5 is hardcoded
		}
		this.x += graphelem.getBBox().width; // no caching
		this.x += AbcSpacing.SPACE;
	}

}



