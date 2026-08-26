
const svgNS = "http://www.w3.org/2000/svg";
const xlinkNS = "http://www.w3.org/1999/xlink";

// 擴充 SVGElement 原型方法
declare global {
	interface SVGElement {
		toBack<T extends SVGElement>(this: T): T;
		translate<T extends SVGElement>(this: T, x: number, y: number): T;
		attr<T extends SVGElement>(this: T, attr: Record<string, any>): T;
		scale<T extends SVGElement>(this: T, scaleX: number, scaleY: number, x: number, y: number): T;
		mouseup<T extends SVGElement>(this: T, fn: () => void): T;
	}
	interface Array<T> {
		toBack<U extends SVGElement>(this: U[]): U[];
		attr<U extends SVGElement>(this: U[], attr: Record<string, any>): U[];
		scale<U extends SVGElement>(this: U[], scaleX: number, scaleY: number, x: number, y: number): U[];
	}
}

Object.defineProperty(SVGElement.prototype, "toBack", {
	value<T extends SVGElement>(this: T) {
		if (this.parentNode) {
			this.parentNode.insertBefore(this, this.parentNode.firstChild);
		}
		return this;
	},
	writable: true,
	configurable: true
});

Object.defineProperty(Array.prototype, "toBack", {
	value<T extends SVGElement>(this: T[]) {
		return this.map(el => el.toBack());
	},
	writable: true,
	configurable: true
});

Object.defineProperty(SVGElement.prototype, "translate", {
	value(x: number, y: number) {
		const currentX = Number(this.getAttribute("x") || 0);
		const currentY = Number(this.getAttribute("y") || 0);
		const dx = currentX + x;
		const dy = currentY + y;

		if (dx) this.setAttribute("x", dx.toString());
		if (dy) this.setAttribute("y", dy.toString());
		return this;
	}
});

Object.defineProperty(SVGElement.prototype, "attr", {
	value<T extends SVGElement>(this: T, attr: SVGAttributes<T>) {
		for (const [key, value] of Object.entries(attr)) {
			if (value === undefined) continue;

			if (key === 'path') {
				const pathValue = Array.isArray(value)
					? value.join(' ').replace(/,/g, ' ')
					: String(value).replace(/,/g, ' ');
				this.setAttribute('d', pathValue);
			} else if (key === 'klass') {
				this.setAttribute('class', String(value));
			} else {
				this.setAttribute(key, String(value));
			}
		}
		return this;
	},
	writable: true,
	configurable: true
});

Object.defineProperty(SVGElement.prototype, "scale", {
	value(scaleX: number, scaleY: number, x: number, y: number) {
		this.setAttribute(
			"transform",
			`translate(${-(scaleX - 1) * x},${-(scaleY - 1) * y}) scale(${scaleX},${scaleY})`
		);
		return this;
	}
});

Object.defineProperty(SVGElement.prototype, "mouseup", {
	value(fn: () => void) {
		this.addEventListener('mouseup', fn);
		return this;
	}
});

Object.defineProperty(Array.prototype, "attr", {
	value<T extends SVGElement>(this: T[], attr: Record<string, any>) {
		return this.map(el => el.attr(attr));
	},
	writable: true,
	configurable: true
});

Object.defineProperty(Array.prototype, "scale", {
	value<T extends SVGElement>(this: T[], scaleX: number, scaleY: number, x: number, y: number) {
		return this.map(el => el.scale(scaleX, scaleY, x, y));
	},
	writable: true,
	configurable: true
});


export class Svg {
	private static sizeCache: Record<string, Size> = {};

	svg: SVGSVGElement;
	parentElement: HTMLElement | null;
	dummySvg: SVGElement | null = null;
	currentGroup: SVGGElement[];

	constructor(wrapper: HTMLElement) {
		this.svg = createSvg();
		this.currentGroup = [];
		wrapper.appendChild(this.svg);
		this.parentElement = wrapper.parentElement;
	}

	clear(): void {
		if (this.svg) {
			const wrapper = this.svg.parentNode as HTMLElement;
			this.svg = createSvg();
			this.currentGroup = [];
			if (wrapper) {
				// TODO-PER: If the wrapper is not present, then the underlying div was pulled out from under this instance. It's possible that is still useful (for creating the music off page?)
				wrapper.innerHTML = "";
				wrapper.appendChild(this.svg);
			}
		}
	}

