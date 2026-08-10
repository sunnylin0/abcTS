// abc_graphelements.d.ts
//    abc_graphelements.js: All the drawable and layoutable datastructures to be printed by ABCPrinter
//    Copyright (C) 2010 Gregory Dyke (gregdyke at gmail dot com)
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


import { getDurlog } from "./abc_layout"
import { AbcSpacing } from "./abc_write"
import { pitchToJianpu } from "./abc_jianpu_write"

export interface StaffLayoutInfo {
	y: number;
	top: number;
	highest: number;
	lowest: number;
	bottom?: number;
}

export class ABCStaffGroupElement {
	voices: ABCVoiceElement[] = [];
	staffs: StaffLayoutInfo[] = [];
	spacingunits: number = 0;
	minspace: number = 1000;
	startx: number = 0;
	w: number = 0;
	y: number = 0;
	height: number = 0;

	addVoice(voice: ABCVoiceElement, staffnumber: number): void {
		this.voices.push(voice);
		if (!this.staffs[staffnumber]) {
			this.staffs[staffnumber] = { y: voice.y, top: 0, highest: 7, lowest: 7 };
		}
		voice.staff = this.staffs[staffnumber];
	}

	finished(): boolean {
		for (const voice of this.voices) {
			if (!voice.layoutEnded())
				return false;
		}
		return true;
	}

	layout(spacing: number, printer: ABCPrinter) {
		this.spacingunits = 0; // number of space units taken up (as opposed to fixed width). Layout engine then decides how many a pixels a space unit should be
		this.minspace = 1000; // a big number to start off with
		let x = AbcSpacing.MARGINLEFT;

		// find out how much space will be taken up by voice headers
		for (let i = 0; i < this.voices.length; i++) {
			if (this.voices[i].header) {
				const t = printer.paper.text(100, -10, this.voices[i].header).attr({ "font-size": 12, "font-family": "serif" });
				x = Math.max(x, t.getBBox().width);
				t.remove();
			}
		}
		x = x * 1.1;
		this.startx = x;
		let currentduration = 0;
		let spacingunit = 0;
		for (var i = 0; i < this.voices.length; i++) {
			this.voices[i].beginLayout(x);
		}
		while (!this.finished()) {
			let childx = x;
			let cont = true;
			// find first duration level to be laid out among candidates across voices
			currentduration = null;
			for (let i = 0; i < this.voices.length; i++) {
				if (!this.voices[i].layoutEnded() && (!currentduration || this.voices[i].getDurationIndex() < currentduration))
					currentduration = this.voices[i].getDurationIndex();
			}

			// isolate voices at current duration level
			let currentvoices: ABCVoiceElement[] = [];
			let othervoices: ABCVoiceElement[] = [];

			for (const voice of this.voices) {
				if (voice.getDurationIndex() !== currentduration) {
					othervoices.push(voice);
				} else {
					currentvoices.push(voice);
				}
			}


			// among the current duration level find the one which needs starting furthest right
			spacingunit = 0;
			for (let i = 0; i < currentvoices.length; i++) {
				if (currentvoices[i].nextx > x) {
					x = currentvoices[i].nextx;
					spacingunit = currentvoices[i].spacingunits
				}
			}
			this.spacingunits += spacingunit;
			this.minspace = Math.min(this.minspace, spacingunit);

			// remove the value of already counted spacing units
			for (let i = 0; i < othervoices.length; i++) {
				othervoices[i].spacingunits -= spacingunit;
			}

			for (let i = 0; i < currentvoices.length; i++) {
				let voicechildx = currentvoices[i].layoutOneItem(x, spacing);
				let dx = voicechildx - x;
				if (dx > 0) {
					x = voicechildx; //update x
					for (let j = 0; j < i; j++) { // shift over all previously laid out elements
						currentvoices[j].shiftRight(dx);
					}
				}
			}

			for (let voice of currentvoices) {
				voice.updateIndices();
			}
		}


		// find the greatest remaining x as a base for the width
		for (let voice of this.voices) {
			if (voice.nextx > x) {
				x = voice.nextx;
				spacingunit = voice.spacingunits;
			}
		}
		this.spacingunits += spacingunit;
		this.w = x;

		for (let voice of this.voices) {
			voice.w = this.w;
		}
	}

