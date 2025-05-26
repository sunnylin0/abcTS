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
// TypeScript declaration merge
//export { }; // Required for module augmentation

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
