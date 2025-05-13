//declare var svgNS: string;

declare interface Size {
	width: number;
	height: number;
}
type SvgInHtml = HTMLElement & SVGElement;

interface SvgOptions {
	wrapper: HTMLElement;
}

interface RectAttributes {
	x: number;
	y: number;
	width: number;
	height: number;
	stroke?: string;
	'stroke-opacity'?: string;
	fill?: string;
	'fill-opacity'?: string;
	['data-name']?: string;
}

interface TextAttributes {
	x?: number;
	'font-size'?: string;
	// other potential SVG text attributes
	[key: string]: any;
}

interface PathAttributes {
	path: string;
	klass?: string;
	// other potential SVG path attributes
	[key: string]: any;
}

interface GroupOptions {
	klass?: string;
	fill?: string;
	stroke?: string;
	['data-name']?: string;
	prepend?: boolean;
}

//declare class Svg {
//	svg?: SVGElement;
//	currentGroup?: SVGElement[];

//	constructor(wrapper: HTMLElement);

//	clear(): void;

//	setTitle(title: string): void;

//	setResponsiveWidth(w: number, h: number): void;

//	setSize(w: number, h: number): void;

//	setAttribute(attr: string, value: string): void;

//	setScale(scale: number): void;

//	insertStyles(styles: string): void;

//	setParentStyles(attr: { [key: string]: string }): void;

//	rect(attr: RectAttributes): SVGPathElement;

//	dottedLine(attr: { x1: number; y1: number; x2: number; y2: number; stroke: string; }): SVGLineElement;

//	rectBeneath(attr: RectAttributes): SVGRectElement;

//	text(x: number, y: number, text: string, attr?: , target?: SVGElement): SVGTextElement;

//	guessWidth(text: string, attr: TextAttributes): Size;

//	createDummySvg(): SVGElement;

//	getTextSize(text: string | number, attr: TextAttributes, el?: SVGTextElement): Size;

//	openGroup(options?: GroupOptions): SVGGElement;

//	closeGroup(): SVGGElement | null;

//	path(attr: PathAttributes): SVGPathElement;

//	pathToBack(attr: PathAttributes): SVGPathElement;

//	lineToBack(attr: { [key: string]: string | number }): SVGLineElement;

//	append(el: SVGElement): void;

//	prepend(el: SVGElement): void;

//	setAttributeOnElement(el: SVGElement, attr: { [key: string]: string | number }): void;

//	moveElementToChild(parent: SVGElement, child: SVGElement): void;
//}

declare function constructHLine(x1: number, y1: number, x2: number): string;
declare function constructVLine(x1: number, y1: number, y2: number): string;
declare function createSvg(): SVGElement;