	draw(printer: ABCPrinter, y: number) {
		this.y = y;
		for (let i = 0; i < this.staffs.length; i++) {
			if (this.staffs[i]) {
				const shiftabove = this.staffs[i].highest - ((i === 0) ? 20 : 15);
				const shiftbelow = this.staffs[i].lowest - ((i === this.staffs.length - 1) ? 0 : 0);
				this.staffs[i].top = y;
				if (shiftabove > 0) {
					y += shiftabove * AbcSpacing.STEP;
				}
				this.staffs[i].y = y;
				y += AbcSpacing.STAVEHEIGHT * 0.9; // position of the words
				if (shiftbelow < 0) {
					y -= shiftbelow * AbcSpacing.STEP;
				}
				this.staffs[i].bottom = y;
			}
		}
		this.height = y - this.y;

		let bartop = 0;
		for (const voice of this.voices) {
			voice.draw(printer, bartop);
			if (voice.barfrom)
				bartop = voice.barbottom;
		}

		if (this.staffs.length > 1) {
			printer.y = this.staffs[0].y;
			const top = printer.calcY(10);
			printer.y = this.staffs[this.staffs.length - 1].y;
			const bottom = printer.calcY(2);
			printer.printStem(this.startx, 0.6, top, bottom);
		}

		for (let i = 0; i < this.staffs.length; i++) {
			const staff = this.staffs[i];
			if (staff) {
				printer.y = staff.y;
				const isJianpu = this.voices.some(v => v.staff === staff && v.clef === 'jianpu');
				if (!isJianpu) {
					printer.printStave(this.startx, this.w);
				}
			}
		}
	}
}

export class ABCVoiceElement {
	children: ABCAbsoluteElement[] = [];
	beams: ABCBeamElem[] = [];
	otherchildren: (ABCTieElem | ABCTripletElem | ABCEndingElem)[] = []; // ties, slurs, triplets
	w: number = 0;
	y: number = 0;
	i: number = 0;
	ii: number;
	durationindex: number = 0;
	duplicate: boolean = false;
	startx: number;
	minx: number;
	nextminx: number;
	nextx: number;
	spacingunits: number;
	voicenumber: number;
	voicetotal: number;
	barfrom: boolean;
	barto: boolean;
	barbottom: number;
	header: string;
	staff: StaffLayoutInfo;
	clef: ClefType = 'treble';
	jianpuOctave?: number;
	jianpuKey?: KeySigElement;

	constructor(y: number, voicenumber: number, voicetotal: number) {
		this.y = y;
		this.voicenumber = voicenumber; //number of the voice on a given stave (not staffgroup)
		this.voicetotal = voicetotal;
	}
	addChild(child: ABCAbsoluteElement): void {
		this.children.push(child);
	}

	addOther(child: ABCTieElem | ABCTripletElem | ABCBeamElem | ABCEndingElem): void {
		if (child instanceof ABCBeamElem) {
			this.beams.push(child);
		} else {
			this.otherchildren.push(child);
		}
	}

	updateIndices(): void {
		if (!this.layoutEnded()) {
			this.durationindex += this.children[this.i].duration;
			this.i++;
			this.minx = this.nextminx;
		}
	}

	layoutEnded(): boolean {
		return (this.i >= this.children.length);
	}

	getDurationIndex(): number {
		const child = this.children[this.i];
		return this.durationindex - (child && child.duration > 0 ? 0 : 0.0000005);
	}

	beginLayout(startx: number): void {
		this.i = 0;
		this.durationindex = 0;
		this.ii = this.children.length;
		this.startx = startx;
		this.minx = startx; // furthest left to where negatively positioned elements are allowed to go
		this.nextminx = startx;
		this.nextx = startx; // x position where the next element of this voice should be placed assuming no other voices
		this.spacingunits = 0; // units of spacing used in current iteration due to duration
	}

