//    abc_write.ts: Prints an abc file parsed by abc_parse.js
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

import { ABCGlyphs } from "./abc_glyphs"
import { ABCLayout } from "./abc_layout"
import { ABCAbsoluteElement } from "./abc_graphelements"
import { ABCRelativeElement } from "./abc_graphelements"

//請完整轉譯出 typescript  的 ABCPrinter类 function(如 drawArc, printABC)


interface AbcTuneFormatting {
	stretchlast?: boolean;
	staffwidth?: number;
	scale?: number;
}

interface AbcTuneMetaText {
	title?: string;
	author?: string;
	origin?: string;
	tempo?: TempoInfo;
	partOrder?: string;
	notes?: string;
	book?: string;
	source?: string;
	transcription?: string;
	rhythm?: string;
	discography?: string;
	history?: string;
	unalignedWords?: string;
}

interface AbcTuneLine {
	staff?: any;
	subtitle?: string;
	text?: string;
}




//declare const ABCGlyphs: any; // External declaration for ABCGlyphs
//declare const ABCLayout: any; // External declaration for ABCLayout

// 定義AbcSpacing物件及其屬性
export class AbcSpacing {
	static FONTEM = 360;
	static FONTSIZE = 30;
	static STEP = AbcSpacing.FONTSIZE * 93 / 720;
	static SPACE = 10;
	static TOPNOTE = 20;
	static STAVEHEIGHT = 100;
	static MARGINLEFT = 15;

	// 實例屬性（透過 new AbcSpacing() 的物件存取）
	FONTEM!: number;
	FONTSIZE!: number;
	STEP!: number;
	SPACE!: number;
	TOPNOTE!: number;
	STAVEHEIGHT!: number;
	MARGINLEFT!: number;
}
export class ABCPrinter {
	y: number;
	width: number;
	paper: Svg;
	space: number;
	glyphs: ABCGlyphs; // 應輸入為對應的字形類型
	listeners: any[]; // 應指定為對應的監聽器類型數組
	selected: ABCAbsoluteElement[];
	layouter: ABCLayout; // 應設定為對應的佈局器類型
	staffgroups: any[]; // 應設定為對應的 staffgroup 類型數組
	backupy: number;
	staffbottom: number = 0;
	path: any[] = [];
	lastM: number[] = [0, 0];
	ingroup: boolean = false;

	constructor(paper: Svg, opt?: any) {
		this.y = 0;
		this.paper = paper;
		this.space = 3 * AbcSpacing.SPACE;
		this.glyphs = new ABCGlyphs();
		this.listeners = [];
		this.selected = [];
		this.path = [];
		this.lastM = [0, 0];
		this.ingroup = false;
	}

	// 綁定互動關聯 (Seam)
	bindInteraction(svgEl: any, absEl: ABCAbsoluteElement): void {
		if (!svgEl || !absEl) return;
		const elements = Array.isArray(svgEl) ? svgEl : [svgEl];
		for (const el of elements) {
			if (el) {
				(el as any)._abcElement = absEl;
			}
		}
	}


	// 設定y座標並備份當前y座標
	setY(y: number): void {
		this.backupy = this.y;
		this.y = y;
	}
	// 恢復y座標為備份的y座標
	unSetY(): void {
		this.y = this.backupy;
	}
	// 通知選取元素
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

	addSelectListener(listener: any): void { // 應指定為對應的監聽器類型
		this.listeners.push(listener);
	}

	rangeHighlight(start: number, end: number): void {
		this.clearSelection();
		for (let line = 0; line < this.staffgroups.length; line++) {
			const voices: ABCVoiceElement[] = this.staffgroups[line].voices;
			for (let voice = 0; voice < voices.length; voice++) {
				const elems: ABCAbsoluteElement[] = voices[voice].children;
				for (let elem = 0; elem < elems.length; elem++) {
					const elStart = elems[elem].abcelem.startChar;
					const elEnd = elems[elem].abcelem.endChar;
					if (
						(elStart <= start && start <= elEnd) ||
						(elStart <= end && end <= elEnd) ||
						(start <= elStart && elStart <= end) ||
						(start <= elEnd && elEnd <= end)
					) {
						this.selected.push(elems[elem]);
						elems[elem].highlight();
					}
				}
			}
		}
	}


