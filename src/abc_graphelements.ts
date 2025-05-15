// abc_graphelements.ts: All the drawable and layoutable data structures to be printed by ABCPrinter
// Copyright (C) 2010 Gregory Dyke (gregdyke at gmail dot com)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

/*global ABCPrinter */
/*extern ABCVoiceElement ABCRelativeElement ABCAbsoluteElement ABCBeamElem ABCEndingElem ABCTripletElem ABCTieElem */

//完整轉換 typescript
//解析 abc_graphelements.txt 詳細產生 *.d.ts



// abc_graphelements.d.ts


//interface ABCStaffGroupElement {
//	voices: ABCVoiceElement[];
//	staffs: number[];
//	w: number;

//	addVoice(voice: ABCVoiceElement): void;
//	finished(): boolean;
//	layout(spacing: number): void;
//	draw(printer: ABCPrinter): void;
//}

//interface ABCVoiceElement {
//	children: ABCAbsoluteElement[];
//	beams: ABCBeamElem[];
//	otherchildren: (ABCTieElem | ABCTripletElem)[];
//	w: number;
//	y: number;
//	i: number;
//	ii: number;
//	extraroom: number;
//	durationroom: number;
//	room: number;
//	nextx: number;
//	header?: string;

//	constructor(y: number);
//	addChild(child: any): void;
//	addInvisibleChild(child: any): void;
//	addOther(child: any): void;
//	updateIndices(): void;
//	layoutEnded(): boolean;
//	beginLayout(): void;
//	layoutOneItem(x: number, childx: number, spacing: number): { x: number, childx: number };
//	draw(printer: ABCPrinter): void;
//}

//interface ABCAbsoluteElement {
//	abcelem: any;
//	duration: number;
//	minspacing: number;
//	x: number;
//	children: (ABCAbsoluteElement | ABCRelativeElement)[];
//	heads: ABCRelativeElement[];
//	extra: ABCRelativeElement[];
//	extraw: number;
//	decs: any[];
//	w: number;
//	right: ABCRelativeElement[];
//	invisible?: boolean;
//	parent?: ABCAbsoluteElement;
//	elemset?: any;

//	constructor(abcelem: any, duration: number, minspacing?: number);
//	getMinWidth(): number;
//	getExtraWidth(): number;
//	addExtra(extra: any): void;
//	addHead(head: any): void;
//	addRight(right: any): void;
//	addChild(child: any): void;
//	draw(printer: ABCPrinter): void;
//	highlight(): void;
//	unhighlight(): void;
//}

//interface ABCRelativeElement {

//	c: string | null;
//	dx: number;
//	w: number;
//	pitch: number;
//	scalex?: number;
//	scaley?: number;
//	type?: string;
//	pitch2?: number;
//	linewidth?: number;
//	x: number;
//	graphelem?: any;

//	constructor(c: any, dx: number, w: number, pitch: number, opt?: { scalex?: number, scaley?: number, type?: string, pitch2?: any, linewidth?: any });

//	draw(printer: ABCPrinter, x: number): any;
//}
interface ABCBaseElem {
	x?: number;
	y?: number;
}
//interface ABCEndingElem {
//	text: string;
//	anchor1: { x: number, w: number } | null;
//	anchor2: { x: number } | null;
//	constructor(text: string, anchor1: { x: number, w: number } | null, anchor2: { x: number } | null);
//	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void;
//}

//interface ABCTieElem {
//	number: string;
//	anchor1: { x: number, pitch: number, parent: ABCAbsoluteElement } | null;
//	anchor2: { x: number, pitch: number } | null;
//	above: boolean;
//	constructor(anchor1: { x: number, pitch: number, parent: any } | null, anchor2: { x: number, pitch: number } | null, above: boolean);
//	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void;
//}

//interface ABCTripletElem {
//	number: number;
//	anchor1: { x: number, parent: any } | null;
//	anchor2: { x: number } | null;
//	above: boolean;

//	constructor(number: number, anchor1: { x: number, parent: any } | null, anchor2: { x: number } | null, above: boolean);
//	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void;
//	drawLine(printer: ABCPrinter, y: number): void;
//}

//interface ABCBeamElem {
//	isgrace: boolean;
//	forceup: boolean;
//	forcedown: boolean;
//	elems: ABCAbsoluteElement[];
//	total: number;
//	allrests: boolean;
//	min: number | null;
//	max: number | null;
//	asc: boolean;
//	pos: number;

