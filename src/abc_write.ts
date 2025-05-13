// abc_write_.ts

/*global Class */
/*global sprintf */
/*extern ABCBeamElem, ABCGraphElem, ABCPrinter, ABCGlyphs, AbcSpacing, getDuration */


interface BarElement extends ABCElement {
	type: string;
	number?: number;
	decoration?: string[];
}

interface NoteElement extends ABCElement {
	averagepitch?: number;
}

interface TuneMetaText {
	title?: string;
	author?: string;
	origin?: string;
	tempo?: { duration: number; bpm: number };
	partOrder?: string;
	notes?: string;
	unalignedWords?: string;

	book?: string;
	source?: string;
	transcription?: string;
	rhythm?: string;
	discography?: string;
	history?: string;
}

interface Tune {
	lines: ABCLine[];
	metaText: TuneMetaText;
	formatting: Formatting;
	appendElement: (type: string, startChar: number, endChar: number, element: Element) => void;
	reset: () => void;
}


interface MultilineVars {
	iChar: number;
	next_note_duration: number;
	default_length: number;
	partForNextLine: string;
	clef: string;
	key: any; // Assuming any for lack of details
	meter: any; // Assuming any for lack of details
	tempo: { duration: number; bpm: number } | null;
	is_in_header: boolean;
	havent_set_length: boolean;
	start_new_line: boolean;
	reset: () => void;
}

// Utility functions

function getDuration(elem: ABCElement): number {
	let d = 0;
	if (elem) {
		if (elem.duration) d = elem.duration;
		else if (elem.pitches && elem.pitches[0]) d = elem.pitches[0].duration;
	}
	return d / 8; // the parser calls a 1 an eigth note.
}

function getDurlog(duration: number): number {
	return Math.floor(Math.log(duration) / Math.log(2));
}

class AbcSpacing {
	static FONTEM = 360;
	static FONTSIZE = 30;
	static STEP = AbcSpacing.FONTSIZE * 93 / 720;
	static SPACE = 10;
	static TOPNOTE = 20;
	static STAVEHEIGHT = 100;
}

class ABCStaffElement {
	printer: ABCPrinter;
	children: ABCAbsoluteElement[];
	otherchildren: (ABCAbsoluteElement | ABCTieElem | ABCBeamElem | ABCTripletElem | ABCEndingElem)[]; // ties, slurs, beams, triplets
	w: number;
	y: number;
	extraroom: number;

	constructor(printer: ABCPrinter, y: number) {
		this.printer = printer;
		this.children = [];
		this.otherchildren = [];
		this.w = 0;
		this.y = y;
	}

	addChild(child: ABCAbsoluteElement): void {
		this.children.push(child);
	}

	addOther(child: ABCAbsoluteElement): void {
		this.otherchildren.push(child);
	}

	layout(spacing: number): void {
		let x = 0;
		let extraroom = 0;
		let durationroom = 0;
		let room = 0;
		for (let i = 0; i < this.children.length; i++) {
			const child = this.children[i];
			let er = child.getExtraWidth() - room;
			if (er > 0) {
				x += child.getExtraWidth();
				extraroom += er;
			}
			child.x = x;
			x += spacing * Math.sqrt(child.duration * 8);
			er = child.x + child.getMinWidth() - x;
			if (er > 0) {
				x = child.x + child.getMinWidth();
				if (i !== this.children.length - 1) x += child.minspacing;
				extraroom += er;
				room = 0;
			} else {
				room = -er;
				durationroom += spacing * Math.sqrt(child.duration * 8);
			}
		}
		this.w = x;
		this.extraroom = extraroom;
	}

	draw(): void {
		for (let i = 0; i < this.children.length; i++) {
			this.children[i].draw(this.printer);
		}
		for (let i = 0; i < this.otherchildren.length; i++) {
			this.otherchildren[i].draw(this.printer, 10, this.w - 1);
		}
		this.printer.printStave(this.w - 1);
	}
}


class ABCAbsoluteElement {
	// spacing which must be taken on top of the width
	abcelem: ABCElement;
	duration: number;
	minspacing: number;
	x: number;
	children: ABCRelativeElement[];
	heads: ABCRelativeElement[];
	extra: ABCRelativeElement[];
	extraw: number;
	decs: any[];
	w: number;
	right: ABCRelativeElement[];
	elemset?: SVGElement[];

	constructor(abcelem: ABCElement, duration: number, minspacing: number) {
		this.abcelem = abcelem;
		this.duration = duration;
		this.minspacing = minspacing || 0;
		this.x = 0;
		this.children = [];
		this.heads = [];
		this.extra = [];
		this.extraw = 0;
		this.decs = [];
		this.w = 0;
		this.right = [];
	}

	getMinWidth(): number {
		// absolute space taken to the right of the note
		return this.w;
	}

	getExtraWidth(): number {
		// space needed to the left of the note
		return -this.extraw;
	}

	addExtra(extra: ABCRelativeElement): void {
		if (extra.dx < this.extraw) this.extraw = extra.dx;
		this.extra.push(extra);
		this.addChild(extra);
	}

	addHead(head: ABCRelativeElement): void {
		this.heads.push(head);
		this.addRight(head);
	}

	addRight(right: ABCRelativeElement): void {
		if (right.dx + right.w > this.w) this.w = right.dx + right.w;
		this.right.push(right);
		this.addChild(right);
	}

