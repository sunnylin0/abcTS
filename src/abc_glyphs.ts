

import glyphs_font from './abc_glyphs_font.json'

interface GlyphsData {
	[key: string]: {
		d: ([command: string, ...params: number[]])[];
		w: number;
		h: number;
	};
}
export class ABCGlyphs {

	private glyphs: GlyphsData;

	constructor() {
		this.glyphs = (glyphs_font as unknown ) as GlyphsData;
	}


	printSymbol(x: number, y: number, symb: string, paper: Svg): SVGPathElement {
		if (!this.glyphs[symb]) return null;
		let pathArray = JSON.parse(JSON.stringify(this.glyphs[symb].d));
		pathArray[0][1] += x;
		pathArray[0][2] += y;
		const path = paper.path().attr({ path: pathArray, stroke: "none", fill: "#000000" });
		return path;
	}

	getPathForSymbol(x: number, y: number, symb: string, scalex?: number, scaley?: number): any[] {
		const sx = scalex || 1;
		const sy = scaley || 1;
		if (!this.glyphs[symb]) return null;
		const pathArray = JSON.parse(JSON.stringify(this.glyphs[symb].d));
		if (sx !== 1 || sy !== 1) {
			this.pathScale(pathArray, sx, sy);
		}
		pathArray[0][1] += x;
		pathArray[0][2] += y;
		return pathArray;
	}

	pathScale(pathArray: any[], kx: number, ky: number): void {
		for (let i = 0, ii = pathArray.length; i < ii; i++) {
			const p = pathArray[i];
			for (let j = 1, jj = p.length; j < jj; j++) {
				p[j] *= (j % 2) ? kx : ky;
			}
		}
	}

	getSymbolWidth(symbol: string): number {
		if (this.glyphs[symbol]) return this.glyphs[symbol].w;
		return 0;
	}

	getSymbolHeight(symbol: string): number {
		if (this.glyphs[symbol]) return this.glyphs[symbol].h;
		return 0;
	}

	getSymbolAlign(symbol: string): string {
		if (symbol.substring(0, 7) === "scripts" &&
			symbol !== "scripts.roll") {
			return "center";
		}
		return "left";
	}
	getYCorr(symbol: string): number {
		switch (symbol) {
			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
			case "+": return -3;
			case "timesig.common":
			case "timesig.cut": return -1;
			case "flags.d32nd": return -1;
			case "flags.d64th": return -2;
			case "flags.u32nd": return 1;
			case "flags.u64th": return 3;
			case "rests.whole": return 1;
			case "rests.half": return -1;
			case "rests.8th": return -1;
			case "rests.quarter": return -2;
			case "rests.16th": return -1;
			case "rests.32nd": return -1;
			case "rests.64th": return -1;
			default: return 0;
		}
	}
}


