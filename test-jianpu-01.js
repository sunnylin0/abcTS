// test-jianpu-01.js  — Ticket 01 TDD
// Seam A: clef.type === "jianpu" after parsing V:N clef=jianpu
// Seam B: KeySigElement.root correct for various keys
// Run: pnpm run build && node test-jianpu-01.js

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
            body: mockBody, createElement: (t) => new MockElement(t),
            createElementNS: (ns, t) => new MockElement(t),
            getElementsByTagName: (t) => t === "body" ? [mockBody] : [],
            createTextNode: (s) => ({ nodeValue: s||"", textContent: s||"" }),
            querySelector: (sel) => sel === "body" ? mockBody : new MockElement("div"),
            createEvent: () => ({ initEvent: () => {} }),
            write: () => {}, getElementById: (id) => new MockElement("div")
        },
        Event: class {}, Element: MockElement, HTMLElement: MockElement,
        SVGElement: MockElement, SVGPathElement: MockElement, SVGTextElement: MockElement,
        SVGRectElement: MockElement, SVGLineElement: MockElement,
        SVGGElement: MockElement, SVGSVGElement: MockElement,
        console, setTimeout, clearTimeout
    };
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

const context = createBrowserContext();
const filePath = path.resolve(__dirname, "dist/abcjs-basic.js");
if (!fs.existsSync(filePath)) { console.error("Run: pnpm run build first"); process.exit(1); }
vm.runInContext(fs.readFileSync(filePath, "utf-8"), context);
const AbcTuneBook = context.AbcTuneBook || context.window.AbcTuneBook;
const AbcParse = context.AbcParse || context.window.AbcParse;

function parse(abcStr) {
    const book = new AbcTuneBook(abcStr);
    const parser = new AbcParse();
    parser.parse(book.tunes[0].abc);
    return { tune: parser.getTune(), warnings: parser.getWarnings() || [] };
}

function clefOf(tune, staffIdx) {
    return tune.lines[0]&&tune.lines[0].staff&&tune.lines[0].staff[staffIdx]&&tune.lines[0].staff[staffIdx].clef&&tune.lines[0].staff[staffIdx].clef.type;
}
function rootOf(tune) {
    return tune.lines[0]&&tune.lines[0].staff&&tune.lines[0].staff[0]&&tune.lines[0].staff[0].key&&tune.lines[0].staff[0].key.root;
}

// ── Seam A: clef.type === "jianpu" ───────────────────────────────────────────
console.log("\n--- Seam A: clef.type correctly set to jianpu ---");
{
    const { tune } = parse("X:1\nT:T\nM:4/4\nL:1/8\nK:C\nV:1 clef=jianpu\n[V:1] CDEF|");
    assert("V:1 clef=jianpu -> clef.type=jianpu", clefOf(tune, 0) === "jianpu", "got=" + clefOf(tune, 0));
}
{
    const { tune } = parse("X:1\nT:T\nM:4/4\nL:1/8\nK:G\nV:1 clef=treble\nV:2 clef=jianpu\n[V:1] GABC|\n[V:2] GABC|");
    assert("V:1 clef=treble -> clef.type=treble (regression)", clefOf(tune, 0) === "treble", "got=" + clefOf(tune, 0));
    assert("V:2 clef=jianpu -> clef.type=jianpu", clefOf(tune, 1) === "jianpu", "got=" + clefOf(tune, 1));
}

// ── Seam B: KeySigElement.root ───────────────────────────────────────────────
console.log("\n--- Seam B: KeySigElement.root ---");
const cases = [
    ["K:C","C"],["K:G","G"],["K:D","D"],["K:A","A"],["K:E","E"],["K:B","B"],["K:F#","F#"],
    ["K:F","F"],["K:Bb","Bb"],["K:Eb","Eb"],["K:Ab","Ab"],
    ["K:Am","C"],["K:Em","G"],["K:Bm","D"],["K:Dm","F"],
];
for (const [kStr, expected] of cases) {
    const { tune } = parse("X:1\nT:T\nM:4/4\nL:1/8\n" + kStr + "\nV:1 clef=jianpu\n[V:1] CDEF|");
    const root = rootOf(tune);
    assert(kStr + " -> root=" + expected, root === expected, "got=" + root);
}

// ── 結果 ─────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(52));
console.log("Result: " + passed + " passed, " + failed + " failed");
if (failed > 0) { console.error("FAIL"); process.exit(1); }
else { console.log("ALL PASS"); process.exit(0); }