	addChild(child: ABCRelativeElement): void {
		this.children.push(child);
	}

	draw(printer: ABCPrinter, x?: number, y?: number): void {
		this.elemset = [];//printer.paper.set();
		for (let i = 0; i < this.children.length; i++) {
			this.elemset.push(this.children[i].draw(printer, this.x));
		}
		var self = this;
		//TODO line:

		// 统一的事件处理函数
		const handleMouseUp = (event: MouseEvent) => {

			// 你的点击逻辑
			printer.notifySelect(this);
		};

		// 快速绑定（一行代码写法）
		for (let element of this.elemset) {
			if (element)
				element.addEventListener('mouseup', handleMouseUp);
		}


		//this.elemset.mouseup((e) => {
		//	printer.notifySelect(self);
		//});
	}

	highlight(): void {
		//TODO line ok: 
		//this.elemset.attr({ fill: "#ff0000" });
		this.elemset.forEach(el => el.style.fill = "#ff0000");

	}

	unhighlight(): void {
		//TODO line ok: 
		//this.elemset.attr({ fill: "#000000" });
		this.elemset.forEach(el => el.style.fill = "#000000");
	}
}

class ABCRelativeElement {
	x: number;
	c: string | null;// character or path or string
	dx: number;       // relative x position
	w: number;        // minimum width taken up by this element (can include gratuitous space)
	pitch: number;    // relative y position by pitch
	scalex: number;   // should the character/path be scaled?
	type: string;     // cheap types.
	graphelem?: SVGElement;


	constructor(c: string | null, dx: number, w: number, pitch: number, opt?: { scalex?: number; type?: string }) {
		this.c = c;
		this.dx = dx;
		this.w = w;
		this.pitch = pitch;
		this.scalex = opt?.scalex || 1;
		this.type = opt?.type || "symbol";
	}

	draw(printer: ABCPrinter, x: number): SVGElement {
		this.x = x + this.dx;
		switch (this.type) {
			case "symbol":
				if (this.c === null) return null;
				this.graphelem = printer.printSymbol(this.x, this.pitch, this.c, 0, 0);
				break;
			case "path":
				this.graphelem = printer.paper.path(this.c);
				break;
			case "debug":
				this.graphelem = printer.debugMsg(this.x, this.c);
				break;
			case "text":
				this.graphelem = printer.printText(this.x, this.pitch, this.c);
				break;
		}
		if (this.scalex !== 1) {
			//TODO line ok:
			//this.graphelem.scale(this.scalex, 1, this.x, 0);
			this.graphelem.setAttribute("transform", `translate(${-(this.scalex - 1) * this.x}) scale(${this.scalex},1) `)
			//transform = "translate(-121)scale(3,1) "
		}
		return this.graphelem;
	}
}

class ABCEndingElem extends ABCAbsoluteElement {
	text: string;   // text to be displayed top left
	anchor1: ABCRelativeElement | null;  // must have a .x property or be null (means starts at the "beginning" of the line - after keysig)
	anchor2: ABCRelativeElement | null;  // must have a .x property or be null (means ends at the end of the line)

	constructor(text: string, anchor1: ABCRelativeElement | null, anchor2: ABCRelativeElement | null) {
		super(null, 0, 0);
		this.text = text;
		this.anchor1 = anchor1;
		this.anchor2 = anchor2;
	}

	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void {
		if (this.anchor1) {
			linestartx = this.anchor1.x + this.anchor1.w;
			printer.paper.path({
				path: sprintf("M %f %f L %f %f", linestartx, printer.y, linestartx, printer.y + 10)
				, stroke: "#000000"
			});
			printer.printText(linestartx + 5, 18.5, this.text);
		}

		if (this.anchor2) {
			lineendx = this.anchor2.x;
			printer.paper.path({
				path: sprintf("M %f %f L %f %f", lineendx, printer.y, lineendx, printer.y + 10)
				, stroke: "#000000"
			});
		}
		printer.paper.path({
			path: sprintf("M %f %f L %f %f", linestartx, printer.y, lineendx, printer.y)
			, stroke: "#000000"
		});
	}
}

class ABCTieElem extends ABCAbsoluteElement {
	anchor1: ABCRelativeElement | null;  // must have a .x and a .pitch property or be null (means starts at the "beginning" of the line - after keysig)
	anchor2: ABCRelativeElement | null;  // must have a .x and a .pitch property or be null (means ends at the end of the line)
	above: boolean;   // true if the arc curves above

	constructor(anchor1: ABCRelativeElement | null, anchor2: ABCRelativeElement | null, above: boolean) {
		super(null, 0, 0);
		this.anchor1 = anchor1;
		this.anchor2 = anchor2;
		this.above = above;
	}

	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void {
		// TODO end and beginning of line
		if (this.anchor1 && this.anchor2) {
			printer.drawArc(this.anchor1.x, this.anchor2.x, this.anchor1.pitch, this.anchor2.pitch, this.above);
		}
	}
}

class ABCTripletElem extends ABCAbsoluteElement {
	number: number;
	anchor1: ABCRelativeElement | null; // must have a .x and a .pitch property or be null (means starts at the "beginning" of the line - after keysig)
	anchor2: ABCRelativeElement | null; // must have a .x and a .pitch property or be null (means ends at the end of the line)
	above: boolean; // true if the arc curves above