	// Try to layout the element at index this.i
	// x - position to try to layout the element at
	// spacing - base spacing
	layoutOneItem(x: number, spacing: number): number {
		const child = this.children[this.i];
		if (!child) return 0;
		let er = x - this.minx; // available extrawidth to the left
		if (er < child.getExtraWidth()) { // shift right by needed amound
			x += child.getExtraWidth() - er;
		}
		child.x = x;
		x += (spacing * Math.sqrt(child.duration * 8)); // add necessary duration space
		this.nextminx = child.x + child.getMinWidth(); // add necessary layout space
		if (this.i !== this.ii - 1) { // not the last element
			this.nextminx += child.minspacing;
		}
		if (this.nextminx > x) {
			x = this.nextminx;
			this.spacingunits = 0;
		} else {
			this.spacingunits = Math.sqrt(child.duration * 8);
		}
		this.nextx = x;
		// contribute to staff y position
		if (this.staff) {
			this.staff.highest = Math.max(child.top, this.staff.highest);
			this.staff.lowest = Math.min(child.bottom, this.staff.lowest);
		}
		return child.x;
	};

	shiftRight(dx: number): void {
		let child = this.children[this.i];
		if (!child) return;
		child.x += dx;
		this.nextminx += dx;
		this.nextx += dx;
	}

	drawJianpuNote(child: ABCAbsoluteElement, printer: ABCPrinter, bartop: number): void {
		const note = child.abcelem;
		let textStr = "";

		if ((note as any).rest) {
			textStr = "0";
		} else if ((note as any).pitches && (note as any).pitches.length > 0) {
			const pitches = (note as any).pitches;
			const highestPitch = pitches[pitches.length - 1];
			
			const keyRoot = (this.jianpuKey && this.jianpuKey.root) || "C";
			const refOctave = this.jianpuOctave !== undefined ? this.jianpuOctave : 0;
			const res = pitchToJianpu(highestPitch.pitch, keyRoot, refOctave);
			textStr = String(res.degree);
		}

		if (textStr) {
			// 數字在五線譜中心位置 Y 軸繪製
			const x = child.x;
			const y = this.y;
			const textEl = printer.paper.text(x, y, textStr).attr({
				"font-size": 22,
				"font-family": "sans-serif",
				"font-weight": "bold",
				"text-anchor": "middle"
			});
			
			let self = child;
			textEl.mouseup(function (e) {
				printer.notifySelect(self);
			});
		}
	}

	drawJianpu(printer: ABCPrinter, bartop: number): void {
		for (let i = 0, ii = this.children.length; i < ii; i++) {
			const child = this.children[i];
			const type = child.abcelem ? child.abcelem.el_type : null;
			if (type === 'bar') {
				child.draw(printer, bartop);
			} else if (type === 'note') {
				this.drawJianpuNote(child, printer, bartop);
			} else if (type === 'meter') {
				child.draw(printer, bartop);
			}
		}
	}

	draw(printer: ABCPrinter, bartop: number): void {
		if (this.clef === 'jianpu') {
			this.drawJianpu(printer, bartop);
			return;
		}
		const width = this.w - 1;
		if (this.staff) {
			printer.y = this.staff.y;
			printer.staffbottom = this.staff.bottom;
		} else {
			printer.y = this.y;
		}
		this.barbottom = printer.calcY(2);

		if (this.header) {
			let textpitch = 12 - (this.voicenumber + 1) * (12 / (this.voicetotal + 1));
			printer.paper.text(this.startx / 2, printer.calcY(textpitch), this.header).attr({ "font-size": 12, "font-family": "serif" });
		}

		for (let i = 0, ii = this.children.length; i < ii; i++) {
			this.children[i].draw(printer, (this.barto || i === ii - 1) ? bartop : 0);
		}

		for (let beam of this.beams) {
			beam.draw(printer, 0, 0); // beams must be drawn first for proper printing of triplets, slurs and ties.
		}


		this.otherchildren.forEach(child => {
			child.draw(printer, this.startx + 10, width);
		});
	}
}
export class ABCAbsoluteElement {
	abcelem: ABCElement;
	duration: number;
	minspacing: number = 0;
	x: number = 0;
	children: ABCRelativeElement[] = [];
	heads: ABCRelativeElement[] = [];
	extra: ABCRelativeElement[] = [];
	extraw: number = 0;
	decs: any = [];
	w: number = 0;
	right: ABCRelativeElement[] = [];
	invisible: boolean = false;
	elemset: SVGElement[];
	beam?: ABCBeamElem;
	bottom: number = 7;
	top: number = 7;

	constructor(abcelem: ABCElement, duration: number, minspacing: number = 0) {
		this.abcelem = abcelem;
		this.duration = duration;
		this.minspacing = minspacing;
	}

	getMinWidth(): number {
		return this.w;
	}

	getExtraWidth(): number {
		return -this.extraw;
	}

