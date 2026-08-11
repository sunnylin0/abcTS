// test-jianpu-05.js  — Ticket 05 TDD
// Seam A: dashes for half and whole notes (length and coordinates)
// Seam B: independent underlines for unbeamed short notes
// Seam C: shared underlines for beamed groups
// Seam D: dots for dotted notes

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