	constructor(number: number, anchor1: ABCRelativeElement | null, anchor2: ABCRelativeElement | null, above: boolean) {
		super(null, 0, 0);
		this.number = number;
		this.anchor1 = anchor1;
		this.anchor2 = anchor2;
		this.above = above;
	}

	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void {
		// TODO end and beginning of line
		if (this.anchor1 && this.anchor2) {
			printer.printText((this.anchor1.x + this.anchor2.x) / 2, this.above ? 16 : -1, this.number.toString());
		}
	}
}

class ABCBeamElem extends ABCAbsoluteElement {
	elems: ABCAbsoluteElement[];
	total: number;
	allrests: boolean;
	min: number | null;
	max: number | null;
	asc: boolean;
	pos: number;
	startx: number;
	starty: number;
	endx: number;
	endy: number;

	constructor() {
		super(null, 0, 0);
		this.elems = [];
		this.total = 0;
		this.allrests = true;
		this.min = null;
		this.max = null;
	}

	add(abselem: ABCAbsoluteElement): void {
		this.allrests = this.allrests && (abselem.abcelem.rest_type?.length > 0);
		this.elems.push(abselem);
		const pitch = abselem.abcelem.pitches[0].pitch;
		this.total += pitch; // TODO CHORD (get pitches from abselem.heads)
		if (!this.min || pitch < this.min) {
			this.min = pitch;
		}
		if (!this.max || pitch > this.max) {
			this.max = pitch;
		}
	}

	average(): number {
		try {
			return this.total / this.elems.length;
		} catch (e) {
			return 0;
		}
	}

	draw(printer: ABCPrinter): void {
		if (this.elems.length === 0 || this.allrests) return;
		this.drawBeam(printer);
		this.drawStems(printer);
	}

	drawBeam(printer: ABCPrinter): void {
		const average = this.average();
		this.asc = average < 6; // hardcoded 6 is B
		this.pos = Math.round(this.asc ? Math.max(average + 7, this.max + 5) : Math.min(average - 7, this.min - 5));
		let slant = this.elems[0].abcelem.pitches[0].pitch - this.elems[this.elems.length - 1].abcelem.pitches[0].pitch;
		const maxslant = this.elems.length / 2;

		if (slant > maxslant) slant = maxslant;
		if (slant < -maxslant) slant = -maxslant;
		this.starty = printer.calcY(this.pos + Math.floor(slant / 2));
		this.endy = printer.calcY(this.pos + Math.floor(-slant / 2));
		this.startx = this.elems[0].x;
		if (this.asc) this.startx += this.elems[0].heads[0].w;
		this.endx = this.elems[this.elems.length - 1].x;
		if (this.asc) this.endx += this.elems[this.elems.length - 1].heads[0].w;

		const dy = this.asc ? AbcSpacing.STEP : -AbcSpacing.STEP;

		printer.paper.path({
			path: `M${this.startx} ${this.starty} L${this.endx} ${this.endy} L${this.endx} ${this.endy + dy} L${this.startx} ${this.starty + dy}z`,
			fill: "#000000"
		});
	}

	drawStems(printer: ABCPrinter): void {
		let auxbeams: { x: number, y: number, durlog: number, single: boolean }[] = [];
		for (let i = 0; i < this.elems.length; i++) {
			if (this.elems[i].abcelem.rest_type) continue;
			const pitch = this.elems[i].heads[0].pitch + ((this.asc) ? 2 / 3 : -2 / 3);
			const y = printer.calcY(pitch);
			const x = this.elems[i].heads[0].x + ((this.asc) ? this.elems[i].heads[0].w : 0);
			const dx = (this.asc) ? -0.6 : 0.6;
			const bary = this.getBarYAt(x);
			printer.paper.path({
				path: sprintf("M %f %f L %f %f L %f %f L %f %f z", x, y, x, bary,
					x + dx, bary, x + dx, y), stroke: "none", fill: "#000000"
			});

			const sy = (this.asc) ? 1.5 * AbcSpacing.STEP : -1.5 * AbcSpacing.STEP;
			for (let durlog = getDurlog(this.elems[i].duration); durlog < -3; durlog++) {
				if (auxbeams[-4 - durlog]) {
					auxbeams[-4 - durlog].single = false;
				} else {
					auxbeams[-4 - durlog] = { x: x, y: bary + sy * (-4 - durlog + 1), durlog: durlog, single: true };
				}
			}

			for (let j = auxbeams.length - 1; j >= 0; j--) {
				if (i === this.elems.length - 1 || getDurlog(this.elems[i + 1].duration) > (-j - 4)) {
					let auxbeamendx = x;
					let auxbeamendy = bary + sy * (j + 1);
					const dy = (this.asc) ? AbcSpacing.STEP : -AbcSpacing.STEP;
					if (auxbeams[j].single) {
						auxbeamendx = (i === 0) ? x + 5 : x - 5;
						auxbeamendy = this.getBarYAt(auxbeamendx) + sy * (j + 1);
					}
					printer.paper.path({
						path: `M${auxbeams[j].x} ${auxbeams[j].y} L${auxbeamendx} ${auxbeamendy} L${auxbeamendx} ${auxbeamendy + dy} L${auxbeams[j].x} ${auxbeams[j].y + dy} z`,
						fill: "#000000"
					});
					auxbeams = auxbeams.slice(0, j);
				}
			}
		}
	}