	setTitle(title: string): void {
		const titleEl = document.createElement("title");
		titleEl.textContent = title;
		this.svg.insertBefore(titleEl, this.svg.firstChild);
	}

	setResponsiveWidth(w: number, h: number): void {
		this.svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
		this.svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
		this.svg.removeAttribute("height");
		this.svg.removeAttribute("width");

		Object.assign(this.svg.style, {
			display: "inline-block",
			position: "absolute",
			top: "0",
			left: "0"
		});

		if (this.svg.parentNode) {
			const parentElement = this.svg.parentNode as HTMLElement;
			const cls = parentElement.getAttribute("class");

			if (!cls) {
				parentElement.setAttribute("class", "abcjs-container");
			} else if (!cls.includes("abcjs-container")) {
				parentElement.setAttribute("class", `${cls} abcjs-container`);
			}

			const padding = (h / w) * 100;
			Object.assign(parentElement.style, {
				display: "inline-block",
				position: "relative",
				width: "100%",
				paddingBottom: `${padding}%`,
				verticalAlign: "middle",
				overflow: "hidden"
			});
		}
	}

	setSize(w: number, h: number): void {
		this.svg.setAttribute('width', w.toString());
		this.svg.setAttribute('height', h.toString());
	}

	setAttribute(attr: string, value: string): void {
		this.svg.setAttribute(attr, value);
	}

	setScale(scale: number): void {
		// 🎯 將 style 轉為 any 型別，解鎖(舊時代)所有字串索引
		const style = this.svg.style as any;
		if (scale !== 1) {
			style.transform = `scale(${scale},${scale})`;
			style['-ms-transform'] = `scale(${scale},${scale})`;
			style['-webkit-transform'] = `scale(${scale},${scale})`;
			style['transform-origin'] = "0 0";
			style['-ms-transform-origin-x'] = "0";
			style['-ms-transform-origin-y'] = "0";
			style['-webkit-transform-origin-x'] = "0";
			style['-webkit-transform-origin-y'] = "0";
		} else {
			style.transform = "";
			style['-ms-transform'] = "";
			style['-webkit-transform'] = "";
		}
	};

	insertStyles(styles: string): void {
		const el = document.createElementNS(svgNS, "style");
		el.textContent = styles;
		this.svg.insertBefore(el, this.svg.firstChild);
	}

	setParentStyles(attr: Record<string, string>): void {
		if (this.svg?.parentNode && this.parentElement) {
			for (const [key, value] of Object.entries(attr)) {
				(this.parentElement.style as any)[key] = value;
			}
		}

		if (this.dummySvg) {
			const body = document.querySelector('body');
			body?.removeChild(this.dummySvg);
			this.dummySvg = null;
		}
	}

	rect(attr: { x: number; y: number; width: number; height: number;[key: string]: any }): SVGPathElement {
		const { x, y, width, height, ...rest } = attr;
		const x1 = x;
		const y1 = y;
		const x2 = x + width;
		const y2 = y + height;

		const lines = [
			constructHLine(x1, y1, x2),
			constructHLine(x1, y2, x2),
			constructVLine(x2, y1, y2),
			constructVLine(x1, y2, y1)
		];

		return this.path({
			path: lines.join(" "),
			stroke: "none",
			...rest
		});
	}

	dottedLine(attr: { x1: number; y1: number; x2: number; y2: number; stroke: string }): void {
		const el = document.createElementNS(svgNS, 'line') as SVGLineElement;
		el.setAttribute("x1", attr.x1.toString());
		el.setAttribute("x2", attr.x2.toString());
		el.setAttribute("y1", attr.y1.toString());
		el.setAttribute("y2", attr.y2.toString());
		el.setAttribute("stroke", attr.stroke);
		el.setAttribute("stroke-dasharray", "5,5");
		this.svg.insertBefore(el, this.svg.firstChild);
	}

