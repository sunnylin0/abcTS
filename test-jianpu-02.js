// test-jianpu-02.js  — Ticket 02 TDD
// Seam A: voice.clef, voice.jianpuOctave, voice.jianpuKey are correctly populated on ABCVoiceElement
// Seam B: drawLog has NO stave lines for jianpu voice/staff, but has them for treble
// Run: pnpm run build && node test-jianpu-02.js


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
if (!fs.existsSync(filePath)) { console.error("Run: pnpm run build first"); process.exit(1); }
loadJSInContext(filePath, context);
const AbcTuneBook = context.AbcTuneBook || context.window.AbcTuneBook;
const AbcParse = context.AbcParse || context.window.AbcParse;
const ABCPrinter = context.ABCPrinter || context.window.ABCPrinter;

function testTune(abcStr) {
    const book = new AbcTuneBook(abcStr);
    const parser = new AbcParse();
    parser.parse(book.tunes[0].abc);
    const tune = parser.getTune();
    const mockPaper = createMockPaper();
    const printer = new ABCPrinter(mockPaper);
    printer.printABC(tune);
    return { tune, printer, drawLog: mockPaper.drawLog };
}

// ── Seam A: ABCVoiceElement metadata properties ──────────────────────────────
console.log("\n--- Seam A: Voice metadata propagation ---");
{
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:G\nV:1 clef=jianpu octave=4\n[V:1] C2|";
    const { printer } = testTune(abc);
    const voice = printer.staffgroups[0].voices[0];
    assert("voice.clef === 'jianpu'", voice.clef === "jianpu", "got=" + (voice ? voice.clef : "undefined"));
    assert("voice.jianpuOctave === 4", voice.jianpuOctave === 4, "got=" + (voice ? voice.jianpuOctave : "undefined"));
    assert("voice.jianpuKey is G key object", voice.jianpuKey && voice.jianpuKey.root === "G", "got=" + (voice ? JSON.stringify(voice.jianpuKey) : "undefined"));
}

// ── Seam B: Skip stave lines and notes for jianpu staff ─────────────────────
console.log("\n--- Seam B: DrawLog for treble vs jianpu ---");
{
    const abc = "X:1\nT:T\nM:4/4\nL:1/8\nK:C\n%%score [1 2]\nV:1 clef=treble\nV:2 clef=jianpu\n[V:1] C2D2|\n[V:2] C2D2|";
    const { drawLog } = testTune(abc);
    const stavePaths = drawLog.filter(item => {
        if (item.type !== 'path') return false;
        const p = item.path || (item.attr && item.attr.path);
        if (typeof p !== 'string') return false;
        const parts = p.trim().split(/\s+/);
        if (parts[0] !== 'M' || parts[3] !== 'L') return false;
        const x1 = parseFloat(parts[1]);
        const x2 = parseFloat(parts[4]);
        return (x2 - x1) > 500;
    });
    console.log("DrawLog paths count:", stavePaths.length);
    assert("Only treble staff gets stave lines (exactly 5 paths)", stavePaths.length === 5, "got paths count=" + stavePaths.length);
}

// ── 結果 ─────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(52));
console.log("Result: " + passed + " passed, " + failed + " failed");
if (failed > 0) { console.error("FAIL"); process.exit(1); }
else { console.log("ALL PASS"); process.exit(0); }