	getBarYAt(x: number): number {
		return this.starty + (this.endy - this.starty) / (this.endx - this.startx) * (x - this.startx);
	}
}

class ABCPrinter {
	x: number;
	y: number;
	paper: Svg; // Assuming any for lack of details
	space: number;
	glyphs: ABCGlyphs;
	listeners: EditArea[];
	selected: ABCAbsoluteElement[];
	staffs: ABCStaffElement[];
	partstartelem: ABCEndingElem | null;
	pos: number;
	abcline: ABCElement[];
	staff: ABCStaffElement;
	slurs: ABCTieElem[];
	ties: ABCTieElem[];
	triplet: ABCTripletElem;


	constructor(paper: any) {
		this.x = 0;
		this.y = 0;
		this.paper = paper;
		this.space = 3 * AbcSpacing.SPACE;
		this.glyphs = new ABCGlyphs(paper);
		this.listeners = [];
		this.selected = [];
		this.staffs = [];
		this.partstartelem = null;
		this.pos = 0;
		this.abcline = [];
	}

	notifySelect(abselem: ABCAbsoluteElement): void {
		this.clearSelection();
		this.selected = [abselem];
		abselem.highlight();
		for (let i = 0; i < this.listeners.length; i++) {
			this.listeners[i].highlight(abselem.abcelem);
		}
	}

	clearSelection(): void {
		for (let i = 0; i < this.selected.length; i++) {
			this.selected[i].unhighlight();
		}
		this.selected = [];
	}

	addSelectListener(listener: EditArea): void {
		this.listeners.push(listener);
	}

	rangeHighlight(start: number, end: number): void {
		this.clearSelection();
		for (let line = 0; line < this.staffs.length; line++) {
			const elems = this.staffs[line].children;
			for (let elem = 0; elem < elems.length; elem++) {
				if (elems[elem].abcelem.startChar >= start && elems[elem].abcelem.endChar <= end) {
					this.selected.push(elems[elem]);
					elems[elem].highlight();
				}
			}
		}
	}

	printText(x: number, offset: number, text: string): SVGTextElement {
		return this.paper.text(x, this.calcY(offset), text, { "text-anchor": "start" });
	}

	// assumes this.y is set appropriately
	printSymbol(x: number, offset: number, symbol: string, start: number, end: number): SVGElement | SVGGElement {
		const ycorr = this.glyphs.getYCorr(symbol);
		let arrelemts: SVGPathElement[] = [];
		if (symbol.toString() === "") return null;
		let el = this.glyphs.printSymbol(x, this.calcY(offset + ycorr), symbol[0]);
		if (el) el.setAttribute("abc-pos", "" + start + ',' + end);
		else this.debugMsg(0, "no symbol:" + symbol);
		if (symbol.toString().length < 2) {
			return el;
		} else {
			let elemset: SVGPathElement;
			let groupEle = this.paper.openGroup()
			elemset = el;
			for (let i = 1; i < symbol.toString().length; i++) {
				el = this.glyphs.printSymbol(x + elemset.getBBox().width + 3, this.calcY(offset + ycorr), symbol[i]);
				if (el) el.setAttribute("abc-pos", "" + start + ',' + end);
				else this.debugMsg(0, "no symbol:" + symbol);

				arrelemts.push(el);
				//elemset.push(el);
			}
			this.paper.closeGroup();
			return groupEle;
		}
	}

	drawArc(x1: number, x2: number, pitch1: number, pitch2: number, above: boolean): SVGPathElement {
		x1 = x1 + 6;
		x2 = x2 + 4;
		pitch1 = pitch1 + ((above) ? 1.5 : -1.5);
		pitch2 = pitch2 + ((above) ? 1.5 : -1.5);
		const y1 = this.calcY(pitch1);
		const y2 = this.calcY(pitch2);
		const dy = Math.max(4, (x2 - x1) / 5);
		const controlx1 = x1 + (x2 - x1) / 5;
		const controly1 = y1 + ((above) ? -dy : dy);
		const controlx2 = x2 - (x2 - x1) / 5;
		const controly2 = y2 + ((above) ? -dy : dy);
		const thickness = 2;
		return this.paper.path({
			path: sprintf("M %f %f C %f %f %f %f %f %f C %f %f %f %f %f %f z", x1, y1,
				controlx1, controly1, controlx2, controly2, x2, y2,
				controlx2, controly2 + thickness, controlx1, controly1 + thickness, x1, y1), stroke: "none", fill: "#000000"
		});
	}

	calcY(ofs: number): number {
		return this.y + ((AbcSpacing.TOPNOTE - ofs) * AbcSpacing.STEP);
	}

	getElem(): ABCElement | null {
		if (this.abcline.length <= this.pos) return null;
		return this.abcline[this.pos];
	}

	getNextElem(): ABCElement | null {
		if (this.abcline.length <= this.pos + 1) return null;
		return this.abcline[this.pos + 1];
	}

	nextElemType(): string {
		const elem = this.getElem();
		if (elem === null) return "spacer";

		if (elem.el_type === "note" && (getDuration(elem) >= 1 / 4 || elem.end_beam)) return "spacer";

		const nextElem = this.getNextElem();
		if (nextElem === null) return "spacer";
		if (nextElem.el_type === "note" && getDuration(nextElem) >= 1 / 4) {
			return "spacer";
		}
		return nextElem.el_type;
	}

