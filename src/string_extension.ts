// string-ext.ts
interface NumberConversionOptions {
  strict?: boolean;
  radix?: number;
}

function toNumber(str: string, options?: NumberConversionOptions): number {
  const text = str.trim();

  // Handle special values
  if (text === "Infinity") return Infinity;
  if (text === "-Infinity") return -Infinity;
  if (/^nan$/i.test(text)) return NaN;

  // Handle different number bases
  const hexMatch = text.match(/^[+-]?0x([\da-f]+)$/i);
  if (hexMatch) return parseInt(text, 16);

  const binaryMatch = text.match(/^[+-]?0b([01]+)$/i);
  if (binaryMatch) return parseInt(text, 2);

  const octalMatch = text.match(/^[+-]?0o([0-7]+)$/i);
  if (octalMatch) return parseInt(text, 8);

  // Scientific notation and decimal handling
  const numberPattern = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
  const partialMatch = text.match(/^[+-]?(?:\d*\.?\d+|\.\d+)(?:e[+-]?\d+)?/i);

  if (options?.strict && !numberPattern.test(text)) return NaN;
  if (partialMatch) return parseFloat(partialMatch[0]);

  return NaN;
}

Object.defineProperty(String.prototype, "toNumber", {
  value(this: string, options?: NumberConversionOptions) {
    return toNumber(this.valueOf(), options)
  }
});
Object.defineProperty(SVGElement.prototype, "translate", {
	value(x: number, y: number) {
		const dx = this.getAttribute("x").toNumber() + x
		const dy = this.getAttribute("y").toNumber() + y
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

var abcList = {}
function getAbcElemList(abcelem) {
  let elTypeName;
  if (abcelem.el_type)
    elTypeName = abcelem.constructor.name + "_" + abcelem.el_type;
  else
    if (abcelem.type)
      elTypeName = abcelem.constructor.name + "_other_" + abcelem.type;
    else
      elTypeName = abcelem.constructor.name + "_other";

  if (abcList[elTypeName]) {
    abcList[elTypeName] = { ...abcList[elTypeName], ...Object.clone(abcelem) }
  } else {
    abcList[elTypeName] = { ...Object.clone(abcelem) }
  }
}
