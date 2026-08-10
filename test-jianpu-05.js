// test-jianpu-05.js  — Ticket 05 TDD
// Seam A: dashes for half and whole notes (length and coordinates)
// Seam B: independent underlines for unbeamed short notes
// Seam C: shared underlines for beamed groups
// Seam D: dots for dotted notes
// Run: pnpm run build && node test-jianpu-05.js

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

// ── Seam A: Dashes for half and whole notes ──────────────────────────────────
console.log("\n--- Seam A: Dashes for half/whole notes ---");
{
    // C2 is quarter (0 lines), C4 is half (1 dash), C8 is whole (3 dashes) in L:1/8
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] C2 C4 C8 |";
    const { drawLog } = renderJianpu(abc);
    // Dashes are drawn as paths starting with M and L and having no z
    const paths = drawLog.filter(item => {
        if (item.type !== 'path') return false;
        const p = item.path;
        return typeof p === 'string' && p.startsWith('M') && p.includes('L') && !p.includes('z');
    });
    console.log("Dash paths:", JSON.stringify(paths));
    // C2: 0 dashes, C4: 1 dash, C8: 3 dashes. Total = 4 dashes!
    assert("renders exactly 4 dashes", paths.length === 4, "got count=" + paths.length);
}

// ── Seam B: Independent underlines for unbeamed short notes ─────────────────
console.log("\n--- Seam B: Independent underlines ---");
{
    // C D E F with spaces -> 4 independent eighth notes -> each gets 1 underline
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] C D E F |";
    const { drawLog } = renderJianpu(abc);
    // Underlines are also drawn as paths like M x1 y L x2 y
    const paths = drawLog.filter(item => {
        if (item.type !== 'path') return false;
        const p = item.path;
        return typeof p === 'string' && p.startsWith('M') && p.includes('L') && !p.includes('z');
    });
    console.log("Underline paths:", JSON.stringify(paths));
    // We expect exactly 4 underlines, each with width 16 (from x-8 to x+8)
    assert("renders exactly 4 independent underlines", paths.length === 4, "got count=" + paths.length);
    paths.forEach((item, idx) => {
        const p = item.path;
        const parts = p.split(/\s+/);
        const x1 = parseFloat(parts[1]);
        const x2 = parseFloat(parts[4]);
        assert(`underline ${idx} width is 16`, Math.abs((x2 - x1) - 16) < 0.1, `got x1=${x1}, x2=${x2}`);
    });
}

// ── Seam C: Shared underlines for beamed groups ──────────────────────────────
console.log("\n--- Seam C: Shared underlines ---");
{
    // CDEF without spaces -> beamed eighth notes -> 1 continuous underline
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] CDEF |";
    const { drawLog } = renderJianpu(abc);
    const paths = drawLog.filter(item => {
        if (item.type !== 'path') return false;
        const p = item.path;
        return typeof p === 'string' && p.startsWith('M') && p.includes('L') && !p.includes('z');
    });
    console.log("Beamed underline paths:", JSON.stringify(paths));
    // We expect exactly 1 underline, stretching from C.x - 8 to F.x + 8
    assert("renders exactly 1 continuous underline", paths.length === 1, "got count=" + paths.length);
}

// ── Seam D: Dotted notes ─────────────────────────────────────────────────────
console.log("\n--- Seam D: Dotted notes ---");
{
    // C3 is dotted quarter note -> 1 dot on right
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] C3 |";
    const { drawLog, yValue } = renderJianpu(abc);
    // Dotted note dot is drawn as circle
    const circles = drawLog.filter(item => item.type === 'circle');
    console.log("Circles for dotted note:", JSON.stringify(circles));
    // C3: 0 octave dots, 1 dotted note dot. Total = 1 circle!
    assert("renders exactly 1 dot on the right", circles.length === 1, "got count=" + circles.length);
    if (circles.length === 1) {
        assert("dotted dot Y coordinate aligns with y - 6", Math.abs(circles[0].cy - (yValue - 6)) < 0.1, `got cy=${circles[0].cy}`);
    }
}

// ── 結果 ─────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(52));
console.log("Result: " + passed + " passed, " + failed + " failed");
if (failed > 0) { console.error("FAIL"); process.exit(1); }
else { console.log("ALL PASS"); process.exit(0); }