//	constructor(type?: string);
//	add(abselem: ABCAbsoluteElement): void;
//	average(): number;
//	draw(printer: ABCPrinter): void;
//	drawBeam(paper: any, basey?: number): void;
//	drawStems(printer: ABCPrinter): void;
//	getBarYAt(x: number): number;
//}




class ABCStaffGroupElement implements ABCStaffGroupElement {
	voices: ABCVoiceElement[] = [];
	staffs: number[] = [];
	w: number = 0;

	addVoice(voice: ABCVoiceElement): void {
		this.voices.push(voice);
		if (!this.staffs.includes(voice.y)) {
			this.staffs.push(voice.y);
		}
	}

	finished(): boolean {
		for (const voice of this.voices) {
			if (!voice.layoutEnded()) {
				return false;
			}
		}
		return true;
	}

	layout(spacing: number): void {
		let x = 0;
		let currentduration: number | null = null;

		for (const voice of this.voices) {
			voice.beginLayout();
		}

		while (!this.finished()) {
			let childx = x;
			let cont = true;
			// Find smallest duration to be laid out among candidates across voices
			currentduration = null;
			for (const voice of this.voices) {
				if (!voice.layoutEnded() && (!currentduration || voice.durationindex < currentduration)) {
					currentduration = voice.durationindex;
				}
			}

			// Among the current duration level, find the one which needs starting furthest right
			for (const voice of this.voices) {
				if (voice.durationindex !== currentduration) continue;
				if (voice.nextx > x) x = voice.nextx;
			}

			while (cont) {
				cont = false;
				for (const voice of this.voices) {
					if (voice.durationindex !== currentduration) continue;
					const voicechildx = voice.layoutOneItem(x, childx, spacing);
					if (voicechildx > childx) {
						childx = voicechildx;
						cont = true; // TODO not optimised for single cases
					}
				}
			}

			for (const voice of this.voices) {
				if (voice.durationindex !== currentduration) continue;
				voice.updateIndices();
			}
		}

		// Increment to the greatest x
		for (const voice of this.voices) {
			if (voice.nextx > x) x = voice.nextx;
		}

		this.w = x;
	}

	draw(printer: any): void {
		for (const voice of this.voices) {
			voice.draw(printer);
		}

		if (this.staffs.length > 1) {
			printer.setY(this.staffs[0]);
			const top = printer.calcY(10);
			printer.setY(this.staffs[this.staffs.length - 1]);
			const bottom = printer.calcY(2);
			printer.printStem(0, 0.6, top, bottom);
		}

		for (const staff of this.staffs) {
			printer.setY(staff);
			printer.printStave(this.w);
		}
		printer.unSetY();
	}
}


class ABCVoiceElement implements ABCVoiceElement {
	children: ABCAbsoluteElement[] = [];
	beams: ABCBeamElem[] = [];
	otherchildren: (ABCTieElem | ABCTripletElem)[] = [];
	w: number = 0;
	y: number;
	i: number = 0;
	ii: number = 0;
	extraroom: number = 0;
	durationroom: number = 0;
	durationindex: number = 0;
	room: number = 0;
	nextx: number = 0;
	header?: string;

	constructor(y: number) {
		this.y = y;
	}

	addChild(child: ABCAbsoluteElement): void {
		this.children.push(child);
	}

	addInvisibleChild(child: ABCAbsoluteElement): void {
		child.invisible = true;
		this.addChild(child);
	}

	addOther(child: ABCTieElem | ABCTripletElem | ABCBeamElem): void {
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
		}
	}

	layoutEnded(): boolean {
		return !(this.i < this.children.length);
	}

	beginLayout(): void {
		this.i = 0;
		this.durationindex = 0;
		this.ii = this.children.length;
		this.extraroom = 0;
		this.durationroom = 0;
		this.room = 0;
		this.nextx = 0;
	}

	layoutOneItem(x: number, childx: number, spacing: number): number {
		const child = this.children[this.i];
		if (!child) return { x: 0, childx: 0 }.x;

		let er = child.getExtraWidth() - this.room;
		if (er > 0) {
			x += child.getExtraWidth();
			this.extraroom += er;
		}

		if (x < childx) x = childx;
		child.x = x;
		x += (spacing * Math.sqrt(child.duration * 8));

		er = child.x + child.getMinWidth() - x;
		if (er > 0) {
			x = child.x + child.getMinWidth();
			if (this.i !== this.ii - 1) {
				x += child.minspacing;
			}
			this.extraroom += er;
			this.room = 0;
		} else {
			this.room = -er;
			this.durationroom += (spacing * Math.sqrt(child.duration * 8));
		}

		this.w = x;
		this.nextx = x;
		return child.x;
	}

	draw(printer: any): void {
		const width = this.w - 1;
		printer.setY(this.y);

		this.children.forEach(child => {
			child.draw(printer, 10, width);
		});

		this.beams.forEach(beam => {
			beam.draw(printer, 10, width);
		});

		this.otherchildren.forEach(child => {
			child.draw(printer, 10, width);
		});

		if (this.header) {
			printer.paper.text(100, this.y, this.header);
		}

		printer.unSetY();
	}
}


