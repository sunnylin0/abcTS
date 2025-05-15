//    abc_write.js: Prints an abc file parsed by abc_parse.js
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

/*global sprintf */
/*global ABCLineLayout */
/*extern ABCPrinter */



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




// abc_write.d.ts
declare namespace ABCWrite {
	// 声明全局常量
	const AbcSpacing: {
		FONTEM: number;
		FONTSIZE: number;
		STEP: number;
		SPACE: number;
		TOPNOTE: number;
		STAVEHEIGHT: number;
	};

	// 声明类结构
	class ABCPrinter {
		y: number;
		paper: Svg;  // Raphael库的Paper类型:ml-citation{ref="2,6" data="citationList"}
		space: number;
		glyphs: ABCGlyphs;
		listeners: Array<(abcelem: any) => void>;
		selected: any[];
		staffgroups: any[];
		backupy: number;

		constructor(paper: Svg);

		setY(y: number): void;
		unSetY(): void;
		notifySelect(abselem: any): void;
		clearSelection(): void;
		addSelectListener(listener: (abcelem: any) => void): void;
		rangeHighlight(start: number, end: number): void;
		printStaveLine(x1: number, x2: number, pitch: number): SVGElement;
		printStem(x: number, dx: number, y1: number, y2: number): SVGElement;
		printText(x: number, offset: number, text: string, anchor?: string): void;
		printSymbol(
			x: number,
			offset: number,
			symbol: string,
			start?: number,
			end?: number
		): SVGElement | null;
		drawArc(
			x1: number,
			x2: number,
			pitch1: number,
			pitch2: number,
			above: boolean
		): SVGElement;
		debugMsg(x: number, msg: string): void;
		debugMsgLow(x: number, msg: string): void;
		calcY(ofs: number): number;
		printStave(width: number): void;
	}

	// 声明辅助类
	interface ABCGlyphs {
		new(): ABCGlyphs;
		getYCorr(symbol: string): number;
		printSymbol(x: number, y: number, symbol: string, paper: Svg): SVGPathElement | null;
		getSymbolWidth(symbol: string): number;
	}
}



// 定义AbcSpacing对象及其属性

class AbcSpacing {
	static FONTEM = 360;
	static FONTSIZE = 30;
	static STEP = AbcSpacing.FONTSIZE * 93 / 720;
	static SPACE = 10;
	static TOPNOTE = 20;
	static STAVEHEIGHT = 100;
}

// 定义ABCPrinter类
class ABCPrinter {
	y: number;
	width: number
	paper: Svg; // 假设paper对象具有特定的属性和方法，这里未详细定义
	space: number;
	glyphs: ABCGlyphs; // 假设ABCGlyphs是一个已定义的类
	listeners: any[]; // 监听器数组，具体类型取决于监听器的实现
	selected: any[]; // 选中元素数组，具体类型取决于元素的实现
	staffgroups: any[]; // 假设staffgroups用于存储乐谱信息
	backupy: number; // 备份的y坐标
	layouter: ABCLayout;