	beginGroup(): void {
		this.path = [];
		this.lastM = [0, 0];
		this.ingroup = true;
	}

	addPath(path: any[]): void {
		path = path || [];
		if (path.length === 0) return;
		const firstNode = [...path[0]];
		firstNode[0] = "m";
		firstNode[1] -= this.lastM[0];
		firstNode[2] -= this.lastM[1];
		this.lastM[0] += firstNode[1];
		this.lastM[1] += firstNode[2];
		this.path.push(firstNode);
		for (let i = 1, ii = path.length; i < ii; i++) {
			if (path[i][0] === "m") {
				this.lastM[0] += path[i][1];
				this.lastM[1] += path[i][2];
			}
			this.path.push(path[i]);
		}
	}

	endGroup(): SVGPathElement {
		this.ingroup = false;
		if (this.path.length === 0) return null;
		return this.paper.path().attr({ path: this.path, stroke: "none", fill: "#000000" }) as SVGPathElement;
	}

	// 列印五線譜線
	printStaveLine(x1: number, x2: number, pitch: number): SVGPathElement {
		const isIE = /*@cc_on!@*/ false; // IE偵測器
		let dy = 0.35;
		let fill = "#000000";
		if (isIE) {
			dy = 1;
			fill = "#666666";
		}
		const y = this.calcY(pitch);
		const pathString = sprintf(
			"M %f %f L %f %f L %f %f L %f %f z",
			x1, y - dy, x2, y - dy, x2, y + dy, x1, y + dy
		);
		return this.paper
			.path()
			.attr({ path: pathString, stroke: "none", fill: fill })
			.toBack();
	}

	printStem(x: number, dx: number, y1: number, y2: number): SVGPathElement {
		if (dx < 0) {
			const tmp = y2;
			y2 = y1;
			y1 = tmp;
		}
		const isIE = /*@cc_on!@*/ false; // IE偵測器
		let fill = "#000000";
		if (isIE && dx < 1) {
			dx = 1;
			fill = "#666666";
		}
		if (~~x === x) x += 0.05; // Raphael 對 VML 進行了奇怪的捨入 (for VML)
		const pathArray = [["M", x, y1], ["L", x, y2], ["L", x + dx, y2], ["L", x + dx, y1], ["z"]];
		if (!isIE && this.ingroup) {
			this.addPath(pathArray);
			return null;
		} else {
			const pathString = pathArray.map(cmd => cmd.join(' ')).join(' ');
			return this.paper
				.path()
				.attr({ path: pathString, stroke: "none", fill: fill }) as SVGPathElement;
		}
	}

	drawText(
		x: number,
		y: number,
		text: string,
		type: 'jianpuHeader' | 'voiceHeader' | 'noteText' | 'title' | 'rhythm' | 'metaRight' | 'tempo' | 'subtitle' | 'extraText' | 'debug'
	): SVGTextElement {
		let attributes: Record<string, any> = {};
		switch (type) {
			case 'debug':
				break;
			case 'jianpuHeader':
				attributes = {
					'font-size': 16,
					'font-family': 'sans-serif',
					'font-weight': 'bold',
					'text-anchor': 'start',
				};
				break;
			case 'voiceHeader':
				attributes = {
					"font-size": 12,
					"font-family": "serif",
					"text-anchor": "start",
				};
				break;
			case 'noteText':
				attributes = {
					"font-family": "serif",
					"font-size": 12,
					"text-anchor": "start"
				};
				break;
			case 'title':
				attributes = {
					"font-size": 20,
					"font-family": "serif",
					"text-anchor": "middle"
				};
				break;
			case 'subtitle':
				attributes = {
					"font-size": 16,
					"text-anchor": "middle"
				};
				break;
			case 'rhythm':
				attributes = {
					"text-anchor": "start",
					"font-style": "italic",
					"font-family": "serif",
					"font-size": 12
				};
				break;
			case 'metaRight':
				attributes = {
					"text-anchor": "end",
					"font-style": "italic",
					"font-family": "serif",
					"font-size": 12
				};
				break;
			case 'tempo':
				attributes = {
					"text-anchor": "start"
				};
				break;
			case 'extraText':
				attributes = {
					"text-anchor": "start",
					"font-family": "serif",
					"font-size": 13
				};
				break;
		}
		return this.paper.text(x, y, text).attr(attributes) as SVGTextElement;
	}

