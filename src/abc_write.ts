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


/*global Math, sprintf, ABCGlyphs, ABCLayout*/
/*extern ABCPrinter, AbcSpacing */

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
	tempo?: {
		preString?: string;
		duration?: string[];
		bpm?: number;
		postString?: string;
	};
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




// 声明类结构
//class ABCPrinter {
//	y: number;
//	paper: Svg;  // Raphael库的Paper类型:ml-citation{ref="2,6" data="citationList"}
//	space: number;
//	glyphs: ABCGlyphs;
//	listeners: Array<(abcelem: any) => void>;
//	selected: any[];
//	staffgroups: any[];
//	backupy: number;

//	constructor(paper: Svg);

//	setY(y: number): void;
//	unSetY(): void;
//	notifySelect(abselem: any): void;
//	clearSelection(): void;
//	addSelectListener(listener: (abcelem: any) => void): void;
//	rangeHighlight(start: number, end: number): void;
//	printStaveLine(x1: number, x2: number, pitch: number): SVGElement;
//	printStem(x: number, dx: number, y1: number, y2: number): SVGElement;
//	printText(x: number, offset: number, text: string, anchor?: string): void;
//	printSymbol(
//		x: number,
//		offset: number,
//		symbol: string,
//		start?: number,
//		end?: number
//	): SVGElement | null;
//	drawArc(
//		x1: number,
//		x2: number,
//		pitch1: number,
//		pitch2: number,
//		above: boolean
//	): SVGElement;
//	debugMsg(x: number, msg: string): void;
//	debugMsgLow(x: number, msg: string): void;
//	calcY(ofs: number): number;
//	printStave(width: number): void;
//}

//// 声明辅助类
//interface ABCGlyphs {
//	new(): ABCGlyphs;
//	getYCorr(symbol: string): number;
//	printSymbol(x: number, y: number, symbol: string, paper: Svg): SVGPathElement | null;
//	getSymbolWidth(symbol: string): number;
//}




// abc_write.d.ts

//declare namespace AbcSpacing {
//	const FONTEM: number;
//	const FONTSIZE: number;
//	const STEP: number;
//	const SPACE: number;
//	const TOPNOTE: number;
//	const STAVEHEIGHT: number;
//	const MARGINLEFT: number;
//}

//declare class ABCPrinter {
//	constructor(paper: any);

//	y: number;
//	paper: any;
//	space: number;
//	glyphs: ABCGlyphs;
//	listeners: any[];
//	selected: any[];

//	// 设置当前y坐标
//	setY(y: number): void;
//	// 恢复之前的y坐标
//	unSetY(y: number): void;
//	// 通知选择元素
//	notifySelect(abselem: any): void;
//	// 清除选择
//	clearSelection(): void;
//	// 添加选择监听器
//	addSelectListener(listener: any): void;
//	// 范围高亮
//	rangeHighlight(start: number, end: number): void;
//	// 打印五线谱线
//	printStaveLine(x: number, x: number, pitch: number): any;
//	// 打印符干
//	printStem(x: number, dx: number, y: number, y: number): any;
//	// 打印文本
//	printText(x: number, offset: number, text: string, anchor?: string): any;
//	// 打印符号
//	printSymbol(x: number, offset: number, symbol: string, start?: number, end?: number): any;
//	// 绘制弧线
//	drawArc(x: number, x: number, pitch: number, pitch: number, above: boolean): any;
//	// 调试信息
//	debugMsg(x: number, msg: string): any;
//	// 低位置调试信息
//	debugMsgLow(x: number, msg: string): void;
//	// 计算y坐标
//	calcY(ofs: number): number;
//	// 打印五线谱
//	printStave(startx: number, endx: number): void;
//	// 打印ABC音乐记谱法
//	printABC(abctune: any): void;
//	// 打印副标题行
//	printSubtitleLine(abcline: any): void;
//}





// abc_write.ts: Prints an abc file parsed by abc_parse.ts
// Copyright (C)  Gregory Dyke (gregdyke at gmail dot com)
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



//declare const ABCGlyphs: any; // External declaration for ABCGlyphs
//declare const ABCLayout: any; // External declaration for ABCLayout

interface AbcSpacing {
	FONTEM: number;
	FONTSIZE: number;
	STEP: number;
	SPACE: number;
	TOPNOTE: number;
	STAVEHEIGHT: number;
	MARGINLEFT: number;
}

