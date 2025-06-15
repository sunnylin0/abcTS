

declare interface SVGElement {
	translate(x: number, y: number): SVGElement;
	//attr(attr: any): SVGElement;
	attr<T extends SVGElement>(this: T, attributes: SVGAttributes<T>): T;
	scale<T extends SVGElement>(scalex: number, scaley: number, x: number, y: number): T;
	mouseup(handler: (event: MouseEvent) => void);
}

interface SVGAttributes<T extends SVGElement = SVGElement> {
	[key: string]: any;
	path?: T extends SVGPathElement ? (string | number[]) : never;
	klass?: string;
	fill?: string;
	stroke?: string;
	transform?: string;
}
interface Array<T extends SVGElement> {
	attr<U extends T>(this: U[], attributes: SVGAttributes<U>): U[];
	scale<U extends T>(scalex: number, scaley: number, x: number, y: number): U;
}



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

declare function constructHLine(x1: number, y1: number, x2: number): string;
declare function constructVLine(x1: number, y1: number, y2: number): string;
declare function createSvg(): SVGElement;

