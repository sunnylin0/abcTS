//    abc_voice_element.js: Definition of the VoiceElement class.

/*global module */

const svgNS = "http://www.w3.org/2000/svg";

Object.defineProperty(SVGElement.prototype, "translate", {
	value(x: number, y: number) {
		const dx = this.getAttribute("x")?.toNumber() + x
		const dy = this.getAttribute("y")?.toNumber() + y
		if (!dx) this.setAttribute("x", dx.toString());
		if (!dy) this.setAttribute("y", dy.toString());
		return this;
	}
});

Object.defineProperty(SVGElement.prototype, "attr", {
	value<T extends SVGElement>(this: T, attr: SVGAttributes<T>) {
		const el = this;
		for (const key in attr) {
			if (Object.prototype.hasOwnProperty.call(attr, key)) {
				const value = attr[key];
				if (value === undefined) continue;

				if (key === 'path') {
					const pathValue = Array.isArray(value)
						? value.join().replace(/,/g, ' ')
						: String(value).replace(/,/g, ' ');
					el.setAttributeNS(null, 'd', pathValue);
				}
				else if (key === 'klass') {
					el.setAttributeNS(null, 'class', String(value));
				}
				else {
					el.setAttributeNS(null, key, String(value));
				}
			}
		}
		return el;
	},
	writable: true,
	configurable: true
});

