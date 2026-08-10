// test-jianpu-06.js  — Ticket 06 TDD
// Seam A: pitchToJianpu chromatic detection
// Seam B: chromatic accidental glyphs rendering in drawLog
// Seam C: line-header labels 1=Key and Meter in drawLog
// Run: pnpm run build && node test-jianpu-06.js

const fs = require("fs");
const path = require("path");
const vm = require("vm");

let passed = 0, failed = 0;
function assert(label, condition, detail) {
    if (condition) { console.log("  OK  " + label); passed++; }
    else { console.error("  FAIL " + label + (detail ? " [" + detail + "]" : "")); failed++; }
}

function createBrowserContext() {
    class MockElement {
        constructor(tag) { this.tagName = tag; this.attributes = {}; this.childNodes = []; this.children = []; this.style = {}; }
        setAttribute(k, v) { this.attributes[k] = String(v); return this; }
        setAttributeNS(ns, k, v) { this.attributes[k] = String(v); return this; }
        getAttribute(k) { return this.attributes[k]; }
        removeAttribute(k) { delete this.attributes[k]; }
        appendChild(c) { if (c) { c.parentNode = this; this.childNodes.push(c); if (c.tagName) this.children.push(c); } return c; }
        insertBefore(c) { if (c) { c.parentNode = this; this.childNodes.unshift(c); } return c; }
        removeChild(c) { return c; }
        getBBox() { return { x: 0, y: 0, width: 50, height: 15 }; }
        addEventListener() {}
        mouseup() { return this; }
        attr(a) { if (a) for (const k in a) this.setAttribute(k, a[k]); return this; }
        toBack() { return this; }
        clear() { this.childNodes = []; this.children = []; return this; }
    }
    const mockBody = new MockElement("body");
    const sandbox = {
        window: {}, navigator: { userAgent: "node" },
        document: {
            body: mockBody, createElement: (t) => new ME(t),
            createElementNS: (ns, t) => new ME(t),
            getElementsByTagName: (t) => t === "body" ? [mockBody] : [],
            createTextNode: (s) => ({ nodeValue: s||"", textContent: s||"" }),
            querySelector: (sel) => sel === "body" ? mockBody : new ME("div"),
            createEvent: () => ({ initEvent: () => {} }),
            write: () => {}, getElementById: (id) => new ME("div")
        },
        Event: class {}, Element: MockElement, HTMLElement: MockElement,
        SVGElement: MockElement, SVGPathElement: MockElement, SVGTextElement: MockElement,
        SVGRectElement: MockElement, SVGLineElement: MockElement,
        SVGGElement: MockElement, SVGSVGElement: MockElement,
        console, setTimeout, clearTimeout
    };
    const ME = MockElement;
    sandbox["$break"] = { name: "$break" };
    sandbox.window.window = sandbox.window;
    sandbox.window.document = sandbox.document;
    sandbox.window.console = console;
    sandbox.window["$break"] = sandbox["$break"];
    sandbox.window.Element = MockElement;
    sandbox.window.SVGElement = MockElement;
    sandbox.self = sandbox;
    return vm.createContext(sandbox);
}

