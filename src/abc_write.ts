// Add global declaration for sprintf
declare const sprintf: (...args: any[]) => string;

// abc_write.ts: Prints an abc file parsed by abc_parse.js
// Copyright (C) 2010 Gregory Dyke (gregdyke at gmail dot com)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it to be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

import { ABCGlyphs } from "./abc_glyphs";
import { ABCAbsoluteElement, ABCRelativeElement, ABCStaffGroupElement } from "./abc_graphelements";
import { ABCLayout } from "./abc_layout";
import { AbcTune } from "./abc_tune"; // This is the AbcTune class from abc_tune.ts
import { Svg } from "./svg";
import "./sprintf"



/*global Math, sprintf, ABCGlyphs, ABCLayout*/
/*extern ABCPrinter, AbcSpacing */

/*请完整转譯出 typescript  的 ABCPrinter类 function(如 drawArc, printABC)*/


// Move AbcTuneFormatting, AbcTuneMetaText, AbcTuneLine to all.d.ts or use existing ones if they match.
// For now, removing them here as requested and using the ones from all.d.ts

// Interface for Svg (assuming similar structure from previous context)
// This is the Svg class implementation from svg.ts, so we don't declare it as an interface if it's a class.
// For type checking, if `Svg` is a separate class, `paper: Svg` is fine.
// If it's a simple interface, it was `Svg`
interface Svg_Interface { // internal interface to clarify Svg requirements
	path(attributes: { path: string, stroke: string, fill: string }): SVGPathElement;
	text(x: number, y: number, text: string, attributes: { "text-anchor": string, "font-size": number, "font-family"?: string, "font-style"?: string }): SVGTextElement;
	setSize(width: number, height: number): void;
	canvas: HTMLCanvasElement; // Assuming canvas property for global events
	parentElement: HTMLElement;
}
// Assume 'Svg' is an actual class or type imported from "./svg".
// So 'paper: Svg' is correctly typed.

// Interface for AbcGlyphs (assuming similar structure from previous context)
// This is a minimal declaration for typescript to understand the class structure
declare class ABCGlyphs {
	constructor();
	getYCorr(symbol: string): number;
	printSymbol(x: number, y: number, symbol: string, paper: Svg): SVGPathElement | null;
	getSymbolWidth(symbol: string): number;
}

// Interface for ABCLayout (minimal definition for constructor usage, now including printABCLine return type)
// This declaration assumes the structure of the ABCLayout class implementation from abc_layout.ts
declare class ABCLayout {
	constructor(glyphs: ABCGlyphs, bagpipes?: boolean);
	chartable: { [key: string]: any }; // Adjust if a more specific type is known
	/**
	 * Takes a staff array (presumably ABCElement[]) and Y position to return a laid-out staff group.
	 */
	printABCLine(staff: any, y: number): ABCStaffGroupElement; // Now returns ABCStaffGroup
	y: number; // Add y property based on usage

	// printNoteHead definition from actual usage. Assuming it returns ABCRelativeElement
	printNoteHead(
		abselem: ABCAbsoluteElement,
		c: string,
		pos: { verticalPos: number },
		dir: string,
		linestartx: number,
		linew: number,
		flag: number,
		dot: number,
		notewidth: number,
		scale: number
	): ABCRelativeElement;
}


// The AbcTune interface also needs to use the imported types for consistency.
// Assuming AbcTune is a class/interface from abc_tune.ts, we should extend or augment it if needed.
// For now, I'll modify the AbcTune import structure to define a new type `AbcTuneResolved`
// that uses the consistent types.
// A simpler approach for the given context is to update the type of `abctune` parameter in `printABC`.

// Declare 'AbcTune' with consistent internal types just for the `printABC` parameter.
// This assumes the `AbcTune` class/interface imported from `./abc_tune` eventually conforms to this.
interface AbcTuneResolved extends AbcTune { // Extend original AbcTune
	formatting: Formatting;
	metaText: TuneMetaText;
	lines: ABCLine[];
}


export class AbcSpacing {
	static FONTEM = 360;
	static FONTSIZE = 30;
	static STEP = AbcSpacing.FONTSIZE * 93 / 720;
	static SPACE = 10;
	static TOPNOTE = 20;
	static STAVEHEIGHT = 100;
	static MARGINLEFT = 15;
}
export class ABCPrinter {
	y: number;
	width: number;
	paper: Svg;
	space: number;
	glyphs: ABCGlyphs; // Should be typed as the appropriate glyphs type
	listeners: any[]; // Should be typed as the appropriate listener type array
	selected: ABCAbsoluteElement[];
	layouter: ABCLayout; // Should be typed as the appropriate layouter type
	staffgroups: ABCStaffGroupElement[]; // Changed to ABCStaffGroupElement[]
	backupy: number;