Object.defineProperty(SVGElement.prototype, "scale", {
	value(scalex: number, scaley: number, x: number, y: number) {
		this.setAttribute("transform",
			`translate(${-(scalex - 1) * x},${-(scaley - 1) * y}) scale(${scalex},${scaley}) `)
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
	value<T extends SVGElement>(this: T[], attr: SVGAttributes<T>) {
		return this.map(el => el.attr(attr));
	},
	writable: true,
	configurable: true
});

Object.defineProperty(Array.prototype, "scale", {
	value<T extends SVGElement>(this: T[], scalex: number, scaley: number, x: number, y: number) {
		return this.map(el => el.scale(scalex, scaley, x, y));
	},
	writable: true,
	configurable: true
});





export class Svg {
	// 🎯 1. 宣告為類別的靜態私有屬性，只有內部能存取，外部看不到
	private static sizeCache: Record<string, any> = {};

	svg?: SVGSVGElement;
	parentElement?: HTMLElement;	//父容器
	dummySvg?: SVGElement; //臨時 SVG
	currentGroup?: SVGGElement[];
	constructor(wrapper: HTMLElement) {
		this.svg = createSvg() as SVGSVGElement;
		this.currentGroup = [];
		wrapper.appendChild(this.svg);
		this.parentElement = wrapper.parentElement;
	}

	clear() {
		if (this.svg) {
			const wrapper: HTMLElement = this.svg.parentNode as HTMLElement;
			this.svg = createSvg() as SVGSVGElement;
			this.currentGroup = [];
			if (wrapper) {
				// TODO-PER: If the wrapper is not present, then the underlying div was pulled out from under this instance. It's possible that is still useful (for creating the music off page?)
				wrapper.innerHTML = "";
				wrapper.appendChild(this.svg);
			}
		}
	};

	setTitle(title: string) {
		const titleEl: HTMLTitleElement = document.createElement("title");
		const titleNode: Text = document.createTextNode(title);
		titleEl.appendChild(titleNode);
		this.svg.insertBefore(titleEl, this.svg.firstChild);
	};

	setResponsiveWidth(w: number, h: number) {
		// this technique is from: http://thenewcode.com/744/Make-SVG-Responsive, thx to https://github.com/iantresman
		this.svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
		this.svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
		this.svg.removeAttribute("height");
		this.svg.removeAttribute("width");
		this.svg.style.display = "inline-block";
		this.svg.style.position = "absolute";
		this.svg.style.top = "0";
		this.svg.style.left = "0";

		if (this.svg.parentNode) {
			const parentElement: HTMLElement = this.svg.parentNode as HTMLElement;
			var cls = parentElement.getAttribute("class");
			if (!cls)
				parentElement.setAttribute("class", "abcjs-container");
			else if (cls.indexOf("abcjs-container") < 0)
				parentElement.setAttribute("class", `${cls} abcjs-container`);
			parentElement.style.display = "inline-block";
			parentElement.style.position = "relative";
			parentElement.style.width = "100%";
			// PER: I changed the padding from 100% to this through trial and error.
			// The example was using a square image, but this music might be either wider or taller.
			const padding = (h / w) * 100;
			parentElement.style.paddingBottom = `${padding}%`;
			parentElement.style.verticalAlign = "middle";
			parentElement.style.overflow = "hidden";
		}
	};

	setSize(w: number, h: number) {
		this.svg.setAttribute('width', w.toString());
		this.svg.setAttribute('height', h.toString());
	};

	setAttribute(attr: string, value: string) {
		this.svg.setAttribute(attr, value);
	};

	setScale(scale: number) {
		// 🎯 將 style 轉為 any 型別，解鎖所有字串索引
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

	insertStyles(styles: string) {
		const el: SVGStyleElement = document.createElementNS(svgNS, "style");
		el.textContent = styles;
		this.svg.insertBefore(el, this.svg.firstChild); // prepend is not available on older browsers.
		//	this.svg.prepend(el);
	};

	setParentStyles(attr: { [key: string]: string }) {
		// This is needed to get the size right when there is scaling involved.
		if (this.svg?.parentNode) {
			for (const key in attr) {
				if (attr.hasOwnProperty(key)) {
					this.parentElement.style[key] = attr[key];
				}
			}
		}
		// This is the last thing that gets called, so delete the temporary SVG if one was created
		//臨時 SVG，請將其刪除
		if (this.dummySvg) {
			const body: HTMLBodyElement = document.querySelector('body');
			body.removeChild(this.dummySvg);
			this.dummySvg = null;
		}

	};


	rect(attr: { [key: string]: string }) {
		// This uses path instead of rect so that it can be hollow and the color changes with "fill" instead of "stroke".
		let lines = [];
		const x1 = Number(attr.x);
		const y1 = Number(attr.y);
		const x2 = Number(attr.x + attr.width);
		const y2 = Number(attr.y + attr.height);
		lines.push(constructHLine(x1, y1, x2));
		lines.push(constructHLine(x1, y2, x2));
		lines.push(constructVLine(x2, y1, y2));
		lines.push(constructVLine(x1, y2, y1));

		return this.path({ path: lines.join(" "), stroke: "none", "data-name": attr["data-name"] });
	};

	dottedLine(attr: { x1: number; y1: number; x2: number; y2: number; stroke: string; }) {
		let el: SVGLineElement = document.createElementNS(svgNS, 'line');
		el.setAttribute("x1", attr.x1.toString());
		el.setAttribute("x2", attr.x2.toString());
		el.setAttribute("y1", attr.y1.toString());
		el.setAttribute("y2", attr.y2.toString());
		el.setAttribute("stroke", attr.stroke);
		el.setAttribute("stroke-dasharray", "5,5");
		this.svg.insertBefore(el, this.svg.firstChild);
	};

	rectBeneath(attr: { [key: string]: string }) {
		let el: SVGRectElement = document.createElementNS(svgNS, 'rect');
		el.setAttribute("x", attr.x.toString());
		el.setAttribute("width", attr.width.toString());
		el.setAttribute("y", attr.y.toString());
		el.setAttribute("height", attr.height.toString());
		if (attr.stroke)
			el.setAttribute("stroke", attr.stroke);
		if (attr['stroke-opacity'])
			el.setAttribute("stroke-opacity", attr['stroke-opacity']);
		if (attr.fill)
			el.setAttribute("fill", attr.fill);
		if (attr['fill-opacity'])
			el.setAttribute("fill-opacity", attr['fill-opacity']);
		this.svg.insertBefore(el, this.svg.firstChild);
	};

	text(x: number, y: number, text: string = "", attr?: any, target?: SVGElement): SVGTextElement {
		let el: SVGTextElement = document.createElementNS(svgNS, 'text') as SVGTextElement;
		el.setAttribute("stroke", "none");
		if (!attr)
			attr = {};
		if (typeof attr === 'object') {
			attr.x = x;
			attr.y = y;
		}
		for (const key in attr) {
			if (attr.hasOwnProperty(key)) {
				el.setAttribute(key, attr[key].toString());
			}
		}
		let lines: string[] = ("" + text).split("\n");
		for (let i = 0; i < lines.length; i++) {
			let line: SVGTSpanElement = document.createElementNS(svgNS, 'tspan');
			line.setAttribute("x", attr.x ? attr.x : "0");
			if (i !== 0)
				line.setAttribute("dy", "1.2em");
			if (lines[i].indexOf("\x03") !== -1) {
				let parts: string[] = lines[i].split('\x03')
				line.textContent = parts[0];
				if (parts[1]) {
					let ts2: SVGTSpanElement = document.createElementNS(svgNS, 'tspan');
					ts2.setAttribute("dy", "-0.3em");
					ts2.setAttribute("style", "font-size:0.7em");
					ts2.textContent = parts[1];
					line.appendChild(ts2);
				}
				if (parts[2]) {
					var dist: string = parts[1] ? "0.4em" : "0.1em";
					var ts3: SVGTSpanElement = document.createElementNS(svgNS, 'tspan');
					ts3.setAttribute("dy", dist);
					ts3.setAttribute("style", "font-size:0.7em");
					ts3.textContent = parts[2];
					line.appendChild(ts3);
				}
			} else
				line.textContent = lines[i];
			el.appendChild(line);
		}
		if (target)
			target.appendChild(el);
		else
			this.append(el);
		return el;
	};

	guessWidth(text: string, attr: any): Size {
		let svg = this.createDummySvg();
		let el: SVGTextElement = this.text(attr?.x, attr?.y, text, attr, svg);
		var size: { width: number; height: number }
		try {
			size = el.getBBox();
			if (isNaN(size.height) || !size.height) // TODO-PER: I don't think this can happen unless there isn't a browser at all.
				size = { width: attr['font-size'].toNumber() / 2, height: attr['font-size'].toNumber() + 2 }; // Just a wild guess.
			else
				size = { width: size.width, height: size.height };
		} catch (ex) {
			size = { width: attr['font-size'].toNumber() / 2, height: attr['font-size'].toNumber() + 2 }; // Just a wild guess.
		}
		svg.removeChild(el);
		return size;
	};

	createDummySvg(): SVGElement {
		if (!this.dummySvg) {
			this.dummySvg = createSvg();
			let styles = [
				"display: block !important;",
				"height: 1px;",
				"width: 1px;",
				"position: absolute;"
			];
			this.dummySvg.setAttribute('style', styles.join(""));
			let body: HTMLBodyElement = document.querySelector('body');
			body.appendChild(this.dummySvg);
		}

		return this.dummySvg;
	};


	getTextSize(text: string | number, attr: any, el?: SVGTextElement): Size {

		if (typeof text === 'number')
			text = '' + text;
		if (!text || text.match(/^\s+$/))
			return { width: 0, height: 0 };
		let key;
		if (text.length < 20) {
			// The short text tends to be repetitive and getBBox is really slow, so lets cache.
			key = text + JSON.stringify(attr);
			if (Svg.sizeCache[key])
				return Svg.sizeCache[key];
		}
		let removeLater: boolean = !el;
		if (!el)
			el = this.text(attr.x, attr.y, text, attr);
		let size;
		try {
			size = el.getBBox();
			if (isNaN(size.height) || !size.height)
				size = this.guessWidth(text, attr);
			else
				size = { width: size.width, height: size.height };
		} catch (ex) {
			size = this.guessWidth(text, attr);
		}
		if (removeLater) {
			if (this.currentGroup.length > 0)
				this.currentGroup[0].removeChild(el);
			else
				this.svg.removeChild(el);
		}
		if (key)
			Svg.sizeCache[key] = size;
		return size;
	};

	openGroup(options?: any): SVGGElement {
		options = options ? options : {};
		var el: SVGGElement = document.createElementNS(svgNS, "g") as SVGGElement;
		if (options.klass)
			el.setAttribute("class", options.klass);
		if (options.fill)
			el.setAttribute("fill", options.fill);
		if (options.stroke)
			el.setAttribute("stroke", options.stroke);
		if (options['data-name'])
			el.setAttribute("data-name", options['data-name']);

		if (options.prepend)
			this.prepend(el);
		else
			this.append(el);
		this.currentGroup.unshift(el);
		return el;
	};

	closeGroup(): SVGElement | null {
		var g = this.currentGroup.shift();
		if (g && g.children.length === 0) {
			// If nothing was added to the group it is because all the elements were invisible. We don't need the group, then.
			g.parentElement.removeChild(g);
			return null;
		}
		return g;
	};

	path(attr?: any): SVGPathElement {
		var el: SVGPathElement = document.createElementNS(svgNS, "path") as SVGPathElement;
		for (var key in attr) {
			if (attr.hasOwnProperty(key)) {
				if (key === 'path')
					if (Array.isArray(attr.path))
						el.setAttributeNS(null, 'd', attr.path.join().replace(/,/g, " "));
					else
						el.setAttributeNS(null, 'd', attr.path.replace(/,/g, " "));
				else if (key === 'klass')
					el.setAttributeNS(null, "class", attr[key]);
				else if (attr[key] !== undefined)
					el.setAttributeNS(null, key, attr[key]);
			}
		}
		this.append(el);
		return el;
	};

	pathToBack(attr: any): SVGPathElement {
		var el: SVGPathElement = document.createElementNS(svgNS, "path") as SVGPathElement;
		for (var key in attr) {
			if (attr.hasOwnProperty(key)) {
				if (key === 'path')
					el.setAttributeNS(null, 'd', attr.path);
				else if (key === 'klass')
					el.setAttributeNS(null, "class", attr[key]);
				else
					el.setAttributeNS(null, key, attr[key]);
			}
		}
		this.prepend(el);
		return el;
	};

	lineToBack(attr: { [key: string]: string | number }): SVGLineElement {
		let el: SVGLineElement = document.createElementNS(svgNS, 'line') as SVGLineElement;
		let keys: string[]= Object.keys(attr)
		for (let i = 0; i < keys.length; i++)
			el.setAttribute(keys[i].toString(), attr[keys[i]].toString());
		this.prepend(el);
		return el;
	};


	append(el: SVGElement) {
		if (this.currentGroup.length > 0)
			this.currentGroup[0].appendChild(el);
		else
			this.svg.appendChild(el);
	};

	prepend(el: SVGElement) {
		// The entire group is prepended, so don't prepend the individual elements.
		if (this.currentGroup.length > 0)
			this.currentGroup[0].appendChild(el);
		else
			this.svg.insertBefore(el, this.svg.firstChild);
	};

	setAttributeOnElement(el: SVGElement, attr: { [key: string]: string | number }): void {
		for (var key in attr) {
			if (attr.hasOwnProperty(key)) {
				el.setAttributeNS(null, key, attr[key].toString());
			}
		}
	};

	moveElementToChild(parent: SVGElement, child: SVGElement): void {
		parent.appendChild(child);
	};
}
function constructHLine(x1: number, y1: number, x2: number): string {
	var len = x2 - x1;
	return "M " + x1 + " " + y1 +
		" l " + len + ' ' + 0 +
		" l " + 0 + " " + 1 + " " +
		" l " + (-len) + " " + 0 + " " + " z ";
}

function constructVLine(x1: number, y1: number, y2: number): string {
	let len = y2 - y1;
	return "M " + x1 + " " + y1 +
		" l " + 0 + ' ' + len +
		" l " + 1 + " " + 0 + " " +
		" l " + 0 + " " + (-len) + " " + " z ";
}
function createSvg(): SVGSVGElement {
	let svg: SVGSVGElement = document.createElementNS(svgNS, "svg");
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
	svg.setAttribute('role', 'img');    // for accessibility
	svg.setAttribute('fill', 'currentColor');    // for automatically picking up dark mode and high contrast
	svg.setAttribute('stroke', 'currentColor');    // for automatically picking up dark mode and high contrast
	return svg;
}


//export default Svg;