	debugMsg(x: number, msg: string): SVGTextElement {
		return this.paper.text(x, this.y, msg);
	}

	printABC(abctune: Tune): void {
		this.y = 15;
		if (abctune.formatting.stretchlast) { this.paper.text(200, this.y, "Format: stretchlast"); this.y += 20; }
		if (abctune.formatting.staffwidth) { this.paper.text(200, this.y, "Format: staffwidth=" + abctune.formatting.staffwidth); this.y += 20; }
		if (abctune.formatting.scale) { this.paper.text(200, this.y, "Format: scale=" + abctune.formatting.scale); this.y += 20; }
		this.paper.text(350, this.y, abctune.metaText.title, { "font-size": 20 });
		this.y += 20;
		if (abctune.metaText.author) { this.paper.text(100, this.y, abctune.metaText.author); this.y += 15; }
		if (abctune.metaText.origin) { this.paper.text(100, this.y, "(" + abctune.metaText.origin + ")"); this.y += 15; }
		if (abctune.metaText.tempo) { this.paper.text(100, this.y + 20, "Tempo: " + abctune.metaText.tempo.duration + '=' + abctune.metaText.tempo.bpm); this.y += 15; }
		this.y += 15;
		for (let line = 0; line < abctune.lines.length; line++) {
			const abcline = abctune.lines[line];
			if (abcline.staff) {
				this.staffs.push(this.printABCLine(abcline));
				this.y += AbcSpacing.STAVEHEIGHT;
			} else if (abcline.subtitle) {
				this.printSubtitleLine(abcline);
				this.y += 20; // hardcoded
			}
		}
		let extraText = ""; // TODO-PER: This is just an easy way to display this info for now.
		if (abctune.metaText.partOrder) extraText += "Part Order: " + abctune.metaText.partOrder + "\n";
		if (abctune.metaText.notes) extraText += "Notes:\n" + abctune.metaText.notes + "\n";
		if (abctune.metaText.book) extraText += "Book: " + abctune.metaText.book + "\n";
		if (abctune.metaText.source) extraText += "Source: " + abctune.metaText.source + "\n";
		if (abctune.metaText.transcription) extraText += "Transcription: " + abctune.metaText.transcription + "\n";
		if (abctune.metaText.rhythm) extraText += "Rhythm: " + abctune.metaText.rhythm + "\n";
		if (abctune.metaText.discography) extraText += "Discography: " + abctune.metaText.discography + "\n";
		if (abctune.metaText.history) extraText += "History: " + abctune.metaText.history + "\n";
		if (abctune.metaText.unalignedWords) extraText += "Words:\n" + abctune.metaText.unalignedWords + "\n";
		const text = this.paper.text(10, this.y + 30, extraText, { "text-anchor": "start", font: "10px" });
		//TODO line ok 沒有 translate:text.translate(0, text.getBBox().height / 2);
		const dy = text.getAttribute("y").toNumber() + text.getBBox().height / 2
		text.setAttribute("y", dy.toString());
	}

	printSubtitleLine(abcline: ABCLine): void {
		this.paper.text(100, this.y, abcline.subtitle);
	}

	printABCLine(abcline: ABCLine): ABCStaffElement {
		this.abcline = abcline.staff;
		this.staff = new ABCStaffElement(this, this.y);
		if (this.partstartelem) {
			this.partstartelem = new ABCEndingElem("", null, null);
			this.staff.addOther(this.partstartelem);
		}
		this.slurs = [];
		this.ties = [];
		for (this.pos = 0; this.pos < this.abcline.length; this.pos++) {
			const type = this.getElem().el_type;
			const abselems = this.printABCElement();
			for (let i = 0; i < abselems.length; i++) {
				this.staff.addChild(abselems[i]);
			}
		}
		this.staff.layout(this.space);
		const prop = Math.min(1, 700 / this.staff.w);
		this.staff.layout(this.space * prop);
		this.staff.draw();
		return this.staff;
	}

	// return an array of ABCAbsoluteElement
	printABCElement(): ABCAbsoluteElement[] {
		let elemset: ABCAbsoluteElement[] = [];
		const elem = this.getElem();
		switch (elem.el_type) {
			case "note":
				elemset = this.printBeam();
				break;
			case "bar":
				elemset.push(this.printBarLine(elem as BarElement));
				break;
			case "meter":
				elemset.push(this.printTimeSignature(elem));
				break;
			case "clef":
				if (elem.type !== 'treble') this.debugMsg(10, "clef=" + elem.type);
				break;
			case "key":
				elemset.push(this.printKeySignature(elem));
				break;
		}

		return elemset;
	}

	printBeam(): ABCAbsoluteElement[] {
		const abselemset: ABCAbsoluteElement[] = [];
		if (this.nextElemType() === 'note') {
			const beamelem = new ABCBeamElem();

			for (; ;) {
				const abselem = this.printNote(this.getElem() as NoteElement, true);
				abselemset.push(abselem);
				beamelem.add(abselem);
				if (this.getElem().end_beam !== undefined || this.nextElemType() !== "note") {
					break;
				}
				this.pos++;
			}
			this.staff.addOther(beamelem);
		} else {
			abselemset.push(this.printNote(this.getElem() as NoteElement));
		}
		return abselemset;
	}
	// 排序函式 (冒泡排序實現)
	sortPitch(elem: NoteElement): void {
		let sorted: boolean;
		do {
			sorted = true;
			for (let p = 0; p < elem.pitches.length - 1; p++) {
				if (elem.pitches[p].pitch > elem.pitches[p + 1].pitch) {
					sorted = false;
					var tmp = elem.pitches[p];
					elem.pitches[p] = elem.pitches[p + 1];
					elem.pitches[p + 1] = tmp;
				}
			}
		} while (!sorted);
	}