function createMockPaper() {
    const drawLog = [];
    const dummySvg = {
        tagName: "svg", attributes: {}, childNodes: [], parentNode: null,
        setAttribute: function (k, v) { this.attributes[k] = String(v); return this; },
        setAttributeNS: function (ns, k, v) { this.attributes[k] = String(v); return this; },
        getAttribute(k) { return this.attributes[k]; },
        removeAttribute(k) { delete this.attributes[k]; },
        appendChild(child) { if (child) child.parentNode = this; this.childNodes.push(child); return child; },
        insertBefore(child) { if (child) child.parentNode = this; this.childNodes.unshift(child); return child; },
        removeChild(child) { return child; },
        getBBox: () => ({ x: 0, y: 0, width: 50, height: 15 })
    };
    dummySvg.parentNode = dummySvg;
    const mockElement = {
        attr: function (attributes) {
            if (drawLog.length > 0) drawLog[drawLog.length - 1].attr = JSON.parse(JSON.stringify(attributes));
            return this;
        },
        toBack: function () {
            if (drawLog.length > 0) drawLog[drawLog.length - 1].toBack = true;
            return this;
        },
        translate: function (x, y) { return this; },
        getBBox: () => ({ x: 0, y: 0, width: 50, height: 15 }),
        mouseup: function () { return this; },
        appendChild: () => {},
        setAttribute: function (k, v) { return this; },
        style: {},
        remove: function () { if (drawLog.length > 0) drawLog.pop(); return this; }
    };
    return {
        drawLog, svg: dummySvg, paper: dummySvg, canvas: { parentNode: dummySvg, style: {} }, parentElement: dummySvg,
        clear: function () {}, setPaper: function () { return this; },
        path: (pathVal) => {
            let pathString = pathVal;
            if (pathVal && typeof pathVal === 'object') pathString = pathVal.path || pathVal;
            drawLog.push({ type: 'path', path: pathString });
            return mockElement;
        },
        text: (x, y, textStr, attr) => {
            drawLog.push({ type: 'text', x, y, text: String(textStr), attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
            return mockElement;
        },
        rect: (attr) => {
            drawLog.push({ type: 'rect', attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
            return mockElement;
        },
        circle: (cx, cy, r) => {
            drawLog.push({ type: 'circle', cx, cy, r });
            return mockElement;
        },
        setSize: function (w, h) { drawLog.push({ type: 'setSize', w, h }); return this; },
        setResponsiveWidth: function (w, h) { drawLog.push({ type: 'setResponsiveWidth', w, h }); return this; },
        set: function () {
            return {
                push: function () { return this; },
                attr: function (a) { drawLog.push({ type: 'setAttr', attr: a }); return this; },
                scale: function () { return this; }, mouseup: function () { return this; }, toBack: function () { return this; }
            };
        }
    };
}

const context = createBrowserContext();
const filePath = path.resolve(__dirname, "dist/abcjs-basic.js");
vm.runInContext(fs.readFileSync(filePath, "utf-8"), context);
const AbcTuneBook = context.AbcTuneBook || context.window.AbcTuneBook;
const AbcParse = context.AbcParse || context.window.AbcParse;
const ABCPrinter = context.ABCPrinter || context.window.ABCPrinter;

// ── Seam A: pitchToJianpu accidental validation ──────────────────────────────
console.log("\n--- Seam A: pitchToJianpu chromatic logic ---");
const pitchToJianpu = context.pitchToJianpu || (context.window && context.window.pitchToJianpu);
if (!pitchToJianpu) {
    console.error("  FAIL: pitchToJianpu not exported!");
    failed++;
} else {
    // 1. F# (pitch 3) in K:G (has F# by default)
    // keyAccidentals for K:G is [{ acc: 'sharp', note: 'f' }]
    const keyAccsG = [{ acc: 'sharp', note: 'f' }];
    const res1 = pitchToJianpu(3, 'G', 0, undefined, keyAccsG);
    assert("F# in K:G is NOT chromatic", res1.isChromatic === false, `got isChromatic=${res1.isChromatic}`);

    // 2. F# explicitly marked in K:G
    const res2 = pitchToJianpu(3, 'G', 0, 'sharp', keyAccsG);
    assert("Explicit sharp on F in K:G is NOT chromatic", res2.isChromatic === false);

    // 3. F natural (=F, pitch 3, accidental 'natural') in K:G (chromatic!)
    const res3 = pitchToJianpu(3, 'G', 0, 'natural', keyAccsG);
    assert("F natural in K:G IS chromatic", res3.isChromatic === true);
    assert("acc is 'natural'", res3.acc === 'natural');

    // 4. F# (pitch 3, accidental 'sharp') in K:C (chromatic!)
    const res4 = pitchToJianpu(3, 'C', 0, 'sharp', []);
    assert("F sharp in K:C IS chromatic", res4.isChromatic === true);
    assert("acc is 'sharp'", res4.acc === 'sharp');
}

// ── Seam B: Accidental glyphs rendering ──────────────────────────────────────
console.log("\n--- Seam B: Accidental glyphs in drawLog ---");
function renderJianpu(abcStr) {
    const book = new AbcTuneBook(abcStr);
    const parser = new AbcParse();
    parser.parse(book.tunes[0].abc);
    const tune = parser.getTune();
    const mockPaper = createMockPaper();
    const printer = new ABCPrinter(mockPaper);
    printer.printABC(tune);
    return mockPaper.drawLog;
}

{
    // K:G, scale has F# (degree 7). Since it's in key, no accidentals.
    // =F is F natural (chromatic). F# is in-key (non-chromatic).
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:G\nV:1 clef=jianpu\n[V:1] F2 =F2 |";
    const drawLog = renderJianpu(abc);
    // Chromatic natural glyph should be rendered as a path matching the glyph 'accidentals.natural'
    // Since printSymbol prints a path containing the glyph data, we can detect it.
    // In our MockPaper, printSymbol calls paper.path(pathVal). Let's see if path is drawn.
    // The natural sign should be drawn. Let's see if we get a path.
    const paths = drawLog.filter(item => item.type === 'path');
    console.log("Accidental paths count:", paths.length);
    // In-key F# -> no glyph. Chromatic =F -> 1 natural glyph path!
    // Total paths should be 1 (excluding stave lines since stave lines are hidden for jianpu!).
    assert("Only 1 accidental glyph path is drawn", paths.length === 1, "got count=" + paths.length);
}

// ── Seam C: Line-header labels ───────────────────────────────────────────────
console.log("\n--- Seam C: Line-header labels ---");
{
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:G\nV:1 clef=jianpu\n[V:1] G2 |";
    const drawLog = renderJianpu(abc);
    const texts = drawLog.filter(item => item.type === 'text');
    console.log("Texts:", JSON.stringify(texts));
    const headerKey = texts.find(item => item.text === '1=G');
    const headerMeter = texts.find(item => item.text === '4/4');
    assert("renders '1=G' header", !!headerKey);
    assert("renders '4/4' header", !!headerMeter);
    if (headerKey && headerMeter) {
        assert("'1=G' x coordinate is 20", headerKey.x === 20);
        assert("'4/4' x coordinate is 55", headerMeter.x === 55);
    }
}

// ── 結果 ─────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(52));
console.log("Result: " + passed + " passed, " + failed + " failed");
if (failed > 0) { console.error("FAIL"); process.exit(1); }
else { console.log("ALL PASS"); process.exit(0); }
