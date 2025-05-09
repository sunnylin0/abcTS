// raphael-patched.d.ts
//declare module "raphael-patched" {
//  declare namespace Raphael {
    interface raElement {
      id: number;
      node: any;
      paper: raPaper;
      attrs: any;
      transformations: string[];
      _: {
        tx: number;
        ty: number;
        rt: { deg: number, cx: number, cy: number };
        sx: number;
        sy: number;
      };
      next: raElement | null;
      prev: raElement | null;

      rotate(deg: number | null, cx?: number, cy?: number): raElement;
      hide(): raElement;
      show(): raElement;
      remove(): void;
      getBBox(): any;
      attr(name: string): any;
      attr(name: string, value: any): raElement;
      attr(params: any): raElement;
      toFront(): raElement;
      toBack(): raElement;
      insertAfter(element: raElement): raElement;
      insertBefore(element: raElement): raElement;
      //新加入
      translate(x: number, y: number): raElement;
      scale(x: number, y: number, cx: number, cy: number): raElement;
    }

    interface raPaper {
      canvas: any;
      width: number;
      height: number;
      desc: any;
      defs: any;
      bottom: raElement | null;
      top: raElement | null;
      raphael: typeof Raphael;

      clear(): void;
      remove(): void;
      circle(x: number, y: number, r: number): raElement;
      rect(x: number, y: number, w: number, h: number, r?: number): raElement;
      ellipse(x: number, y: number, rx: number, ry: number): raElement;
      path(pathString: string): raElement;
      image(src: string, x: number, y: number, w: number, h: number): raElement;
      text(x: number, y: number, text: string): raElement;
      set(itemsArray?: any[]): raSet;
      setSize(width: number, height: number): raPaper;
      safari(): void;
      print(x: number, y: string, string: string, font: string, size: number): raSet;
    }
    interface raSet {
      items: raElement[];
      length: number;

      push(...items: raElement[]): raSet;
      pop(): raElement;
      attr(name: string): raElement;
      attr(name: string, value: any): raElement;
      attr(params: any): raElement;
      animate(params: any, ms: number, easing?: string | Function, callback?: Function): raSet;
      insertAfter(el: raElement): void;
      getBBox(): { x: number, y: number, width: number, height: number };
      //  增加
      mouseup(fn:mouseUpFn):void;
    }

    function format(token: string, ...args: any[]): string;
    function ninja(): typeof Raphael;
  //}

  declare var RaphaelVar: {
    version: string;
    type: string;
    svg: boolean;
    vml: boolean;
    _id: number;
    _oid: number;
    fn: any;
    is(o: any, type: string): boolean;
    setWindow(newwin: Window): void;
    hsb2rgb(hue: any, saturation: number, brightness: number): { r: number, g: number, b: number, hex: string };
    rgb2hsb(red: number, green: number, blue: number): { h: number, s: number, b: number };
    getRGB(colour: string): { r: number, g: number, b: number, hex: string, error: number };
    getColor(value?: number): string;
    getColor: {
      start: { h: number, s: number, b: number };
      reset(): void;
    };
    parsePathString(pathString: string): any[];
    path2curve(path: any[], path2?: any[]): any[];
    pathToRelative(pathArray: any[]): any[];
    pathToAbsolute(pathArray: any[]): any[];
    findDotAtSegment(p1x: number, p1y: number, c1x: number, c1y: number, c2x: number, c2y: number, p2x: number, p2y: number, t: number): { x: number, y: number, m: { x: number, y: number }, n: { x: number, y: number }, start: { x: number, y: number }, end: { x: number, y: number } };
    curveDim(p1x: number, p1y: number, c1x: number, c1y: number, c2x: number, c2y: number, p2x: number, p2y: number): { min: { x: number, y: number }, max: { x: number, y: number } };
    parseDots(gradient: string): any[];
    getContainer(...args: any[]): any;
    plugins(con: any, add: any): void;
    tear(el: raElement, paper: raPaper): void;
    tofront(el: raElement, paper: raPaper): void;
    toback(el: raElement, paper: raPaper): void;
    insertafter(el: raElement, el2: raElement, paper: raPaper): void;
    insertbefore(el: raElement, el2: raElement, paper: raPaper): void;
    create(...args: any[]): raPaper;
    registerFont(font: any): any;
    easing_formulas: {
      linear(n: number): number;
      "<"(n: number): number;
      ">"(n: number): number;
      "<>"(n: number): number;
      backIn(n: number): number;
      backOut(n: number): number;
      elastic(n: number): number;
      bounce(n: number): number;
    };
  }
//}