	//方法用于打印音符，处理音符的绘制逻辑，包括音符头、符号、装饰等。

	printNote(elem: NoteElement, nostem?: boolean): ABCAbsoluteElement {
		var notehead: ABCRelativeElement = null;
		var roomtaken: number = 0; // room needed to the left of the note

		// 处理未定义的音高
		if (elem.pitches == undefined) {
			elem.pitches = [{
				accidental: elem.accidental,
				pitch: elem.pitch,
				duration: elem.duration,
				startTie: elem.startTie,
				endTie: elem.endTie,
				startSlur: elem.startSlur,
				endSlur: elem.endSlur
			}];
		}

		let duration = getDuration(elem);
		let chartable = {
			up: { "-2": "\u203a", "-1": "W", 0: "w", 1: "h", 2: "q", 3: "e", 4: "x", 5: "x", 6: "x", 7: "x" },
			down: { "-2": "\u203a", "-1": "W", 0: "w", 1: "H", 2: "Q", 3: "E", 4: "X", 5: "X", 6: "X", 7: "X" },
			rest: { 0: "\u2211", 1: "\u00d3", 2: "\u0152", 3: "\u2030", 4: "\u2248", 5: "\u00ae", 6: "\u00d9", 7: "\u00c2" }
		};

		this.sortPitch(elem);
		let abselem = new ABCAbsoluteElement(elem, duration, 1);

		let sum = 0;
		for (let p = 0; p < elem.pitches.length; p++) {
			sum += elem.pitches[p].pitch;
		}

		elem.averagepitch = sum / elem.pitches.length;
		let pitch;
		for (let p = 0; p < elem.pitches.length; p++) {
			pitch = elem.pitches[p].pitch;
			let durlog = Math.floor(Math.log(duration) / Math.log(2));
			let dot = 0;

			for (let tot = Math.pow(2, durlog), inc = tot / 2; tot < duration; dot++, tot += inc, inc /= 2);
			let c = "";

			if (elem.rest_type) {
				pitch = 7;
				switch (elem.rest_type) {
					case "rest": c = chartable["rest"][-durlog]; elem.averagepitch = 7; break; // TODO rests in bars is now broken
					case "invisible":
					case "spacer":
						c = "";
				}
			} else if (!nostem) {
				var dir = (elem.averagepitch >= 6) ? "down" : "up";
				c = chartable[dir][-durlog];
				var extraflags = (durlog < -4) ? -4 - durlog : 0;
			} else {
				c = "\u0153";
			}

			if (c === undefined) {
				abselem.addChild(new ABCRelativeElement("chartable[" + dir + "][" + (-durlog) + '] is undefined', 0, 0, 0, { type: "debug" }));
			} else if (c === "") {
				notehead = new ABCRelativeElement(null, 0, 0, pitch);
				abselem.addHead(notehead);
			} else {
				notehead = new ABCRelativeElement(c, 0, this.glyphs.getSymbolWidth(c), pitch);
				abselem.addHead(notehead);
				for (; extraflags > 0; extraflags--) {
					var pos = pitch + ((dir == "down") ? -1.5 * extraflags - 3.2 : 1.5 * extraflags + 4.1);
					var flag = (dir == "down") ? "\u00d4" : "K";
					var xdelta = (dir == "down") ? 0 : this.glyphs.getSymbolWidth("\u0153") - 0.6;
					abselem.addRight(new ABCRelativeElement(flag, xdelta, this.glyphs.getSymbolWidth(flag), pos));
				}
				for (; dot > 0; dot--) {
					var dotadjust = (1 - pitch % 2); //TODO don't adjust when above or below stave?
					abselem.addRight(new ABCRelativeElement(".", notehead.w - 2 + 5 * dot, this.glyphs.getSymbolWidth("."), pitch + dotadjust - 0.25));
				}
			}

			// 处理变音记号
			if (elem.pitches[p].accidental !== undefined && elem.pitches[p].accidental !== 'none') {
				var symb;
				switch (elem.pitches[p].accidental) {
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
				}
				roomtaken += (this.glyphs.getSymbolWidth(symb) + 2);
				abselem.addExtra(new ABCRelativeElement(symb, -roomtaken, this.glyphs.getSymbolWidth(symb), pitch));
			}

			// 处理连音线
			if (elem.pitches[p].endTie) {
				this.ties[0].anchor2 = notehead;
				this.ties = this.ties.slice(1, this.ties.length);
			}

			if (elem.pitches[p].startTie) {
				var tie = new ABCTieElem(notehead, null, (elem.averagepitch >= 6));
				this.ties.push(tie);
				this.staff.addOther(tie);
			}
		}

		// 处理歌词
		if (elem.lyric !== undefined) {
			abselem.addChild(new ABCRelativeElement(elem.lyric.syllable + elem.lyric.divider, 0, 0, 0, { type: "debug" }));
		}

		// 处理装饰音
		if (elem.gracenotes !== undefined) {
			for (var i = elem.gracenotes.length - 1; i >= 0; i--) {
				roomtaken += 10; // hardcoded
				var grace = new ABCRelativeElement(";", -roomtaken, this.glyphs.getSymbolWidth(";"), elem.gracenotes[i].pitch);
				abselem.addExtra(grace);
				if (i == 0) this.staff.addOther(new ABCTieElem(grace, notehead, false));
			}
		}

		if (elem.decoration) {
			this.printDecoration([elem.decoration], pitch, (notehead) ? notehead.w : 0, abselem);
		}

		// 处理加线
		for (var i = elem.pitches[elem.pitches.length - 1].pitch; i > 11; i--) {
			if (i % 2 === 0) {
				abselem.addChild(new ABCRelativeElement("_", -1, this.glyphs.getSymbolWidth("_"), i));
			}
		}

		for (var i = elem.pitches[0].pitch; i < 1; i++) {
			if (i % 2 === 0) {
				abselem.addChild(new ABCRelativeElement("_", -1, this.glyphs.getSymbolWidth("_"), i));
			}
		}

		// 处理和弦
		if (elem.chord !== undefined) { //16 -> high E.
			abselem.addChild(new ABCRelativeElement(elem.chord.name, 0, 0, (elem.chord.position == "below") ? -3 : 16, { type: "text" }));
		}

		// 处理滑音线
		for (var i = elem.endSlur; i > 0; i--) {
			if (this.slurs.length == 0) {
				abselem.addChild(new ABCRelativeElement("missing begin slur", 0, 0, 0, { type: "debug" }));
				continue;
			}
			this.slurs[this.slurs.length - 1].anchor2 = notehead;
			this.slurs = this.slurs.slice(0, this.slurs.length - 1);
		}

		for (var i = elem.startSlur; i > 0; i--) {
			var slur = new ABCTieElem(notehead, null, (elem.averagepitch >= 6));
			this.slurs[this.slurs.length] = slur;
			this.staff.addOther(slur);
		}

		// 处理三连音
		if (elem.startTriplet) {
			this.triplet = new ABCTripletElem(elem.startTriplet, notehead, null, (elem.averagepitch < 6));
			this.staff.addOther(this.triplet);
		}

		if (elem.endTriplet) {
			this.triplet.anchor2 = notehead;
			this.triplet = null;
		}

		return abselem;
	};