class ABCAbsoluteElement {// implements ABCAbsoluteElement {
	abcelem: any;
	duration: number;
	minspacing: number;
	x: number;
	children: ABCRelativeElement[] = [];
	heads: ABCRelativeElement[] = [];
	extra: ABCRelativeElement[] = [];
	extraw: number = 0;
	decs: any[] = [];
	w: number = 0;
	right: ABCRelativeElement[] = [];
	invisible?: boolean;
	parent?: ABCAbsoluteElement;
	elemset?: SVGElement[];
	beam?: ABCBeamElem;

	constructor(abcelem: any, duration: number, minspacing: number = 0) {
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
	}

	draw(printer: any): void {
		this.elemset = [];// printer.paper.set();
		if (this.invisible) return;

		for (const child of this.children) {
			let drawelem = child.draw(printer, this.x)
			if (Array.isArray(drawelem))
				this.elemset.push(...drawelem);
			else
				this.elemset.push(drawelem);
		}

		const self = this;
		const handleMouseUp = (event: MouseEvent) => {
			// 你的点击逻辑
			printer.notifySelect(this);
		};
		// 快速绑定（一行代码写法）
		for (let element of this.elemset) {
			if (element) {
				element.addEventListener('mouseup', handleMouseUp);
			}
		}
	}

	highlight(): void {
		this.elemset.forEach(el => el.style.fill = "#ff0000");
	}

	unhighlight(): void {
		this.elemset.forEach(el => el.style.fill = "#000000");
	}
}


class ABCRelativeElement implements ABCRelativeElement {
	c: string | null;
	dx: number;
	w: number;
	pitch: number;
	parent?: ABCAbsoluteElement;
	scalex: number = 1;
	scaley: number = 1;
	type: string = "symbol";
	pitch2?: number;
	linewidth?: number;
	x: number;
	graphelem?: any;


	constructor(c: string | null, dx: number, w: number, pitch: number, opt: { scalex?: number, scaley?: number, type?: string, pitch2?: number, linewidth?: number } = {}) {
		this.c = c;
		this.dx = dx;
		this.w = w;
		this.pitch = pitch;
		this.scalex = opt.scalex || 1;
		this.scaley = opt.scaley || 1;
		this.type = opt.type || "symbol";
		this.pitch2 = opt.pitch2;
		this.linewidth = opt.linewidth;
	}

	draw(printer: ABCPrinter, x: number): SVGElement[] {
		this.x = x + this.dx;
		switch (this.type) {
			case "symbol":
				if (this.c === null) return null;
				this.graphelem = printer.printSymbol(this.x, this.pitch, this.c, 0, 0);
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
			case "stem":
				this.graphelem = printer.printStem(this.x, this.linewidth, printer.calcY(this.pitch), printer.calcY(this.pitch2));
				break;
			case "ledger":
				this.graphelem = printer.printStaveLine(this.x, this.x + this.w, this.pitch);
				break;
		}

		if (this.scalex !== 1 && this.graphelem) {
			if (Array.isArray(this.graphelem))
				this.graphelem.forEach(ths =>
					//ths.scale(this.scalex, this.scaley, this.x, printer.calcY(this.pitch))			
					ths.setAttribute("transform", `translate(${-(this.scalex - 1) * this.x} ${-(this.scalex - 1) * printer.calcY(this.pitch) }) scale(${this.scalex},${this.scalex}) `)
				)
			else
				this.graphelem.setAttribute("transform", `translate(${-(this.scalex - 1) * this.x} ${-(this.scalex - 1) * printer.calcY(this.pitch)}) scale(${this.scalex},${this.scalex}) `)
		}
		return this.graphelem;
	}
}

class ABCEndingElem implements ABCBaseElem {
	x: number;
	y: number;
	text: string;
	anchor1: ABCRelativeElement;
	anchor2: ABCRelativeElement;