	addExtra(extra: ABCRelativeElement): void {
		if (extra.dx < this.extraw) this.extraw = extra.dx;
		this.extra.push(extra);
		this.addChild(extra);
	}

	addHead(head: ABCRelativeElement): void {
		if (head.dx < this.extraw) this.extraw = head.dx;
		this.heads.push(head);
		this.addRight(head);
	}

	addRight(right: ABCRelativeElement): void {
		if (right.dx + right.w > this.w) this.w = right.dx + right.w;
		this.right.push(right);
		this.addChild(right);
	}

	addChild(child: ABCRelativeElement): void {
		child.parent = this;
		this.children.push(child);
		this.pushTop(child.top);
		this.pushBottom(child.bottom);
	}

	pushTop(top: number): void {
		this.top = Math.max(top, this.top);
	}

	pushBottom(bottom: number): void {
		this.bottom = Math.min(bottom, this.bottom);
	}

	draw(printer: ABCPrinter, bartop: number): void {
		this.elemset = [];// printer.paper.set();
		if (this.invisible) return;
		printer.beginGroup();
		for (const child of this.children) {
			let drawelem: SVGElement | SVGElement[] = child.draw(printer, this.x, bartop)
			if (Array.isArray(drawelem))
				this.elemset.push(...drawelem);
			else
				this.elemset.push(drawelem);
		}
		const groupVal = printer.endGroup();
		if (groupVal) {
			this.elemset.push(groupVal);
		}
		let self: ABCAbsoluteElement = this;
		for (const el of this.elemset) {
			if (el)
				el.mouseup(function (e) {
					printer.notifySelect(self);
				});
		}
	};

	highlight(): void {
		//this.elemset.attr({ fill: "#ff0000" });

		this.elemset.forEach((el: SVGElement): SVGElement => el.attr({ fill: "#ff0000" }));
	}

	unhighlight(): void {
		this.elemset.forEach((el: SVGElement): SVGElement => el.attr({ fill: "#000000" }));
	}
}

export class ABCRelativeElement {
	x: number = 0;
	c: string | null = "";
	dx: number = 0;
	w: number = 0;
	pitch: number = 1;
	parent?: ABCAbsoluteElement;
	scalex: number = 1;
	scaley: number = 1;
	type: "symbol" | "debug" | "debugLow" | "text" | "bar" | "stem" | "ledger" = "symbol";
	pitch2: number;
	linewidth: number;
	attributes: any;
	graphelem: SVGElement[] | SVGElement;
	top: number;
	bottom: number;

	constructor(c: string, dx: number, w: number, pitch: number, opt: any = {}) {
		this.c = c;      // character or path or string
		this.dx = dx;    // relative x position
		this.w = w;      // minimum width taken up by this element (can include gratuitous space)
		this.pitch = pitch; // relative y position by pitch
		this.scalex = opt.scalex || 1; // should the character/path be scaled?
		this.scaley = opt.scaley || 1; // should the character/path be scaled?
		this.type = opt.type || "symbol"; // cheap types.
		this.pitch2 = opt.pitch2;
		this.linewidth = opt.linewidth;
		this.attributes = opt.attributes;
		this.top = pitch + ((opt.extreme === "above") ? 7 : 0);
		this.bottom = pitch - ((opt.extreme === "below") ? 7 : 0);
	}

	draw(printer: ABCPrinter, x: number, bartop: number): SVGElement | SVGElement[] {
		this.x = x + this.dx;
		switch (this.type) {
			case "symbol":
				if (this.c === null) return null;
				this.graphelem = printer.printSymbol(this.x, this.pitch, this.c, this.scalex, this.scaley);
				break;
			case "debug":
				this.graphelem = printer.debugMsg(this.x, this.c);
				break;
			case "debugLow":
				this.graphelem = printer.debugMsgLow(this.x, this.c);
				break;
			case "text":
				this.graphelem = printer.printText(this.x, this.pitch, this.c);
				break;

			case "bar":
				this.graphelem = printer.printStem(this.x, this.linewidth, printer.calcY(this.pitch), (bartop) ? bartop : printer.calcY(this.pitch2));
				break;
			case "stem":
				this.graphelem = printer.printStem(this.x, this.linewidth, printer.calcY(this.pitch), printer.calcY(this.pitch2));
				break;
			case "ledger":
				this.graphelem = printer.printStaveLine(this.x, this.x + this.w, this.pitch);
				break;
		}
		if (this.scalex !== 1 && this.graphelem) {
			if (Array.isArray(this.graphelem)) {
				if (this.graphelem.length > 0)
					this.graphelem.scale(this.scalex, this.scaley, this.x, printer.calcY(this.pitch))
			}
			else
				this.graphelem.scale(this.scalex, this.scaley, this.x, printer.calcY(this.pitch))

		}
		if (this.attributes && this.graphelem) {
			if (Array.isArray(this.graphelem))
				this.graphelem.forEach((el: SVGElement): SVGElement => el.attr(this.attributes));
		}
		return this.graphelem;
	}
}