//interface Paper {
//	path(): any;
//	text(x: number, y: number, text: string): any;
//	setSize(width: number, height: number): any;
//	canvas: any;
//}

//interface ABCAbsoluteElement {
//	startChar: number;
//	endChar: number;
//	highlight(): void;
//	unhighlight(): void;
//	addHead(element: any): void;
//	addExtra(element: any): void;
//	draw(printer: ABCPrinter, group?: any): void;
//	x: number;
//	w: number; // Width?
//	dx: number; // Some horizontal offset?
//}

//interface ABCRelativeElement {
//	type: string;
//	pitch2: number;
//	linewidth: number;
//}

//interface ABCLine {
//	staff?: any;
//	subtitle?: string;
//	text?: string;
//}

//interface ABCTune {
//	formatting: {
//		bagpipes?: boolean;
//		stretchlast?: boolean;
//		staffwidth?: number;
//		scale?: number;
//	};
//	metaText: {
//		title: string;
//		rhythm?: string;
//		author?: string;
//		origin?: string;
//		composer?: string;
//		tempo?: {
//			preString?: string;
//			duration?: number[];
//			bpm: number;
//			postString?: string;
//		};
//		partOrder?: string;
//		notes?: string;
//		book?: string;
//		source?: string;
//		transcription?: string;
//		discography?: string;
//		history?: string;
//		unalignedWords?: string;
//	};
//	lines: ABCLine[];
//}
// 定义AbcSpacing对象及其属性

class AbcSpacing {
	static FONTEM = 360;
	static FONTSIZE = 30;
	static STEP = AbcSpacing.FONTSIZE * 93 / 720;
	static SPACE = 10;
	static TOPNOTE = 20;
	static STAVEHEIGHT = 100;
	static MARGINLEFT = 15;
}
class ABCPrinter {
	y: number;
	width: number;
	paper: Svg;
	space: number;
	glyphs: ABCGlyphs; // Should be typed as the appropriate glyphs type
	listeners: any[]; // Should be typed as the appropriate listener type array
	selected: ABCAbsoluteElement[];
	layouter: ABCLayout; // Should be typed as the appropriate layouter type
	staffgroups: any[]; // Should be typed as the appropriate staffgroup type array
	backupy: number;

	constructor(paper: Svg, opt?: any) {
		this.y = 0;
		this.paper = paper;
		this.space = 3 * AbcSpacing.SPACE;
		this.glyphs = new ABCGlyphs();
		this.listeners = [];
		this.selected = [];
	}
	// 设置y坐标并备份当前y坐标
	setY(y: number): void {
		this.backupy = this.y;
		this.y = y;
	}
	// 恢复y坐标为备份的y坐标
	unSetY(): void {
		this.y = this.backupy;
	}
	// 通知选中元素
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

	addSelectListener(listener: any): void { // Should be typed as the appropriate listener type
		this.listeners.push(listener);
	}

