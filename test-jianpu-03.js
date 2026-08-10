// test-jianpu-03.js  — Ticket 03 TDD
// Seam A: pitchToJianpu function exists and returns correct degree & octaveDelta
// Seam B: drawLog contains text elements with values "1"–"7" at correct coordinates for a jianpu voice
// Run: pnpm run build && node test-jianpu-03.js

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
        appendChild(c) { if (c) c.parentNode = this; this.childNodes.push(c); return c; },
        insertBefore(c) { if (c) c.parentNode = this; this.childNodes.unshift(c); return c; },
        removeChild(c) { return c; },
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

// ── Seam A: pitchToJianpu unit verification ─────────────────────────────────
console.log("\n--- Seam A: pitchToJianpu unit tests ---");
// Since pitchToJianpu is exported from the bundle or we can access it on ABCPrinter
// Let's verify if ABCPrinter or the global context has it.
// We will export pitchToJianpu to global or check if we can test it through the printer instance.
const pitchToJianpu = context.pitchToJianpu || (context.window && context.window.pitchToJianpu);

if (!pitchToJianpu) {
    console.log("  FAIL: pitchToJianpu is not globally exported. We will test via drawLog.");
    failed++;
} else {
    const testCases = [
        // [pitch, keyRoot, refOctave, expectedDegree, expectedOctaveDelta]
        [0, 'C', 0, 1, 0], // C in C Major -> 1
        [1, 'C', 0, 2, 0], // D in C Major -> 2
        [6, 'C', 0, 7, 0], // B in C Major -> 7
        [7, 'C', 0, 1, 1], // c in C Major -> 1 (octave + 1)
        [-1, 'C', 0, 7, -1], // B, in C Major -> 7 (octave - 1)
        
        [4, 'G', 0, 1, 0], // G in G Major -> 1
        [5, 'G', 0, 2, 0], // A in G Major -> 2
        [3, 'G', 0, 7, 0], // F# (pitch 3 is F, which is diatonic index 3) -> 7 in G Major (G=4, F=3 -> degree 7)
        
        [5, 'A', 0, 1, 0], // A in A Major -> 1
    ];
    for (const [p, root, ref, expDeg, expOct] of testCases) {
        const res = pitchToJianpu(p, root, ref);
        assert(`pitch=${p}, root=${root}, ref=${ref} -> deg=${expDeg}, oct=${expOct}`,
            res.degree === expDeg && res.octaveDelta === expOct,
            `got deg=${res.degree}, oct=${res.octaveDelta}`);
    }
}

// ── Seam B: DrawLog number rendering ─────────────────────────────────────────
console.log("\n--- Seam B: drawLog number rendering ---");
function getJianpuNumbers(abcStr) {
    const book = new AbcTuneBook(abcStr);
    const parser = new AbcParse();
    parser.parse(book.tunes[0].abc);
    const tune = parser.getTune();
    const mockPaper = createMockPaper();
    const printer = new ABCPrinter(mockPaper);
    printer.printABC(tune);
    return mockPaper.drawLog
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .filter(t => /^[0-7]$/.test(t));
}

{
    // C Major scale C D E F G A B
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] C D E F | G A B c |";
    const numbers = getJianpuNumbers(abc);
    console.log("C Major rendered numbers:", JSON.stringify(numbers));
    // We expect the scale degrees: 1, 2, 3, 4, 5, 6, 7, 1 (the high c is also degree 1)
    const expected = ["1", "2", "3", "4", "5", "6", "7", "1"];
    assert("C Major scale degrees correctly rendered", 
        JSON.stringify(numbers) === JSON.stringify(expected),
        `got=${JSON.stringify(numbers)}`);
}

{
    // G Major scale G A B c d e f g
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:G\nV:1 clef=jianpu\n[V:1] G A B c | d e f g |";
    const numbers = getJianpuNumbers(abc);
    console.log("G Major rendered numbers:", JSON.stringify(numbers));
    const expected = ["1", "2", "3", "4", "5", "6", "7", "1"];
    assert("G Major scale degrees correctly rendered", 
        JSON.stringify(numbers) === JSON.stringify(expected),
        `got=${JSON.stringify(numbers)}`);
}

{
    // Chord [CEG] only renders highest note (E is 3, G is 5, C is 1. Highest is G (pitch 4) -> 5)
    // Wait! Let's check pitches: C is 0, E is 2, G is 4. Highest is G -> degree 5.
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] [CEG]2 |";
    const numbers = getJianpuNumbers(abc);
    console.log("Chord rendered numbers:", JSON.stringify(numbers));
    assert("Chord [CEG] only renders highest note G -> 5",
        JSON.stringify(numbers) === JSON.stringify(["5"]),
        `got=${JSON.stringify(numbers)}`);
}

// ── 結果 ─────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(52));
console.log("Result: " + passed + " passed, " + failed + " failed");
if (failed > 0) { console.error("FAIL"); process.exit(1); }
else { console.log("ALL PASS"); process.exit(0); }