	drawLine(x1: number, y1: number, x2: number, y2: number, strokeWidth: number = 1.5, color: string = '#000000'): SVGPathElement {
		return this.paper.path().attr({
			path: `M ${x1} ${y1} L ${x2} ${y2}`,
			stroke: color,
			'stroke-width': strokeWidth
		}) as SVGPathElement;
	}

	drawCircle(cx: number, cy: number, r: number, fill: string = '#000000'): SVGElement {
		return this.paper.circle(cx, cy, r).attr({
			fill: fill,
			stroke: "none"
		}) as SVGElement;
	}

	// 列印文字
	printText(x: number, offset: number, text: string, anchor?: string): SVGTextElement {
		anchor = anchor || "start";
		return this.paper
			.text(x, this.calcY(offset), text)
			.attr({ "text-anchor": anchor, "font-size": 12 });
	}
	// 列印符號
	printSymbol(
		x: number,
		offset: number,
		symbol: string,
		scalex?: number,
		scaley?: number
	): SVGPathElement | SVGPathElement[] {
		if (!symbol)
			return null;
		const isIE = /*@cc_on!@*/ false; // IE偵測器
		if (symbol.length > 0 && symbol.indexOf(".") < 0) {
			let elemset: SVGPathElement[] = [];
			let dx = 0;
			for (let i = 0; i < symbol.length; i++) {
				let ycorr = this.glyphs.getYCorr(symbol.charAt(i));
				let el: SVGPathElement = this.glyphs.printSymbol(
					x + dx,
					this.calcY(offset + ycorr),
					symbol.charAt(i),
					this.paper
				);
				if (el) {
					elemset.push(el);
					dx += this.glyphs.getSymbolWidth(symbol.charAt(i));
				} else {
					this.debugMsg(x, "no symbol:" + symbol);
				}
			}
			return elemset;
		} else {
			let ycorr = this.glyphs.getYCorr(symbol);
			if (!isIE && this.ingroup) {
				const path = this.glyphs.getPathForSymbol(
					x,
					this.calcY(offset + ycorr),
					symbol,
					scalex,
					scaley
				);
				if (path) {
					this.addPath(path);
				}
				return null;
			} else {
				let el: SVGPathElement = this.glyphs.printSymbol(
					x,
					this.calcY(offset + ycorr),
					symbol,
					this.paper
				);
				if (el) {
					return el;
				} else {
					this.debugMsg(x, "no symbol:" + symbol);
				}
			}
			return null;
		}
	}


	drawArc(x1: number, x2: number, pitch1: number, pitch2: number, above: boolean) {
		x1 += 6;
		x2 += 4;
		pitch1 += (above ? 1.5 : -1.5);
		pitch2 += (above ? 1.5 : -1.5);
		const y1 = this.calcY(pitch1);
		const y2 = this.calcY(pitch2);

		//單位方向向量
		const dx = x2 - x1;
		const dy = y2 - y1;
		const norm = Math.sqrt(dx * dx + dy * dy);
		const ux = dx / norm;
		const uy = dy / norm;

		const flatten = norm / 5;
		const curve = ((above) ? -1 : 1) * Math.min(25, Math.max(4, flatten));

		const controlx1 = x1 + flatten * ux - curve * uy;
		const controly1 = y1 + flatten * uy + curve * ux;
		const controlx2 = x2 - flatten * ux - curve * uy;
		const controly2 = y2 - flatten * uy + curve * ux;
		const thickness = 2;

		let pathString = sprintf("M %f %f C %f %f %f %f %f %f C %f %f %f %f %f %f z",
			x1, y1,
			controlx1, controly1, controlx2, controly2, x2, y2,
			controlx2 - thickness * uy, controly2 + thickness * ux, controlx1 - thickness * uy, controly1 + thickness * ux, x1, y1);


		return this.paper.path().attr({ path: pathString, stroke: "none", fill: "#000000" })
			.toBack();
	}
	// 偵錯資訊
	debugMsg(x: number, msg: string): SVGTextElement {
		return this.paper.text(x, this.y, msg);
	}