	rangeHighlight(start: number, end: number): void {
		this.clearSelection();
		for (let line = 0; line < this.staffgroups.length; line++) {
			const voices = this.staffgroups[line].voices;
			for (let voice = 0; voice < voices.length; voice++) {
				const elems = voices[voice].children;
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
	// 打印五线谱线
	printStaveLine(x1: number, x2: number, pitch: number): SVGPathElement {
		const isIE = /*@cc_on!@*/ false; // IE detector
		let dy = 0.35;
		let fill = "#000000";
		if (isIE) {
			dy = 1;
			fill = "#666666";
		}
		const y = this.calcY(pitch);
		const pathString = sprintf(
			"M %.3f %.3f L %.3f %.3f L %.3f %.3f L %.3f %.3f z",
			x1, y - dy, x2, y - dy, x2, y + dy, x1, y + dy
		);
		return this.paper
			.path()
			.attr({ path: pathString, stroke: "none", fill: fill })
		//line .toBack();
	}

	printStem(x: number, dx: number, y1: number, y2: number): any {
		const isIE = /*@cc_on!@*/ false; // IE detector
		let fill = "#000000";
		if (isIE) {
			dx = 1;
			fill = "#666666";
		}
		if (~~x === x) x += 0.05; // raphael does weird rounding (for VML)
		const pathString = sprintf(
			"M %.3f %.3f L %.3f %.3f L %.3f %.3f L %.3f %.3f z",
			x, y1, x, y2, x + dx, y2, x + dx, y1
		);
		return this.paper
			.path()
			.attr({ path: pathString, stroke: "none", fill: fill })
		//line .toBack();
	}
	// 打印文本
	printText(x: number, offset: number, text: string, anchor?: string): any {
		anchor = anchor || "start";
		return this.paper
			.text(x, this.calcY(offset), text)
			.attr({ "text-anchor": anchor, "font-size": 12 });
	}
	// 打印符号
	printSymbol(
		x: number,
		offset: number,
		symbol: string,
		start?: number,
		end?: number
	): SVGPathElement | SVGPathElement[] {
		if (!symbol) return null;
		if (symbol.length > 0 && symbol.indexOf(".") < 0) {
			let elemset: SVGPathElement[] = [];
			let dx = 0;
			for (let i = 0; i < symbol.length; i++) {
				let ycorr = this.glyphs.getYCorr(symbol.charAt(i));
				let el = this.glyphs.printSymbol(
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
			let el = this.glyphs.printSymbol(
				x,
				this.calcY(offset + ycorr),
				symbol,
				this.paper
			);
			if (el) {
				return el;
			} else {
				this.debugMsg(x, "no symbol:" + symbol);
				return null;
			}
		}
	}






	drawArc(x1: number, x2: number, pitch1: number, pitch2: number, above: boolean) {
		x1 += 6;
		x2 += 4;
		pitch1 += (above ? 1.5 : -1.5);
		pitch2 += (above ? 1.5 : -1.5);
		const y1 = this.calcY(pitch1);
		const y2 = this.calcY(pitch2);

		//unit direction vector
		const dx = x2 - x1;
		const dy = y2 - y1;
		const norm = Math.sqrt(dx * dx + dy * dy);
		const ux = dx / norm;
		const uy = dy / norm;

		const flatten = norm / 5;
		const curve = ((above) ? -1 : 1) * Math.min(35, Math.max(4, flatten));

		const controlx1 = x1 + flatten * ux - curve * uy;
		const controly1 = y1 + flatten * uy + curve * ux;
		const controlx2 = x2 - flatten * ux - curve * uy;
		const controly2 = y2 - flatten * uy + curve * ux;
		const thickness = 2;

		let pathString = sprintf("M %.3f %.3f C %.3f %.3f %.3f %.3f %.3f %.3f C %.3f %.3f %.3f %.3f %.3f %.3f z",
			x1, y1,
			controlx1, controly1, controlx2, controly2, x2, y2,
			controlx2 - thickness * uy, controly2 + thickness * ux, controlx1 - thickness * uy, controly1 + thickness * ux, x1, y1);


		return this.paper.path().attr({ path: pathString, stroke: "none", fill: "#0" })
		//line .toBack();
	}
	// 调试信息
	debugMsg(x: number, msg: string): any {
		return this.paper.text(x, this.y, msg);
	}

	debugMsgLow(x: number, msg: string): SVGTextElement {
		this.paper.text(x, this.y + 80, msg).attr({ "font-family": "serif", "font-size": 12 });
		return;
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

	// 打印ABC乐谱主逻辑
	printABC(abctune: AbcTune): void {
		this.layouter = new ABCLayout(this.glyphs, abctune.formatting.bagpipes);
		this.y = 15;
		// 处理格式化参数
		if (abctune.formatting.stretchlast) { this.paper.text(200, this.y, "Format: stretchlast"); this.y += 20; }
		if (abctune.formatting.staffwidth) {
			this.width = abctune.formatting.staffwidth;
		} else {
			this.width = 700;
		}
		this.width += AbcSpacing.MARGINLEFT; // margin
		if (abctune.formatting.scale) { this.paper.text(200, this.y, "Format: scale=" + abctune.formatting.scale); this.y += 20; }
		this.paper.text(this.width / 2, this.y, abctune.metaText.title).attr({ "text-anchor": "middle", "font-size": 20, "font-family": "serif" });
		this.y += 20;
		if (abctune.lines[0] && abctune.lines[0].subtitle) {
			this.printSubtitleLine(abctune.lines[0]);
			this.y += 20;
		}
		if (abctune.metaText.rhythm) {
			this.paper.text(AbcSpacing.MARGINLEFT, this.y, abctune.metaText.rhythm).attr({ "text-anchor": "start", "font-style": "italic", "font-family": "serif", "font-size": 12 });
			!(abctune.metaText.author || abctune.metaText.origin || abctune.metaText.composer) && (this.y += 15);
		}
		if (abctune.metaText.author) { this.paper.text(this.width, this.y, abctune.metaText.author).attr({ "text-anchor": "end", "font-style": "italic", "font-family": "serif", "font-size": 12 }); this.y += 15; }
		if (abctune.metaText.origin) { this.paper.text(this.width, this.y, "(" + abctune.metaText.origin + ")").attr({ "text-anchor": "end", "font-style": "italic", "font-family": "serif", "font-size": 12 }); this.y += 15; }
		if (abctune.metaText.composer) { this.paper.text(this.width, this.y, abctune.metaText.composer).attr({ "text-anchor": "end", "font-style": "italic", "font-family": "serif", "font-size": 12 }); this.y += 15; }
		if (abctune.metaText.tempo) {
			let x = 50;
			if (abctune.metaText.tempo.preString) {
				const text = this.paper.text(x, this.y + 20, abctune.metaText.tempo.preString).attr({ "text-anchor": "start" });
				x += text.getBBox().width + 10;
			}

			if (abctune.metaText.tempo.duration) {
				const temposcale = 0.75;
				const tempopitch = 14.5;
				const duration = abctune.metaText.tempo.duration[0]; // TODO when multiple durations
				const abselem = new ABCAbsoluteElement(abctune.metaText.tempo, duration, 1);
				const durlog = Math.floor(Math.log(duration) / Math.log(2));
				let dot = 0;
				for (let tot = Math.pow(2, durlog), inc = tot / 2; tot < duration; dot++, tot += inc, inc /= 2);
				const c = this.layouter.chartable["note"][- durlog];
				const flag = this.layouter.chartable["uflags"][-durlog];
				const temponote = this.layouter.printNoteHead(abselem, c, { verticalPos: tempopitch }, "up", 0, 0, flag, dot, 0, temposcale);
				abselem.addHead(temponote);

				if (duration < 1) {
					const p1 = tempopitch + 1 / 3 * temposcale;
					const p2 = tempopitch + 7 * temposcale;
					const dx = temponote.dx + temponote.w;
					const width = -0.6;
					abselem.addExtra(new ABCRelativeElement(null, dx, 0, p1, { "type": "stem", "pitch2": p2, linewidth: width }));
				}

				abselem.x = x;
				abselem.draw(this, null);
				x += abselem.w + 5;

				const text = this.paper.text(x, this.y + 20, `= ${abctune.metaText.tempo.bpm}`).attr({ "text-anchor": "start" });
				x += text.getBBox().width + 10;
			}

			if (abctune.metaText.tempo.postString) {
				this.paper.text(x, this.y + 20, abctune.metaText.tempo.postString).attr({ "text-anchor": "start" });
			}

			this.y += 15;
		}
		this.staffgroups = [];

		let maxwidth = this.width;
		for (let line = 0; line < abctune.lines.length; line++) {
			const abcline = abctune.lines[line];
			if (abcline.staff) {
				const staffgroup = this.layouter.printABCLine(abcline.staff, this.y);
				let newspace = this.space;
				for (let it = 0; it < 3; it++) {
					staffgroup.layout(newspace, this);
					if (line && line === abctune.lines.length - 1 && staffgroup.w / this.width < .6) {
						break; // don't stretch last line too much unless it is st
					}
					const relspace = staffgroup.spacingunits * newspace;
					const constspace = staffgroup.w - relspace;
					if (staffgroup.spacingunits > 0) {
						newspace = (this.width - constspace) / staffgroup.spacingunits;
						if (newspace * staffgroup.minspace > 50) {
							newspace = 50 / staffgroup.minspace;
						}
					}
				}
				staffgroup.draw(this);
				if (staffgroup.w > maxwidth) maxwidth = staffgroup.w;
				this.staffgroups[this.staffgroups.length] = staffgroup;
				this.y = this.layouter.y;
				this.y += AbcSpacing.STAVEHEIGHT;
			} else if (abcline.subtitle && line != 0) {
				this.printSubtitleLine(abcline);
				this.y += 20; //hardcoded
			} else if (abcline.text) {
				this.paper.text(100, this.y, "TEXT: " + abcline.text);
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
		if (extraText.length > 0) {
			text2 = this.paper.text(AbcSpacing.MARGINLEFT, this.y + 25, extraText.join("\n")).attr({ "text-anchor": "start", "font-family": "serif", "font-size": 13 });
		}
		const height = text2.getBBox().height;
		text2.translate(0, height / 2);


		this.paper.setSize(maxwidth + 50, this.y + 30 + height);

		// Correct for IE problem in calculating height
		const isIE = /*@cc_on!@*/ false; // IE detector

		if (isIE) {
			this.paper.parentElement.style.width = (maxwidth + 50) + "px";
			this.paper.parentElement.style.height = "" + (this.y + 30 + height) + "px";
		} else
			this.paper.parentElement.setAttribute("style", "width:" + (maxwidth + 50) + "px");
	};


	// 打印副标题行
	printSubtitleLine(abcline: AbcTuneLine): void {

		this.paper.text(this.width / 2, this.y, abcline.subtitle).attr({ "text-anchor": "middle", "font-size": 16 });
	}
}






let asd = {
	"Object_other_treble": {
		"type": "treble",
		"verticalPos": 0
	},
	"Object_other": {
		"accidentals": [{
			"acc": "sharp",
			"note": "f",
			"verticalPos": 10
		},
		{
			"acc": "sharp",
			"note": "c",
			"verticalPos": 7
		}],
		"duration": [0.5],
		"bpm": 60
	},
	"Object_other_specified": {
		"type": "specified",
		"value": [{
			"num": "4",
			"den": "4"
		}]
	},
	"Object_bar": {
		"type": "bar_thin_thick",
		"el_type": "bar",
	},
	"Object_note": {
		"pitches": [{
			"pitch": 5,
			"verticalPos": 5
		}],
		"duration": 0.375,
		"el_type": "note",
	
	
	},
	"Object_other_common_time": { "type": "common_time" }
}

let aaa3 = {
	"Object_other_treble": {
		"type": "treble",
		"verticalPos": 0
	},
	"Object_other": {
		"accidentals": [[],
		[]],
		"duration": [0.5],
		"bpm": 60
	},
	"Object_other_specified": {
		"type": "specified",
		"value": [[]]
	},
	"Object_bar": {
		"type": "bar_thin_thick",
		"el_type": "bar",
		"startChar": 749,
		"endChar": 751,
		"startEnding": "3",
		"endEnding": true
	},
	"Object_note": {
		"pitches": [[],
			null,
			null,
			null,
		{
			"pitch": 10,
			"endSlur": 1,
			"verticalPos": 10
		}],
		"duration": 0.375,
		"el_type": "note",
		"startChar": 743,
		"endChar": 749,
		"startBeam": true,
		"gracenotes": [[]],
		"endBeam": true,
		"decoration": ["roll"],
		"chord": [],
		"rest": [],
		"lyric": [null],
		"startTriplet": 3,
		"endTriplet": true,
		"startSlur": [1],
		"endSlur": [2]
	},
	"Object_other_common_time": { "type": "common_time" }
}

//let asd2 = {
//	"Object_other_treble": {
//		"type": "treble",
//		"verticalPos": 0
//	},
//	"Object_other": {
//		"accidentals": [{
//			"acc": "sharp",
//			"note": "f",
//			"verticalPos": 10
//		},
//		{
//			"acc": "sharp",
//			"note": "c",
//			"verticalPos": 7
//		}],
//		"duration": [0.5],
//		"bpm": 60
//	},
//	"Object_other_specified": {
//		"type": "specified",
//		"value": [{
//			"num": "4",
//			"den": "4"
//		}]
//	},
//	"Object_bar": {
//		"type": "bar_thin_thick",
//		"el_type": "bar",
//		"startChar": 688,
//		"endChar": 690,
//		"startEnding": "2",
//		"endEnding": true
//	},
//	"Object_note": {
//		"pitches": [{
//			"pitch": 5,
//			"verticalPos": 5
//		}],
//		"duration": 0.375,
//		"el_type": "note",
//		"startChar": 686,
//		"endChar": 688,
//		"startBeam": true,
//		"gracenotes": [{
//			"pitch": 8,
//			"duration": 0.125,
//			"verticalPos": 8
//		}],
//		"endBeam": true,
//		"decoration": ["f"],
//		"chord": {
//			"name": "DC",
//			"position": "above"
//		},
//		"startTriplet": 6,
//		"endTriplet": true,
//		"rest": { "type": "rest" },
//		"startSlur": [1],
//		"endSlur": [1],
//		"lyric": [{
//			"syllable": "ss",
//			"divider": " "
//		}]
//	},
//	"Object_other_common_time": { "type": "common_time" }
//}