export class ABCEndingElem {
	text: string; // text to be displayed top left
	anchor1: ABCRelativeElement; // must have a .x property or be null (means starts at the "beginning" of the line - after keysig)
	anchor2: ABCRelativeElement; // must have a .x property or be null (means ends at the end of the line)

	constructor(text: string, anchor1: ABCRelativeElement, anchor2: ABCRelativeElement) {
		this.text = text;
		this.anchor1 = anchor1;
		this.anchor2 = anchor2;
	}

	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void {
		let pathString;
		if (this.anchor1) {
			linestartx = this.anchor1.x + this.anchor1.w;
			pathString = sprintf("M %f %f L %f %f",
				linestartx, printer.y, linestartx, printer.y + 10);
			printer.paper.path().attr({ path: pathString, stroke: "#000000", fill: "none" });
			printer.printText(linestartx + 5, 18.5, this.text).attr({ "font-size": "10px" });
		}

		if (this.anchor2) {
			lineendx = this.anchor2.x;
			pathString = sprintf("M %f %f L %f %f",
				lineendx, printer.y, lineendx, printer.y + 10);
			printer.paper.path().attr({ path: pathString, stroke: "#000000", fill: "none" });
		}


		pathString = sprintf("M %f %f L %f %f",
			linestartx, printer.y, lineendx, printer.y);
		printer.paper.path().attr({ path: pathString, stroke: "#000000", fill: "none" });
	};
}
export class ABCTieElem {
	anchor1: ABCRelativeElement; // must have a .x and a .pitch, and a .parent property or be null (means starts at the "beginning" of the line - after keysig)
	anchor2: ABCRelativeElement; // must have a .x and a .pitch property or be null (means ends at the end of the line)
	above: boolean; // true if the arc curves above
	force: string | boolean;
	startlimitelem: ABCAbsoluteElement;
	endlimitelem: ABCAbsoluteElement;

	constructor(anchor1: ABCRelativeElement, anchor2: ABCRelativeElement, above: boolean, force?: string | boolean) {
		this.anchor1 = anchor1;
		this.anchor2 = anchor2;
		this.above = above;
		this.force = force;
	}

	draw(printer: ABCPrinter, linestartx: number, lineendx: number) {
		let startpitch;
		let endpitch;

		if (this.startlimitelem) {
			linestartx = this.startlimitelem.x + this.startlimitelem.w;
		}

		if (this.endlimitelem) {
			lineendx = this.endlimitelem.x;
		}

		if (this.anchor1) {
			linestartx = this.anchor1.x;
			startpitch = this.anchor1.pitch;
			if (!this.anchor2) {
				endpitch = this.anchor1.pitch;
			}
		}

		if (this.anchor2) {
			lineendx = this.anchor2.x;
			endpitch = this.anchor2.pitch;
			if (!this.anchor1) {
				startpitch = this.anchor2.pitch;
			}
		}

		let preservebeamdir = false;
		if (this.anchor1 && this.anchor2) {
			if ((!this.force &&
				this.anchor1.parent?.beam && this.anchor2.parent?.beam &&
				this.anchor1.parent.beam.asc === this.anchor2.parent.beam.asc) ||
				((this.force === "up" || this.force === "down") &&
					this.anchor1.parent?.beam && this.anchor2.parent?.beam &&
					this.anchor1.parent.beam === this.anchor2.parent.beam)) {
				this.above = !this.anchor1.parent.beam.asc;
				preservebeamdir = true;
			}
		}

		let pitchshift = 0;
		if (this.force === "up" && !preservebeamdir) pitchshift = 7;
		if (this.force === "down" && !preservebeamdir) pitchshift = -7;

		printer.drawArc(linestartx, lineendx, startpitch + pitchshift, endpitch + pitchshift, this.above);
	}
}

