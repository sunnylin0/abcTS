// test-jianpu-04.js  — Ticket 04 TDD
// Seam A: c (pitch 7, root C) -> octaveDelta=1 -> exactly 1 circle at (x, y - 12)
// Seam B: c' (pitch 14, root C) -> octaveDelta=2 -> exactly 2 circles above
// Seam C: C, (pitch -7, root C) -> octaveDelta=-1 -> exactly 1 circle at (x, y + 10)
// Run: pnpm run build && node test-jianpu-04.js

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
        // We add svg circle support in MockPaper
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

function renderJianpu(abcStr) {
    const book = new AbcTuneBook(abcStr);
    const parser = new AbcParse();
    parser.parse(book.tunes[0].abc);
    const tune = parser.getTune();
    const mockPaper = createMockPaper();
    const printer = new ABCPrinter(mockPaper);
    printer.printABC(tune);
    return { drawLog: mockPaper.drawLog, yValue: printer.staffgroups[0].voices[0].y };
}

// ── Seam A: c (1 dot above) ─────────────────────────────────────────────────
console.log("\n--- Seam A: c (1 dot above) ---");
{
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] c2 |";
    const { drawLog, yValue } = renderJianpu(abc);
    const circles = drawLog.filter(item => item.type === 'circle');
    console.log("Circles for c2:", JSON.stringify(circles));
    assert("c2 renders exactly 1 dot", circles.length === 1, "got count=" + circles.length);
    if (circles.length === 1) {
        const expectedY = yValue - 12;
        assert("dot position is y - 12", Math.abs(circles[0].cy - expectedY) < 0.1, `got cy=${circles[0].cy}, expected=${expectedY}`);
    }
}

// ── Seam B: c' (2 dots above) ────────────────────────────────────────────────
console.log("\n--- Seam B: c' (2 dots above) ---");
{
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] c'2 |";
    const { drawLog, yValue } = renderJianpu(abc);
    const circles = drawLog.filter(item => item.type === 'circle');
    console.log("Circles for c'2:", JSON.stringify(circles));
    assert("c'2 renders exactly 2 dots", circles.length === 2, "got count=" + circles.length);
    if (circles.length === 2) {
        // Order: first is y-12, second is y-16
        const yCoords = circles.map(c => c.cy).sort((a, b) => b - a); // largest Y (closest to note) to smallest Y (furthest)
        const expectedFirst = yValue - 12;
        const expectedSecond = yValue - 16;
        assert("first dot is y - 12", Math.abs(yCoords[0] - expectedFirst) < 0.1, `got=${yCoords[0]}`);
        assert("second dot is y - 16", Math.abs(yCoords[1] - expectedSecond) < 0.1, `got=${yCoords[1]}`);
    }
}

// ── Seam C: C, (1 dot below) ────────────────────────────────────────────────
console.log("\n--- Seam C: C, (1 dot below) ---");
{
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] C,2 |";
    const { drawLog, yValue } = renderJianpu(abc);
    const circles = drawLog.filter(item => item.type === 'circle');
    console.log("Circles for C,2:", JSON.stringify(circles));
    assert("C,2 renders exactly 1 dot", circles.length === 1, "got count=" + circles.length);
    if (circles.length === 1) {
        const expectedY = yValue + 10;
        assert("dot position is y + 10", Math.abs(circles[0].cy - expectedY) < 0.1, `got cy=${circles[0].cy}, expected=${expectedY}`);
    }
}

// ── 結果 ─────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(52));
console.log("Result: " + passed + " passed, " + failed + " failed");
if (failed > 0) { console.error("FAIL"); process.exit(1); }
else { console.log("ALL PASS"); process.exit(0); }
