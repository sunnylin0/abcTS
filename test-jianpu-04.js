// test-jianpu-04.js  — Ticket 04 TDD
// Seam A: c (pitch 7, root C) -> octaveDelta=1 -> exactly 1 circle at (x, y - 12)
// Seam B: c' (pitch 14, root C) -> octaveDelta=2 -> exactly 2 circles above
// Seam C: C, (pitch -7, root C) -> octaveDelta=-1 -> exactly 1 circle at (x, y + 10)
// Run: pnpm run build && node test-jianpu-04.js

const { createBrowserContext, loadJSInContext, createMockPaper } = require('./test-jianpu-helpers');
const path = require('path');
const fs = require('fs');

let passed = 0, failed = 0;
function assert(label, condition, detail) {
    if (condition) { console.log("  OK  " + label); passed++; }
    else { console.error("  FAIL " + label + (detail ? " [" + detail + "]" : "")); failed++; }
}

const context = createBrowserContext();
const filePath = path.resolve(__dirname, "dist/abcjs-basic.js");
loadJSInContext(filePath, context);
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