	constructor(text: string, anchor1: ABCRelativeElement, anchor2: ABCRelativeElement) {
		this.text = text; // text to be displayed top left
		this.anchor1 = anchor1; // must have a .x property or be null (means starts at the "beginning" of the line - after keysig)
		this.anchor2 = anchor2; // must have a .x property or be null (means ends at the end of the line)
	}

	draw(printer: ABCPrinter, linestartx: number, lineendx: number): void {
		if (this.anchor1) {
			linestartx = this.anchor1.x + this.anchor1.w;
			printer.paper.path({ path: `M ${linestartx} ${printer.y} L ${linestartx} ${printer.y + 10}`, stroke: "#000000" });
			printer.printText(linestartx + 5, 18.5, this.text);
		}

		if (this.anchor2) {
			lineendx = this.anchor2.x;
			printer.paper.path({ path: `M ${lineendx} ${printer.y} L ${lineendx} ${printer.y + 10}`, stroke: "#000000" });
		}

		printer.paper.path({ path: `M ${linestartx} ${printer.y} L ${lineendx} ${printer.y}`, stroke: "#000000" });
	}
}

class ABCTieElem implements ABCBaseElem {
	x: number;
	y: number;
	anchor1: ABCRelativeElement;
	anchor2: ABCRelativeElement;
	above: boolean;

	constructor(anchor1: ABCRelativeElement, anchor2: ABCRelativeElement, above: boolean) {
		this.anchor1 = anchor1;
		this.anchor2 = anchor2;
		this.above = above;
	}

	draw(printer: any, linestartx: number, lineendx: number): void {
		// TODO end and beginning of line
		if (this.anchor1 && this.anchor2) {
			if (this.anchor1.parent.beam && this.anchor2.parent.beam &&
				this.anchor1.parent.beam.asc === this.anchor2.parent.beam.asc) {
				this.above = !this.anchor1.parent.beam.asc;
			}
			printer.drawArc(this.anchor1.x, this.anchor2.x, this.anchor1.pitch, this.anchor2.pitch, this.above);
		}
	}
}


class ABCTripletElem implements ABCBaseElem {
	x: number;
	y: number;
	number: number;
	anchor1: ABCRelativeElement;
	anchor2: ABCRelativeElement;
	above: boolean;

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

			if (this.anchor1.parent.beam &&
				this.anchor1.parent.beam === this.anchor2.parent.beam) {
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

			printer.printText(xsum / 2, ypos + ydelta, this.number, "middle");
		}
	}

	drawLine(printer: ABCPrinter, y: number): void {
		let linestartx = this.anchor1.x;
		printer.paper.path({ path: `M ${linestartx} ${y} L ${linestartx} ${y + 5}`, stroke: "#000000" });

		let lineendx = this.anchor2.x + this.anchor2.w;
		printer.paper.path({ path: `M ${lineendx} ${y} L ${lineendx} ${y + 5}`, stroke: "#000000" });

		printer.paper.path({ path: `M ${linestartx} ${y} L ${(linestartx + lineendx) / 2 - 5} ${y}`, stroke: "#000000" });

		printer.paper.path({ path: `M ${(linestartx + lineendx) / 2 + 5} ${y} L ${lineendx} ${y}`, stroke: "#000000" });
	}
}

class ABCBeamElem implements ABCBaseElem {
	x?: number;
	y?: number;
	isgrace?: boolean;
	forceup?: boolean;
	forcedown?: boolean;
	elems?: ABCAbsoluteElement[] = [];
	total?: number = 0;
	allrests?: boolean = true;
	min?: number;
	max?: number;
	asc?: boolean;
	pos?: number;
	startx?: number;
	starty?: number;
	endx?: number;
	endy?: number;

	constructor(type?: string) {
		this.isgrace = type && type === "grace";
		this.forceup = type && type === "up";
		this.forcedown = type && type === "down";
	}

	add(abselem: ABCAbsoluteElement): void {
		this.allrests = this.allrests && abselem.abcelem.rest;
		abselem.beam = this;
		this.elems.push(abselem);

		const pitch = abselem.abcelem.averagepitch;
		this.total += pitch; // TODO CHORD (get pitches from abselem.heads)

		if (!this.min || abselem.abcelem.pitches[0].pitch < this.min) {
			this.min = abselem.abcelem.pitches[0].pitch;
		}
		if (!this.max || abselem.abcelem.pitches[abselem.abcelem.pitches.length - 1].pitch > this.max) {
			this.max = abselem.abcelem.pitches[abselem.abcelem.pitches.length - 1].pitch;
		}
	}