	constructor(paper: any) {
		this.y = 0;
		this.paper = paper;
		this.space = 3 * AbcSpacing.SPACE;
		this.glyphs = new ABCGlyphs(); // 假设ABCGlyphs有一个无参数的构造函数
		this.listeners = [];
		this.selected = [];
		this.staffgroups = [];
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
	notifySelect(abselem: any): void { // 具体类型取决于abselem的实现
		this.clearSelection();
		this.selected = [abselem];
		abselem.highlight();
		for (let i = 0; i < this.listeners.length; i++) {
			this.listeners[i].highlight(abselem.abcelem);
		}
	}

	// 清除选中元素
	clearSelection(): void {
		for (let i = 0; i < this.selected.length; i++) {
			this.selected[i].unhighlight();
		}
		this.selected = [];
	}

	// 添加选择监听器
	addSelectListener(listener: any): void { // 具体类型取决于监听器的实现
		this.listeners.push(listener);
	}

	// 范围高亮
	rangeHighlight(start: number, end: number): void {
		this.clearSelection();
		for (let line = 0; line < this.staffgroups.length; line++) {
			let voices = this.staffgroups[line].voices;
			for (let voice = 0; voice < voices.length; voice++) {
				let elems = voices[voice].children;
				for (let elem = 0; elem < elems.length; elem++) {
					if (elems[elem].abcelem.startChar >= start && elems[elem].abcelem.endChar <= end) {
						this.selected.push(elems[elem]);
						elems[elem].highlight();
					}
				}
			}
		}
	}

	// 打印五线谱线
	printStaveLine(x1: number, x2: number, pitch: number): any { // 返回类型取决于paper.path的返回值
		let dy = 0.35;
		let y = this.calcY(pitch);
		return this.paper.path({
			path: sprintf("M %f %f L %f %f L %f %f L %f %f z", x1, y - dy, x2, y - dy,
				x2, y + dy, x1, y + dy), stroke: "none", fill: "#000000"
		});
	}

	// 打印符干
	printStem(x: number, dx: number, y1: number, y2: number): SVGPathElement { // 返回类型取决于paper.path的返回值
		return this.paper.path({
			path: sprintf("M %f %f L %f %f L %f %f L %f %f z", x - 0.3, y1, x - 0.3, y2,
				x + dx, y2, x + dx, y1), stroke: "none", fill: "#000000"
		});
	}

	// 打印文本
	printText(x: number, offset: number, text: string, anchor: string = "start"): void {
		anchor = anchor || "start";
		this.paper.text(x, this.calcY(offset), text, { "text-anchor": anchor });
	}

	// 打印符号
	printSymbol(x: number, offset: number, symbol: string, start?: number, end?: number): SVGPathElement | SVGPathElement[] { // 返回类型取决于符号的打印结果
		if (!symbol) return null;
		if (symbol.length > 0 && symbol.indexOf(".") < 0) {
			let elemset: SVGPathElement[] = [];
			let dx = 0;
			for (let i = 0; i < symbol.length; i++) {
				let ycorr = this.glyphs.getYCorr(symbol[i]);
				let el = this.glyphs.printSymbol(x + dx, this.calcY(offset + ycorr), symbol[i], this.paper);
				if (el) {
					elemset.push(el);
					dx += this.glyphs.getSymbolWidth(symbol[i]);
				} else {
					this.debugMsg(x, "no symbol:" + symbol);
				}
			}
			return elemset;
		} else {
			let ycorr = this.glyphs.getYCorr(symbol);
			let el = this.glyphs.printSymbol(x, this.calcY(offset + ycorr), symbol, this.paper);
			if (el) {
				return el;
			} else
				this.debugMsg(x, "no symbol:" + symbol);
			return null;
		}
	}

	// 绘制弧线
	drawArc(x1: number, x2: number, pitch1: number, pitch2: number, above: boolean): any { // 返回类型取决于paper.path的返回值
		x1 += 6;
		x2 += 4;
		pitch1 += (above ? 1.5 : -1.5);
		pitch2 += (above ? 1.5 : -1.5);
		let y1 = this.calcY(pitch1);
		let y2 = this.calcY(pitch2);
		let dy = Math.max(4, (x2 - x1) / 5);
		let controlx1 = x1 + (x2 - x1) / 5;
		let controly1 = y1 + ((above ? -dy : dy));
		let controlx2 = x2 - (x2 - x1) / 5;
		let controly2 = y2 + ((above ? -dy : dy));
		let thickness = 2;
		return this.paper.path({
			path: sprintf("M %f %f C %f %f %f %f %f %f C %f %f %f %f %f %f z", x1, y1,
				controlx1, controly1, controlx2, controly2, x2, y2,
				controlx2, controly2 + thickness, controlx1, controly1 + thickness, x1, y1), stroke: "none", fill: "#000000"
		});
	}

	// 调试信息
	debugMsg(x: number, msg: string): void {
		this.paper.text(x, this.y, msg);
	}

	// 低位调试信息
	debugMsgLow(x: number, msg: string): void {
		this.paper.text(x, this.y + 80, msg);
	}

	// 计算y坐标
	calcY(ofs: number): number {
		return this.y + ((AbcSpacing.TOPNOTE - ofs) * AbcSpacing.STEP);
	}

	// 打印五线谱
	printStave(width: number): void {
		this.printStaveLine(0, width, 2);
		this.printStaveLine(0, width, 4);
		this.printStaveLine(0, width, 6);
		this.printStaveLine(0, width, 8);
		this.printStaveLine(0, width, 10);
	}

	printABC(abctune: AbcTune): void {
		this.layouter = new ABCLayout(this.glyphs);
		this.y = 15;

		// 处理格式化参数
		if (abctune.formatting.stretchlast) {
			this.paper.text(200, this.y, "Format: stretchlast");
			this.y += 20;
		}

		this.width = abctune.formatting.staffwidth ?? 700; // 使用空值合并运算符

		if (abctune.formatting.scale) {
			this.paper.text(200, this.y, `Format: scale=${abctune.formatting.scale}`);
			this.y += 20;
		}

		// 输出元数据
		this.paper.text(350, this.y, abctune.metaText.title, { "font-size": 20 });
		this.y += 20;
		if (abctune.metaText.author) { this.paper.text(500, this.y, abctune.metaText.author, { "text-anchor": "end" }); this.y += 15; }
		if (abctune.metaText.origin) { this.paper.text(500, this.y, "(" + abctune.metaText.origin + ")", { "text-anchor": "end" }); this.y += 15; }
		if (abctune.metaText.tempo) {
			this.printTempoInfo(abctune.metaText.tempo);
			this.y += 15;
		}

		// 处理乐谱行
		this.staffgroups = [];
		this.processTuneLines(abctune.lines);

		// 输出附加信息
		this.printExtraText(abctune.metaText);
	}

	private printTempoInfo(tempo: AbcTuneMetaText['tempo']): void {
		let tempoStr = "";
		tempoStr += tempo?.preString ?? "";
		tempoStr += ' | ';
		if (tempo?.duration) {
			tempoStr += tempo.duration.join(' ');
			tempoStr += ` = ${tempo.bpm} `;
		}

		tempoStr += ' | ';
		tempoStr += tempo?.postString ?? "";

		this.paper.text(100, this.y + 20, "Tempo: " + tempoStr);
	}

	private processTuneLines(lines: AbcTuneLine[]): void {
		for (const [index, abcline] of Object.entries(lines)) {
			if (abcline.staff) {
				this.processStaffLine(abcline.staff);
			} else if (abcline.subtitle) {
				this.printSubtitleLine(abcline);
				this.y += 20; //hardcoded
			} else if (abcline.text) {
				this.paper.text(100, this.y, "TEXT: " + abcline.text);
				this.y += 20;
			}
		}
	}

	private processStaffLine(staff: any): void {
		const staffgroup = this.layouter!.printABCLine(staff, this.y);
		staffgroup.layout(this.space);

		const prop = Math.min(1, this.width / staffgroup.w);
		staffgroup.layout(this.space * prop);
		staffgroup.draw(this);

		this.staffgroups.push(staffgroup);
		this.y = this.layouter!.y;
		this.y += AbcSpacing.STAVEHEIGHT;
	}

	private printExtraText(metaText: AbcTuneMetaText): void {
		let extraLines: string[] = [];


		if (metaText.partOrder) extraLines.push("Part Order: " + metaText.partOrder);
		if (metaText.notes) extraLines.push("Notes:\n" + metaText.notes);
		if (metaText.book) extraLines.push("Book: " + metaText.book);
		if (metaText.source) extraLines.push("Source: " + metaText.source);
		if (metaText.transcription) extraLines.push("Transcription: " + metaText.transcription);
		if (metaText.rhythm) extraLines.push("Rhythm: " + metaText.rhythm);
		if (metaText.discography) extraLines.push("Discography: " + metaText.discography);
		if (metaText.history) extraLines.push("History: " + metaText.history);
		if (metaText.unalignedWords) extraLines.push("Words:\n" + metaText.unalignedWords);

		if (extraLines.length > 0) {
			const text = this.paper.text(10, this.y + 30, extraLines.join('\n'));

			text.translate(0, text.getBBox().height / 2);
		}
	}

	printSubtitleLine(abcline: AbcTuneLine): void {
		if (abcline.subtitle) {
			this.paper.text(100, this.y, abcline.subtitle);
		}
	}
}