	rectBeneath(attr: Record<string, any>): void {
		const el = document.createElementNS(svgNS, 'rect') as SVGRectElement;
		for (const [key, value] of Object.entries(attr)) {
			if (value !== undefined) {
				el.setAttribute(key, String(value));
			}
		}
		this.svg.insertBefore(el, this.svg.firstChild);
	}

	text(x: number, y: number, text: string = "", attr?: Record<string, any>, target?: SVGElement): SVGTextElement {
		const el = document.createElementNS(svgNS, 'text') as SVGTextElement;
		el.setAttribute("stroke", "none");

		const mergedAttr = { ...(attr || {}), x, y };
		for (const [key, value] of Object.entries(mergedAttr)) {
			el.setAttribute(key, String(value));
		}

		const lines = text.split("\n");
		lines.forEach((lineText, i) => {
			const line = document.createElementNS(svgNS, 'tspan') as SVGTSpanElement;
			line.setAttribute("x", mergedAttr.x !== undefined ? String(mergedAttr.x) : "0");

			if (i !== 0) {
				line.setAttribute("dy", "1.2em");
			}

			if (lineText.includes("\x03")) {
				const parts = lineText.split('\x03');
				line.textContent = parts[0];

				if (parts[1]) {
					const ts2 = document.createElementNS(svgNS, 'tspan') as SVGTSpanElement;
					ts2.setAttribute("dy", "-0.3em");
					ts2.setAttribute("style", "font-size:0.7em");
					ts2.textContent = parts[1];
					line.appendChild(ts2);
				}

				if (parts[2]) {
					const dist = parts[1] ? "0.4em" : "0.1em";
					const ts3 = document.createElementNS(svgNS, 'tspan') as SVGTSpanElement;
					ts3.setAttribute("dy", dist);
					ts3.setAttribute("style", "font-size:0.7em");
					ts3.textContent = parts[2];
					line.appendChild(ts3);
				}
			} else {
				line.textContent = lineText;
			}
			el.appendChild(line);
		});

		if (target) {
			target.appendChild(el);
		} else {
			this.append(el);
		}

		return el;
	}

	guessWidth(text: string, attr: Record<string, any>): Size {
		const dummy = this.createDummySvg();
		const el = this.text(attr?.x || 0, attr?.y || 0, text, attr, dummy);
		let size: Size;

		try {
			const bbox = el.getBBox();
			const fontSize = Number(attr?.['font-size']) || 12;
			if (isNaN(bbox.height) || !bbox.height) {
				size = { width: fontSize / 2, height: fontSize + 2 };
			} else {
				size = { width: bbox.width, height: bbox.height };
			}
		} catch {
			const fontSize = Number(attr?.['font-size']) || 12;
			size = { width: fontSize / 2, height: fontSize + 2 };
		}

		dummy.removeChild(el);
		return size;
	}

	createDummySvg(): SVGElement {
		if (!this.dummySvg) {
			this.dummySvg = createSvg();
			const styles = [
				"display: block !important;",
				"height: 1px;",
				"width: 1px;",
				"position: absolute;"
			];
			this.dummySvg.setAttribute('style', styles.join(""));
			document.body.appendChild(this.dummySvg);
		}
		return this.dummySvg;
	}

	getTextSize(text: string | number, attr: Record<string, any>, el?: SVGTextElement): Size {
		const textStr = String(text);
		if (!textStr || /^\s+$/.test(textStr)) {
			return { width: 0, height: 0 };
		}

		let key: string | undefined;
		if (textStr.length < 20) {
			key = textStr + JSON.stringify(attr);
			if (Svg.sizeCache[key]) {
				return Svg.sizeCache[key];
			}
		}

		const removeLater = !el;
		const targetEl = el || this.text(attr.x, attr.y, textStr, attr);
		let size: Size;

		try {
			const bbox = targetEl.getBBox();
			if (isNaN(bbox.height) || !bbox.height) {
				size = this.guessWidth(textStr, attr);
			} else {
				size = { width: bbox.width, height: bbox.height };
			}
		} catch {
			size = this.guessWidth(textStr, attr);
		}

		if (removeLater) {
			if (this.currentGroup.length > 0) {
				this.currentGroup[0].removeChild(targetEl);
			} else {
				this.svg.removeChild(targetEl);
			}
		}

		if (key) {
			Svg.sizeCache[key] = size;
		}
		return size;
	}