	debugMsgLow(x: number, msg: string): SVGTextElement {
		return this.drawText(x, this.staffbottom, msg, 'noteText');
	}

	calcY(ofs: number): number {
		return this.y + ((AbcSpacing.TOPNOTE - ofs) * AbcSpacing.STEP);
	}
	printStave(startx: number, endx: number): SVGPathElement[] {
		let element: SVGPathElement[] = []
		element.push(this.printStaveLine(startx, endx, 2));
		element.push(this.printStaveLine(startx, endx, 4));
		element.push(this.printStaveLine(startx, endx, 6));
		element.push(this.printStaveLine(startx, endx, 8));
		element.push(this.printStaveLine(startx, endx, 10));
		return element;
	}

	// 列印ABC樂譜主邏輯
	printABC(abctune: AbcTune): void {
		this.layouter = new ABCLayout(this.glyphs, abctune.formatting.bagpipes);
		this.y = 15;
		// 處理格式化參數
		if (abctune.formatting.stretchlast) {
			this.paper.text(200, this.y, "Format: stretchlast");
			this.y += 20;
		}
		if (abctune.formatting.staffwidth) {
			this.width = abctune.formatting.staffwidth;
		} else {
			this.width = 740;
		}
		this.width += AbcSpacing.MARGINLEFT; // margin
		if (abctune.formatting.scale) {
			this.paper.text(200, this.y, "Format: scale=" + abctune.formatting.scale);
			this.y += 20;
		}
		this.drawText(this.width / 2, this.y, abctune.metaText.title, 'title');
		this.y += 20;
		if (abctune.lines[0] && abctune.lines[0].subtitle) {
			this.printSubtitleLine(abctune.lines[0]);
			this.y += 20;
		}
		if (abctune.metaText.rhythm) {
			this.drawText(AbcSpacing.MARGINLEFT, this.y, abctune.metaText.rhythm, 'rhythm');
			!(abctune.metaText.author || abctune.metaText.origin || abctune.metaText.composer) && (this.y += 15);
		}
		if (abctune.metaText.author) {
			this.drawText(this.width, this.y, abctune.metaText.author, 'metaRight');
			this.y += 15;
		}
		if (abctune.metaText.origin) {
			this.drawText(this.width, this.y, "(" + abctune.metaText.origin + ")", 'metaRight');
			this.y += 15;
		}
		if (abctune.metaText.composer) {
			this.drawText(this.width, this.y, abctune.metaText.composer, 'metaRight');
			this.y += 15;
		}
		if (abctune.metaText.tempo) {
			let x = 50;
			if (abctune.metaText.tempo.preString) {
				const text: SVGTextElement = this.drawText(x, this.y + 20, abctune.metaText.tempo.preString, 'tempo');
				x += text.getBBox().width + 10;
			}

			if (abctune.metaText.tempo.durationTempo) {
				const temposcale: number = 0.75;
				const tempopitch: number = 14.5;
				const durationTempo: number = abctune.metaText.tempo.durationTempo[0]; // TODO when multiple durations
				const abselem: ABCAbsoluteElement = new ABCAbsoluteElement(abctune.metaText.tempo, durationTempo, 1);
				const durlog = Math.floor(Math.log(durationTempo) / Math.log(2));
				let dot = 0;
				for (let tot = Math.pow(2, durlog), inc = tot / 2; tot < durationTempo; dot++, tot += inc, inc /= 2)
					;
				const c: string = this.layouter.chartable["note"][- durlog];
				const flag: string = this.layouter.chartable["uflags"][-durlog];
				const temponote: ABCRelativeElement = this.layouter.printNoteHead(abselem,
					c,
					{ verticalPos: tempopitch },
					"up",
					0,
					0,
					flag,
					dot,
					0,
					temposcale
				);
				abselem.addHead(temponote);

				if (durationTempo < 1) {
					const p1: number = tempopitch + 1 / 3 * temposcale;
					const p2: number = tempopitch + 7 * temposcale;
					const dx: number = temponote.dx + temponote.w;
					const width: number = -0.6;
					abselem.addExtra(new ABCRelativeElement(null, dx, 0, p1, { "type": "stem", "pitch2": p2, linewidth: width }));
				}

				abselem.x = x;
				abselem.draw(this, null);
				x += abselem.w + 5;

				const text: SVGTextElement = this.drawText(x, this.y + 20, `= ${abctune.metaText.tempo.bpm}`, 'tempo');
				x += text.getBBox().width + 10;
			}

			if (abctune.metaText.tempo.postString) {
				this.drawText(x, this.y + 20, abctune.metaText.tempo.postString, 'tempo');
			}

			this.y += 15;
		}
		this.staffgroups = [];

		let maxwidth = this.width;
		for (let line = 0; line < abctune.lines.length; line++) {
			const abcline: ABCLine = abctune.lines[line];
			if (abcline.staff) {
				const staffgroup: ABCStaffGroupElement = this.layouter.printABCLine(abcline.staff, this.y);
				let newspace: number = this.space;
				for (let it = 0; it < 3; it++) {
					staffgroup.layout(newspace, this);
					if (line && line === abctune.lines.length - 1 && staffgroup.w / this.width < .6) {
						break; // don't stretch last line too much unless it is st
					}
					const relspace: number = staffgroup.spacingunits * newspace;
					const constspace: number = staffgroup.w - relspace;
					if (staffgroup.spacingunits > 0) {
						newspace = (this.width - constspace) / staffgroup.spacingunits;
						if (newspace * staffgroup.minspace > 50) {
							newspace = 50 / staffgroup.minspace;
						}
					}
				}
				staffgroup.draw(this, this.y);
				if (staffgroup.w > maxwidth)
					maxwidth = staffgroup.w;
				this.staffgroups[this.staffgroups.length] = staffgroup;
				this.y = staffgroup.y + staffgroup.height;
				this.y += AbcSpacing.STAVEHEIGHT * 0.2;
			} else if (abcline.subtitle && line != 0) {
				this.printSubtitleLine(abcline);
				this.y += 20; //hardcoded
			} else if (abcline.text) {
				this.drawText(100, this.y, "TEXT: " + abcline.text, 'debug');
				this.y += 20; //hardcoded
			}
		}

		let extraText: string[] = [];	// TODO-PER: This is just an easy way to display this info for now.
		if (abctune.metaText.partOrder) extraText.push("Part Order: " + abctune.metaText.partOrder);
		if (abctune.metaText.notes) extraText.push("Notes:\n" + abctune.metaText.notes);
		if (abctune.metaText.book) extraText.push("Book: " + abctune.metaText.book);
		if (abctune.metaText.source) extraText.push("Source: " + abctune.metaText.source);
		if (abctune.metaText.transcription) extraText.push("Transcription: " + abctune.metaText.transcription);
		if (abctune.metaText.discography) extraText.push("Discography: " + abctune.metaText.discography);
		if (abctune.metaText.history) extraText.push("History: " + abctune.metaText.history);
		if (abctune.metaText.unalignedWords) extraText.push("Words:\n" + abctune.metaText.unalignedWords);
		let text2: SVGTextElement;
		let height = 10;
		text2 = this.drawText(AbcSpacing.MARGINLEFT, this.y + 25, extraText.join("\n"), 'extraText');
		height = text2.getBBox().height;
		text2.translate(0, height / 2);
		this.paper.setSize(maxwidth + 50, this.y + 30 + height);

		// 修正IE在計算高度時出現的問題
		const isIE = /*@cc_on!@*/ false; // IE detector

		if (isIE) {
			this.paper.parentElement.style.width = (maxwidth + 50) + "px";
			this.paper.parentElement.style.height = "" + (this.y + 30 + height) + "px";
		} else
			this.paper.parentElement.setAttribute("style", "width:" + (maxwidth + 50) + "px");

		// 全域事件委託綁定
		const targetEl = (this.paper as any).svg || this.paper;
		if (targetEl && typeof targetEl.addEventListener === 'function') {
			targetEl.addEventListener('mouseup', (e: MouseEvent) => {
				let curr: any = e.target;
				while (curr && curr !== targetEl) {
					if (curr._abcElement) {
						this.notifySelect(curr._abcElement);
						break;
					}
					curr = curr.parentNode;
				}
			});
		}
	};


	// 列印副標題行
	printSubtitleLine(abcline: AbcTuneLine): void {

		this.drawText(this.width / 2, this.y, abcline.subtitle, 'subtitle');
	}
}