export class ABCTripletElem {
	number: number;
	anchor1: ABCRelativeElement; // must have a .x and a .parent property or be null (means starts at the "beginning" of the line - after keysig)
	anchor2: ABCRelativeElement; // must have a .x property or be null (means ends at the end of the line)
	above: boolean;
	anchor: boolean;

	constructor(number: number, anchor1: ABCRelativeElement, anchor2: ABCRelativeElement, above: boolean) {
		this.number = number;
		this.anchor1 = anchor1;
		this.anchor2 = anchor2;
		this.above = above;
	}

	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void {
		let beam;
		if (this.anchor1 && this.anchor2) {
			let ypos = this.above ? 14 : -1;

			if (this.anchor1.parent?.beam &&
				this.anchor1.parent.beam === this.anchor2.parent?.beam) {
				beam = this.anchor1.parent.beam;
				this.above = beam.asc;
				ypos = beam.pos;
			} else {
				this.drawLine(printer, printer.calcY(ypos));
			}

			let xsum = this.anchor1.x + this.anchor2.x;
			let ydelta = 0;
			if (beam) {
				if (this.above) {
					xsum += (this.anchor2.w + this.anchor1.w);
					ydelta = 4;
				} else {
					ydelta = -4;
				}
			} else {
				xsum += this.anchor2.w;
			}

			printer.printText(xsum / 2, ypos + ydelta, this.number.toString(), "middle").attr({ "font-size": "10px" });
		}
	}

	drawLine(printer: ABCPrinter, y: number): void {
		let pathString;
		let linestartx = this.anchor1.x;
		pathString = sprintf("M %f %f L %f %f",
			linestartx, y, linestartx, y + 5);
		printer.paper.path().attr({ path: pathString, stroke: "#000000" });


		let lineendx = this.anchor2.x + this.anchor2.w;
		pathString = sprintf("M %f %f L %f %f",
			lineendx, y, lineendx, y + 5);
		printer.paper.path().attr({ path: pathString, stroke: "#000000" });

		pathString = sprintf("M %f %f L %f %f",
			linestartx, y, (linestartx + lineendx) / 2 - 5, y);
		printer.paper.path().attr({ path: pathString, stroke: "#000000" });
	}
}

export class ABCBeamElem {
	dy: number;
	isflat: boolean;
	isgrace: boolean;
	forceup: boolean;
	forcedown: boolean;
	elems: ABCAbsoluteElement[] = []; // all the ABCAbsoluteElements
	total: number = 0;
	allrests: boolean = true;
	min: number;
	max: number;
	asc: boolean;
	pos: number;
	startx: number;
	starty: number;
	endx: number;
	endy: number;

	constructor(type: string, flat?: boolean) {
		this.isflat = flat;
		this.isgrace = type && type === "grace";
		this.forceup = type && type === "up";
		this.forcedown = type && type === "down";
		this.dy = (this.asc) ? AbcSpacing.STEP * 1.2 : -AbcSpacing.STEP * 1.2;
		if (this.isgrace) this.dy = this.dy * 0.4;
		this.allrests = true;
	}

	add(abselem: ABCAbsoluteElement): void {
		this.allrests = this.allrests && !!abselem.abcelem.rest;
		abselem.beam = this;
		this.elems.push(abselem);
		const pitch = abselem.abcelem.averagepitch;
		this.total += pitch; // TODO CHORD (get pitches from abselem.heads)
		if (!this.min || abselem.abcelem.minpitch < this.min) {
			this.min = abselem.abcelem.minpitch;
		}
		if (!this.max || abselem.abcelem.maxpitch > this.max) {
			this.max = abselem.abcelem.maxpitch;
		}
	}

	average(): number {
		if (this.elems.length === 0) return 0;
		return this.total / this.elems.length;

	}

	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void {
		if (this.elems.length === 0 || this.allrests) return;
		this.drawBeam(printer);
		this.drawStems(printer);
	}