	//方法用于打印音符的装饰，如颤音、重音等。
	printDecoration(decoration: string[], pitch: number, width: number, abselem: ABCAbsoluteElement): void {
		var dec;
		var unknowndecs: string[] = [];
		var yslot = (pitch > 9) ? pitch + 3 : 12;
		var ypos;
		(pitch === 5) && (yslot = 14); // avoid upstem of the A

		for (var i = 0; i < decoration.length; i++) { // treat staccato first (may need to shift other markers) //TODO, same with tenuto?
			if (decoration[i] === "staccato") {
				ypos = (pitch >= 6) ? pitch + 2 : pitch - 2;
				(pitch === 4) && ypos--; // don't place on a stave line
				((pitch === 6) || (pitch === 8)) && ypos++;
				(pitch > 9) && yslot++; // take up some room of those that are above
				var deltax = (width - this.glyphs.getSymbolWidth(".")) / 2;
				abselem.addChild(new ABCRelativeElement(".", deltax, this.glyphs.getSymbolWidth("."), ypos));
			}
		}

		for (var i = 0; i < decoration.length; i++) {
			switch (decoration[i]) {
				case "trill": dec = "\u0178"; break;
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
					unknowndecs[unknowndecs.length] = decoration[i];
					continue;
			}
			ypos = yslot;
			yslot += 3;
			var deltax = (width - this.glyphs.getSymbolWidth(dec)) / 2;
			abselem.addChild(new ABCRelativeElement(dec, deltax, this.glyphs.getSymbolWidth("dec"), ypos));
		}
		(unknowndecs.length > 0) && this.debugMsg(20, unknowndecs.join(','));
	}
	//printBarLine 方法用于打印小节线，处理不同类型的小节线，如单细线、双细线、重复小节线等。
	printBarLine(elem: any): ABCAbsoluteElement {
		// bar_thin, bar_thin_thick, bar_thin_thin, bar_thick_thin, bar_right_repeat, bar_left_repeat, bar_double_repeat

		var abselem = new ABCAbsoluteElement(elem, 0, 10);
		var anchor: ABCRelativeElement = null;// place to attach part lines
		var dx = 0;

		if (elem.type === "bar_left_repeat")
			console.log("debug bar_left_repeat")

		var firstdots = (elem.type === "bar_right_repeat" || elem.type === "bar_dbl_repeat");
		var firstthin = (elem.type != "bar_left_repeat" && elem.type != "bar_thick_thin");
		var thick = (elem.type === "bar_right_repeat" || elem.type === "bar_dbl_repeat" || elem.type === "bar_left_repeat" ||
			elem.type === "bar_thin_thick" || elem.type === "bar_thick_thin");
		var secondthin = (elem.type === "bar_left_repeat" || elem.type === "bar_thick_thin" || elem.type === "bar_thin_thin" || elem.type === "bar_dbl_repeat");
		var seconddots = (elem.type === "bar_left_repeat" || elem.type === "bar_dbl_repeat");

		if (firstdots) {
			abselem.addRight(new ABCRelativeElement(".", dx, 1, 6.75));
			abselem.addRight(new ABCRelativeElement(".", dx, 1, 4.75));
			dx += 6; //2 hardcoded, twice;
		}

		if (firstthin) {
			anchor = new ABCRelativeElement("\\", dx, 1, 3);
			abselem.addRight(anchor);
			//symbscale = 1;
		}

		if (elem.decoration) {
			this.printDecoration(elem.decoration, 12, (thick) ? 3 : 1, abselem);
		}

		if (thick) {
			dx += 3; //3 hardcoded;
			anchor = new ABCRelativeElement("\\", dx, 6, 3, { scalex: 10 });
			abselem.addRight(anchor);
			dx += 6;
		}

		if (this.partstartelem && (thick || (firstthin && secondthin))) { // means end of nth part
			this.partstartelem.anchor2 = anchor;
			this.partstartelem = null;
		}


		if (secondthin) {
			dx += 3; //3 hardcoded;
			anchor = new ABCRelativeElement("\\", dx, 1, 3);
			abselem.addRight(anchor); // 3 is hardcoded
		}

		if (seconddots) {
			dx += 3; //3 hardcoded;
			abselem.addRight(new ABCRelativeElement(".", dx, 1, 6.75));
			abselem.addRight(new ABCRelativeElement(".", dx, 1, 4.75));
		} // 2 is hardcoded

		if (elem.number) {
			this.partstartelem = new ABCEndingElem(elem.number, anchor, null);
			this.staff.addOther(this.partstartelem);
		}

		return abselem;
	};