	average(): number {
		try {
			return this.total / this.elems.length;
		} catch (e) {
			return 0;
		}
	}

	draw(printer: any): void {
		if (this.elems.length === 0 || this.allrests) return;
		this.drawBeam(printer);
		this.drawStems(printer);
	}

	drawBeam(printer: any): void {
		const average = this.average();
		const barpos = this.isgrace ? 5 : 7;
		const barminpos = 5;
		this.asc = (this.forceup || this.isgrace || average < 6) && (!this.forcedown); // hardcoded 6 is B
		this.pos = Math.round(this.asc ? Math.max(average + barpos, this.max + barminpos) : Math.min(average - barpos, this.min - barminpos));
		let slant = this.elems[0].abcelem.averagepitch - this.elems[this.elems.length - 1].abcelem.averagepitch;
		const maxslant = this.elems.length / 2;

		if (slant > maxslant) slant = maxslant;
		if (slant < -maxslant) slant = -maxslant;
		this.starty = printer.calcY(this.pos + Math.floor(slant / 2));
		this.endy = printer.calcY(this.pos + Math.floor(-slant / 2));
		this.startx = this.elems[0].heads[0].x;
		if (this.asc) this.startx += this.elems[0].heads[0].w;
		this.endx = this.elems[this.elems.length - 1].heads[0].x;
		if (this.asc) this.endx += this.elems[this.elems.length - 1].heads[0].w;

		let dy = (this.asc) ? AbcSpacing.STEP : -AbcSpacing.STEP;
		if (this.isgrace) dy = dy / 2;

		printer.paper.path({ path: `M${this.startx} ${this.starty} L${this.endx} ${this.endy} L${this.endx} ${this.endy + dy} L${this.startx} ${this.starty + dy}z`, fill: "#000000" });
	}

	drawStems(printer: any): void {
		let auxbeams: { x: number, y: number, durlog: number, single: boolean }[] = [];
		for (let i = 0, ii = this.elems.length; i < ii; i++) {
			if (this.elems[i].abcelem.rest)
				continue;

			const furthesthead = this.elems[i].heads[(this.asc) ? 0 : this.elems[i].heads.length - 1];
			const ovaldelta = (this.isgrace) ? 1 / 3 : 1 / 5;
			const pitch = furthesthead.pitch + ((this.asc) ? ovaldelta : -ovaldelta);
			const y = printer.calcY(pitch);
			const x = furthesthead.x + ((this.asc) ? furthesthead.w : 0);
			const bary = this.getBarYAt(x);
			const dx = (this.asc) ? -0.6 : 0.6;
			printer.printStem(x, dx, y, bary);

			let sy = (this.asc) ? 1.5 * AbcSpacing.STEP : -1.5 * AbcSpacing.STEP;
			if (this.isgrace) sy = sy * 2 / 3;

			for (let durlog = getDurlog(this.elems[i].duration); durlog < -3; durlog++) {
				if (auxbeams[-4 - durlog]) {
					auxbeams[-4 - durlog].single = false;
				} else {
					auxbeams[-4 - durlog] = { x: x, y: bary + sy * (-4 - durlog + 1), durlog: durlog, single: true };
				}
			}

			for (let j = auxbeams.length - 1; j >= 0; j--) {
				if (i === ii - 1 || getDurlog(this.elems[i + 1].duration) > (-j - 4)) {

					let auxbeamendx = x;
					let auxbeamendy = bary + sy * (j + 1);
					let dy = (this.asc) ? AbcSpacing.STEP : -AbcSpacing.STEP;
					if (this.isgrace) dy = dy / 2;

					if (auxbeams[j].single) {
						auxbeamendx = (i === 0) ? x + 5 : x - 5;
						auxbeamendy = this.getBarYAt(auxbeamendx) + sy * (j + 1);
					}

					printer.paper.path({ path: `M${auxbeams[j].x} ${auxbeams[j].y} L${auxbeamendx} ${auxbeamendy} L${auxbeamendx} ${auxbeamendy + dy} L${auxbeams[j].x} ${auxbeams[j].y + dy} z`, fill: "#000000" });
					auxbeams = auxbeams.slice(0, j);
				}
			}
		}
	}

	getBarYAt(x: number): number {
		return this.starty + (this.endy - this.starty) / (this.endx - this.startx) * (x - this.startx);
	}
}