	drawBeam(printer: ABCPrinter): void {
		const average = this.average();
		const barpos = this.isgrace ? 5 : 7;
		const barminpos = 5;
		this.asc = (this.forceup || this.isgrace || average < 6) && (!this.forcedown); // hardcoded 6 is B
		this.pos = Math.round(this.asc ? Math.max(average + barpos, this.max + barminpos) : Math.min(average - barpos, this.min - barminpos));
		let slant = this.elems[0].abcelem.averagepitch - this.elems[this.elems.length - 1].abcelem.averagepitch;
		if (this.isflat) slant = 0;
		const maxslant = this.elems.length / 2;

		if (slant > maxslant) slant = maxslant;
		if (slant < -maxslant) slant = -maxslant;
		this.starty = printer.calcY(this.pos + Math.floor(slant / 2));
		this.endy = printer.calcY(this.pos + Math.floor(-slant / 2));

		let starthead: ABCRelativeElement = this.elems[0].heads[(this.asc) ? 0 : this.elems[0].heads.length - 1];
		let endhead: ABCRelativeElement = this.elems[this.elems.length - 1].heads[(this.asc) ? 0 : this.elems[this.elems.length - 1].heads.length - 1];
		this.startx = starthead.x;
		if (this.asc) this.startx += starthead.w - 0.6;
		this.endx = endhead.x;
		if (this.asc) this.endx += endhead.w;

		let pathString = "M" + this.startx + " " + this.starty + " L" + this.endx + " " + this.endy +
			"L" + this.endx + " " + (this.endy + this.dy) + " L" + this.startx + " " + (this.starty + this.dy) + "z";
		printer.paper.path().attr({ path: pathString, stroke: "none", fill: "#000000" });
	};

	drawStems(printer: ABCPrinter): void {
		let auxbeams: Array<any> = [];  // auxbeam will be {x, y, durlog, single} auxbeam[0] should match with durlog=-4 (16th) (j=-4-durlog)
		printer.beginGroup();
		for (let i = 0, ii = this.elems.length; i < ii; i++) {
			if (this.elems[i].abcelem.rest)
				continue;
			const furthesthead: ABCRelativeElement = this.elems[i].heads[(this.asc) ? 0 : this.elems[i].heads.length - 1];
			const ovaldelta: number = (this.isgrace) ? 1 / 3 : 1 / 5;
			const pitch: number = furthesthead.pitch + ((this.asc) ? ovaldelta : -ovaldelta);
			const y: number = printer.calcY(pitch);
			const x: number = furthesthead.x + ((this.asc) ? furthesthead.w : 0);
			const bary: number = this.getBarYAt(x);
			const dx: number = (this.asc) ? -0.6 : 0.6;
			printer.printStem(x, dx, y, bary);

			let sy: number = (this.asc) ? 1.5 * AbcSpacing.STEP : -1.5 * AbcSpacing.STEP;
			if (this.isgrace) sy = sy * 2 / 3;
			for (let durlog = getDurlog(this.elems[i].duration); durlog < -3; durlog++) {
				if (auxbeams[-4 - durlog]) {
					auxbeams[-4 - durlog].single = false;
				} else {
					auxbeams[-4 - durlog] = {
						x: x + ((this.asc) ? -0.6 : 0), y: bary + sy * (-4 - durlog + 1),
						durlog: durlog, single: true
					};
				}
			}

			for (let j = auxbeams.length - 1; j >= 0; j--) {
				if (i === ii - 1 || getDurlog(this.elems[i + 1].duration) > (-j - 4)) {

					let auxbeamendx = x;
					let auxbeamendy = bary + sy * (j + 1);


					if (auxbeams[j].single) {
						auxbeamendx = (i === 0) ? x + 5 : x - 5;
						auxbeamendy = this.getBarYAt(auxbeamendx) + sy * (j + 1);
					}
					// TODO I think they are drawn from front to back, hence the small x difference with the main beam

					let pathString = "M" + auxbeams[j].x + " " + auxbeams[j].y + " L" + auxbeamendx + " " + auxbeamendy +
						"L" + auxbeamendx + " " + (auxbeamendy + this.dy) + " L" + auxbeams[j].x + " " + (auxbeams[j].y + this.dy) + "z";
					printer.paper.path().attr({ path: pathString, stroke: "none", fill: "#000000" });
					auxbeams = auxbeams.slice(0, j);
				}
			}
		}
		printer.endGroup();
	}
	getBarYAt(x: number): number {
		return this.starty + (this.endy - this.starty) / (this.endx - this.startx) * (x - this.startx);
	};

}