	// Dragging state for stave lines
	private staveLineElements: { element: SVGPathElement, originalY: number, currentTransformY: number }[] = [];
	private isStaveLineDragging: boolean = false;
	private draggedStaveLineData: { element: SVGPathElement, originalY: number, currentTransformY: number } | null = null;
	private dragStartClientY: number = 0;

	// Bound event handlers for global scope
	private handleCanvasMouseMoveBound: (e: MouseEvent) => void;
	private handleCanvasMouseUpBound: (e: MouseEvent) => void;
	private handleCanvasMouseLeaveBound: (e: MouseEvent) => void;


	constructor(paper: Svg, opt?: any) {
		this.y = 0;
		this.paper = paper;
		this.space = 3 * AbcSpacing.SPACE;
		this.glyphs = new ABCGlyphs();
		this.listeners = [];
		this.selected = [];
		this.staffgroups = []; // Initialize staffgroups

		this.handleCanvasMouseMoveBound = this.handleCanvasMouseMove.bind(this);
		this.handleCanvasMouseUpBound = this.handleCanvasMouseUp.bind(this);
		this.handleCanvasMouseLeaveBound = this.handleCanvasMouseUp.bind(this); // Use mouseup logic for leave
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
			const staffgroup = this.staffgroups[line];
			const voices = staffgroup.voices; // staffgroup.voices is now typed

			if (voices) {
				for (let voice = 0; voice < voices.length; voice++) {
					const elems = voices[voice].children;
					if (elems) {
						for (let elem = 0; elem < elems.length; elem++) {
							const elStart = elems[elem].abcelem?.startChar;
							const elEnd = elems[elem].abcelem?.endChar;
							if (
								elStart !== undefined && elEnd !== undefined && (
									(elStart <= start && start <= elEnd) ||
									(elStart <= end && end <= elEnd) ||
									(start <= elStart && elStart <= end) ||
									(start <= elEnd && elEnd <= end)
								)
							) {
								this.selected.push(elems[elem]);
								elems[elem].highlight();
							}
						}
					}
				}
			}
		}	
	}

	// Handles mousedown on an individual stave line
	private handleStaveLineMouseDown(e: MouseEvent, element: SVGPathElement, originalY: number): void {
		e.stopPropagation(); // Prevent canvas click/other higher-level events
		e.preventDefault(); // Prevent native browser drag behavior

		this.isStaveLineDragging = true;
		this.dragStartClientY = e.clientY;

		// Try to find if this element's data is already tracked
		this.draggedStaveLineData = this.staveLineElements.find(data => data.element === element) || null;

		if (!this.draggedStaveLineData) {
			// If not found, create a new entry (shouldn't happen if printStaveLine is always tracking)
			this.draggedStaveLineData = { element: element, originalY: originalY, currentTransformY: 0 };
			this.staveLineElements.push(this.draggedStaveLineData);
		}

		// Get current transform Y if it exists, otherwise 0
		const currentTransform = element.transform.baseVal.numberOfItems > 0 ? element.transform.baseVal.getItem(0) : null;
		if (currentTransform && currentTransform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
			this.draggedStaveLineData.currentTransformY = currentTransform.matrix.f; // Get current translateY
		} else {
			this.draggedStaveLineData.currentTransformY = 0;
		}

		// Attach global listeners to the canvas for dragging
		this.paper.canvas.addEventListener('mousemove', this.handleCanvasMouseMoveBound);
		this.paper.canvas.addEventListener('mouseup', this.handleCanvasMouseUpBound);
		this.paper.canvas.addEventListener('mouseleave', this.handleCanvasMouseLeaveBound); // Stop drag if mouse leaves canvas
	}

	// Handles mousemove on the global canvas while dragging a stave line
	private handleCanvasMouseMove(e: MouseEvent): void {
		if (!this.isStaveLineDragging || !this.draggedStaveLineData) return;

		const deltaY = e.clientY - this.dragStartClientY;
		const newTransformY = this.draggedStaveLineData.currentTransformY + deltaY;

		// Apply translate transform
		this.draggedStaveLineData.element.setAttribute('transform', `translate(0, ${newTransformY})`);
		// Optionally, you could add visual feedback here (e.g., change stroke color)
	}

	// Handles mouseup on the global canvas to end stave line dragging
	private handleCanvasMouseUp(e: MouseEvent): void {
		if (!this.isStaveLineDragging || !this.draggedStaveLineData) return;

		this.isStaveLineDragging = false;
		// Detach global listeners
		this.paper.canvas.removeEventListener('mousemove', this.handleCanvasMouseMoveBound);
		this.paper.canvas.removeEventListener('mouseup', this.handleCanvasMouseUpBound);
		this.paper.canvas.removeEventListener('mouseleave', this.handleCanvasMouseLeaveBound);

		// Here you would typically "save" the change.
		// For example, calculate the final offset from the original position:
		// Attempt to get the current transform again, as it might have changed during drag.
		const currentTransform = this.draggedStaveLineData.element.transform.baseVal.numberOfItems > 0 ?
		                        this.draggedStaveLineData.element.transform.baseVal.getItem(0) : null;
		const finalTransformY = (currentTransform && currentTransform.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) ? currentTransform.matrix.f : 0;

		const originalY = this.draggedStaveLineData.originalY;
		const finalCalculatedY = originalY + finalTransformY; // This is the new effective Y position in SVG coords

		console.log(`Stave line dragged. Original SVG Y: ${originalY}, Final SVG Y: ${finalCalculatedY}`);

		// In a full editor, you would:
		// 1. Convert finalCalculatedY back to a 'pitch' value if desired.
		// 2. Update the underlying musical notation model (e.g., the 'abctune' object).
		// 3. Trigger a re-render of the entire ABC notation with the updated model.
		// For this exercise, we just log the change and clear the dragging state.

		this.draggedStaveLineData = null; // Clear dragged element data
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
		const lineElement = this.paper
			.path({ path: pathString, stroke: "none", fill: fill });

		// Store line element and attach event listener for dragging
		this.staveLineElements.push({ element: lineElement, originalY: y, currentTransformY: 0 });
		lineElement.addEventListener('mousedown', (e) => this.handleStaveLineMouseDown(e, lineElement, y));

		return lineElement;
	}

	printStem(x: number, dx: number, y1: number, y2: number): SVGPathElement {
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
			.path({ path: pathString, stroke: "none", fill: fill });
		//line .toBack();
	}
	// 打印文本
	printText(x: number, offset: number, text: string, anchor?: string): SVGTextElement {
		anchor = anchor || "start";
		return this.paper
			.text(x, this.calcY(offset), text, { "text-anchor": anchor, "font-size": 12 });
	}
	// 打印符号
	printSymbol(
		x: number,
		offset: number,
		symbol: string,
		start?: number,
		end?: number
	): SVGPathElement | SVGPathElement[] | null {
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





	drawArc(x1: number, x2: number, pitch1: number, pitch2: number, above: boolean): SVGPathElement {
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


		return this.paper.path({ path: pathString, stroke: "none", fill: "#0" });
		//line .toBack();
	}
	// 调试信息
	debugMsg(x: number, msg: string): SVGTextElement {
		return this.paper.text(x, this.y, msg, { "text-anchor": "start", "font-size": 12 });
	}

	debugMsgLow(x: number, msg: string): SVGTextElement {
		return this.paper.text(x, this.y + 80, msg, { "font-family": "serif", "font-size": 12 });
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
		if (abctune.formatting.stretchlast) { this.paper.text(200, this.y, "Format: stretchlast", { "text-anchor": "start", "font-size": 12 }); this.y += 20; }
		if (abctune.formatting.staffwidth) {
			this.width = abctune.formatting.staffwidth;
		} else {
			this.width = 700;
		}
		this.width += AbcSpacing.MARGINLEFT; // margin
		if (abctune.formatting.scale) { this.paper.text(200, this.y, "Format: scale=" + abctune.formatting.scale, { "text-anchor": "start", "font-size": 12 }); this.y += 20; }
		this.paper.text(this.width / 2, this.y, abctune.metaText.title || "", { "text-anchor": "middle", "font-size": 20, "font-family": "serif" });
		this.y += 20;
		if (abctune.lines[0] && abctune.lines[0].subtitle) { // Use ABCLine
			this.printSubtitleLine(abctune.lines[0]);
			this.y += 20;
		}
		if (abctune.metaText.rhythm) {
			this.paper.text(AbcSpacing.MARGINLEFT, this.y, abctune.metaText.rhythm, { "text-anchor": "start", "font-style": "italic", "font-family": "serif", "font-size": 12 });
			// Access composer safely with optional chaining
			!(abctune.metaText.author || abctune.metaText.origin || abctune.metaText.composer) && (this.y += 15);
		}
		if (abctune.metaText.author) { this.paper.text(this.width, this.y, abctune.metaText.author, { "text-anchor": "end", "font-style": "italic", "font-family": "serif", "font-size": 12 }); this.y += 15; }
		if (abctune.metaText.origin) { this.paper.text(this.width, this.y, "(" + abctune.metaText.origin + ")", { "text-anchor": "end", "font-style": "italic", "font-family": "serif", "font-size": 12 }); this.y += 15; }
		// Ensure composer is optional
		if (abctune.metaText.composer) { this.paper.text(this.width, this.y, abctune.metaText.composer, { "text-anchor": "end", "font-style": "italic", "font-family": "serif", "font-size": 12 }); this.y += 15; }
		if (abctune.metaText.tempo) {
			let x = 50;
			if (abctune.metaText.tempo.preString) {
				const text = this.paper.text(x, this.y + 20, abctune.metaText.tempo.preString, { "text-anchor": "start", "font-size": 12 });
				x += text.getBBox().width + 10;
			}

			if (abctune.metaText.tempo.duration) {
				const temposcale = 0.75;
				const tempopitch = 14.5;
				// Ensure duration is treated as a number. Safely parse string to float.
				const duration = parseFloat(abctune.metaText.tempo.duration[0] || '0');
				// This object needs to conform to ABCAbsoluteElement's abcelem property structure
				// Create a simple object that satisfies the ABCAbsoluteElement.abcelem structure
				const tempoAbcElem = { el_type: "tempo", duration: duration, startChar: -1, endChar: -1 };

				// ABCAbsoluteElement is a class, create an instance.
				const abselem = new ABCAbsoluteElement(tempoAbcElem, duration, 1); // Pass minspacing as 1

				const durlog = Math.floor(Math.log(duration) / Math.log(2));
				let dot = 0;
				for (let tot = Math.pow(2, durlog), inc = tot / 2; tot < duration; dot++, tot += inc, inc /= 2);
				const c = this.layouter.chartable["note"][- durlog];
				const flag = this.layouter.chartable["uflags"][-durlog];

				const temponote = this.layouter.printNoteHead(abselem, c, { verticalPos: tempopitch }, "up", 0, 0, flag, dot, 0, temposcale);

				// Ensure temponote has dx and w properties (ABCRelativeElement properties)
				if (temponote) {
					abselem.addHead(temponote);

					if (duration < 1) {
						const p1 = tempopitch + 1 / 3 * temposcale;
						const p2 = tempopitch + 7 * temposcale;
						const dx = (temponote.dx ?? 0) + (temponote.w ?? 0); // Use 0 if undefined
						const width = -0.6;
						// ABCRelativeElement is a class, create an instance.
						abselem.addExtra(new ABCRelativeElement(null, dx, 0, p1, { "type": "stem", "pitch2": p2, linewidth: width })); // Pass c as null
					}
				}

				abselem.x = x;
				abselem.draw(this); // ABCAbsoluteElement's draw method only takes printer
				x += (abselem.w ?? 0) + 5; // Use 0 if undefined

				const text = this.paper.text(x, this.y + 20, `= ${abctune.metaText.tempo.bpm}`, { "text-anchor": "start", "font-size": 12 });
				x += text.getBBox().width + 10;
			}

			if (abctune.metaText.tempo.postString) {
				this.paper.text(x, this.y + 20, abctune.metaText.tempo.postString, { "text-anchor": "start", "font-size": 12 });
			}

			this.y += 15;
		}
		this.staffgroups = [];

		let maxwidth = this.width;
		for (let line = 0; line < abctune.lines.length; line++) { // Use ABCLine
			const abcline = abctune.lines[line]; // Type is ABCLine
			if (abcline.staff) {
				const staffgroup: ABCStaffGroupElement = this.layouter.printABCLine(abcline.staff, this.y); // Explicitly typed
				let newspace = this.space;
				for (let it = 0; it < 3; it++) {
					staffgroup.layout(newspace, this); // No need for 'as any'
					if (line > 0 && line === abctune.lines.length - 1 && staffgroup.w / this.width < .6) {
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
				staffgroup.draw(this); // No need for 'as any'
				if (staffgroup.w > maxwidth) maxwidth = staffgroup.w;
				this.staffgroups.push(staffgroup); // Use push instead of direct assignment
				this.y = this.layouter.y;
				this.y += AbcSpacing.STAVEHEIGHT;
			} else if (abcline.subtitle && line !== 0) {
				this.printSubtitleLine(abcline);
				this.y += 20; //hardcoded
			} else if (abcline.text) {
				this.paper.text(100, this.y, "TEXT: " + abcline.text, { "text-anchor": "start", "font-size": 12 });
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
		let text2: SVGTextElement | undefined; // Make it potentially undefined
		if (extraText.length > 0) {
			text2 = this.paper.text(AbcSpacing.MARGINLEFT, this.y + 25, extraText.join("\n"), { "text-anchor": "start", "font-family": "serif", "font-size": 13 });
		}
		let height = 0; // Initialize height
		if (text2) {
			height = text2.getBBox().height;
			// For now, retaining original logic, adjusting 'y' attribute directly
			text2.setAttribute("y", (parseFloat(text2.getAttribute("y") || "0") + height / 2).toString());
		}

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
	printSubtitleLine(abcline: ABCLine): void { // Use ABCLine

		this.paper.text(this.width / 2, this.y, abcline.subtitle || "", { "text-anchor": "middle", "font-size": 16 });
	}
}