	openGroup(options: { klass?: string; fill?: string; stroke?: string; 'data-name'?: string; prepend?: boolean } = {}): SVGGElement {
		const el = document.createElementNS(svgNS, "g") as SVGGElement;

		if (options.klass) el.setAttribute("class", options.klass);
		if (options.fill) el.setAttribute("fill", options.fill);
		if (options.stroke) el.setAttribute("stroke", options.stroke);
		if (options['data-name']) el.setAttribute("data-name", options['data-name']);

		if (options.prepend) {
			this.prepend(el);
		} else {
			this.append(el);
		}

		this.currentGroup.unshift(el);
		return el;
	}

	closeGroup(): SVGElement | null {
		const g = this.currentGroup.shift();
		if (g && g.children.length === 0 && g.parentElement) {
			g.parentElement.removeChild(g);
			return null;
		}
		return g || null;
	}

	path(attr?: Record<string, any>): SVGPathElement {
		const el = document.createElementNS(svgNS, "path") as SVGPathElement;
		if (attr) {
			for (const [key, value] of Object.entries(attr)) {
				if (value === undefined) continue;

				if (key === 'path') {
					const pathValue = Array.isArray(value)
						? value.join(' ').replace(/,/g, " ")
						: String(value).replace(/,/g, " ");
					el.setAttribute('d', pathValue);
				} else if (key === 'klass') {
					el.setAttribute("class", String(value));
				} else {
					el.setAttribute(key, String(value));
				}
			}
		}
		this.append(el);
		return el;
	}

	circle(cx: number, cy: number, r: number): SVGElement {
		const el = document.createElementNS(svgNS, 'circle');
		el.setAttribute("cx", cx.toString());
		el.setAttribute("cy", cy.toString());
		el.setAttribute("r", r.toString());
		el.setAttribute("fill", "#000000");
		el.setAttribute("stroke", "none");
		this.append(el);
		return el;
	}

	pathToBack(attr: Record<string, any>): SVGPathElement {
		const el = document.createElementNS(svgNS, "path") as SVGPathElement;
		for (const [key, value] of Object.entries(attr)) {
			if (value === undefined) continue;
			if (key === 'path') {
				el.setAttribute('d', String(value));
			} else if (key === 'klass') {
				el.setAttribute("class", String(value));
			} else {
				el.setAttribute(key, String(value));
			}
		}
		this.prepend(el);
		return el;
	}

	lineToBack(attr: Record<string, string | number>): SVGLineElement {
		const el = document.createElementNS(svgNS, 'line') as SVGLineElement;
		for (const [key, value] of Object.entries(attr)) {
			el.setAttribute(key, String(value));
		}
		this.prepend(el);
		return el;
	}

	append(el: SVGElement): void {
		if (this.currentGroup.length > 0) {
			this.currentGroup[0].appendChild(el);
		} else {
			this.svg.appendChild(el);
		}
	}

	prepend(el: SVGElement): void {
		if (this.currentGroup.length > 0) {
			this.currentGroup[0].appendChild(el);
		} else {
			this.svg.insertBefore(el, this.svg.firstChild);
		}
	}

	setAttributeOnElement(el: SVGElement, attr: Record<string, string | number>): void {
		for (const [key, value] of Object.entries(attr)) {
			el.setAttribute(key, String(value));
		}
	}

	moveElementToChild(parent: SVGElement, child: SVGElement): void {
		parent.appendChild(child);
	}
}

function constructHLine(x1: number, y1: number, x2: number): string {
	const len = x2 - x1;
	return `M ${x1} ${y1} l ${len} 0 l 0 1 l ${-len} 0 z`;
}

function constructVLine(x1: number, y1: number, y2: number): string {
	const len = y2 - y1;
	return `M ${x1} ${y1} l 0 ${len} l 1 0 l 0 ${-len} z`;
}

function createSvg(): SVGSVGElement {
	const svg = document.createElementNS(svgNS, "svg");
	svg.setAttribute("xmlns:xlink", xlinkNS);
	svg.setAttribute('role', 'img');
	svg.setAttribute('fill', 'currentColor');
	svg.setAttribute('stroke', 'currentColor');
	return svg;
}