	//printStave 方法用于打印五线谱，处理谱号的绘制。
	printStave(width: number): void {
		this.printStaveLine(0, width, 2);
		this.printStaveLine(0, width, 4);
		this.printStaveLine(0, width, 6);
		this.printStaveLine(0, width, 8);
		this.printStaveLine(0, width, 10);
		//var staff = this.printSymbol(0, 3, "=", -1, -1); // 3 is hardcoded
		//width = width / (this.glyphs.getSymbolWidth("="));
		////TODO line 沒有 scale staff.scale(width, 1, 0, 0);
	};
	printStaveLine(x1: number, x2: number, pitch: number) {
		var dy = 0.35;
		var y = this.calcY(pitch);
		return this.paper.path({
			path: sprintf("M %f %f L %f %f L %f %f L %f %f z", x1, y - dy, x2, y - dy,
				x2, y + dy, x1, y + dy), stroke: "none", fill: "#000000"
		});
	};
	//printKeySignature 方法用于打印调号，处理升降号的绘制。
	printKeySignature(elem: any): ABCAbsoluteElement {
		var abselem = new ABCAbsoluteElement(elem, 0, 10);
		var dx = 10;
		abselem.addRight(new ABCRelativeElement("&", dx, this.glyphs.getSymbolWidth("&"), 5));
		dx += this.glyphs.getSymbolWidth("&") + 10; // hardcoded

		if (elem.regularKey) {
			var FLATS = [6, 9, 5, 8, 4, 7];
			var SHARPS = [10, 7, 11, 8, 5, 9];
			var accidentals = (elem.regularKey.acc !== "sharp") ? FLATS : SHARPS;
			var number = elem.regularKey.num;
			var symbol = (elem.regularKey.acc !== "sharp") ? "b" : "#";
			for (var i = 0; i < number; i++) {
				abselem.addRight(new ABCRelativeElement(symbol, dx, this.glyphs.getSymbolWidth(symbol), accidentals[i]));
				dx += this.glyphs.getSymbolWidth(symbol) + 2;
			}
		}
		if (elem.extraAccidentals) {
			elem.extraAccidentals.each(function (acc) {
				var symbol = (acc.acc === "sharp") ? "#" : (acc.acc === "natural") ? "n" : "b";
				var notes = { 'A': 5, 'B': 6, 'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'a': 12, 'b': 13, 'c': 7, 'd': 8, 'e': 9, 'f': 10, 'g': 11 };
				abselem.addRight(new ABCRelativeElement(symbol, dx, this.glyphs.getSymbolWidth(symbol), notes[acc.note]));
				dx += this.glyphs.getSymbolWidth(symbol) + 2;
			}, this);
		}
		return abselem;
	};


	//printTimeSignature 方法用于打印拍号，处理拍号的绘制。
	printTimeSignature(elem: any): ABCAbsoluteElement {
		//var timesig = this.currenttune.header.fields["M"];
		//var parts=timesig.match(/([\d]+)\/([\d]+)/);
		var abselem = new ABCAbsoluteElement(elem, 0, 20);
		if (elem.type === "specified") {
			//TODO make the alignment for time signatures centered
			abselem.addRight(new ABCRelativeElement(elem.num, 0, this.glyphs.getSymbolWidth(elem.num[0]), 9));
			abselem.addRight(new ABCRelativeElement(elem.den, 0, this.glyphs.getSymbolWidth(elem.den[0]), 5));
		} else if (elem.type === "common_time") {
			abselem.addRight(new ABCRelativeElement("c", 0, this.glyphs.getSymbolWidth("c"), 7));
		} else if (elem.type === "cut_time") {
			abselem.addRight(new ABCRelativeElement("C", 0, this.glyphs.getSymbolWidth("C"), 7));
		}
		return abselem;
	};
}

