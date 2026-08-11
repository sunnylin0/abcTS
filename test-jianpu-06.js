// test-jianpu-06.js  — Ticket 06 TDD
// Seam A: pitchToJianpu chromatic detection
// Seam B: chromatic accidental glyphs rendering in drawLog
// Seam C: line-header labels 1=Key and Meter in drawLog
// Run: pnpm run build && node test-jianpu-06.js

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
    const paths = drawLog.filter(item => item.type === 'path');
    const accidentalPaths = paths.filter(p => {
        const pathStr = p.path ? String(p.path) : (p.attr && p.attr.path ? String(p.attr.path) : '');
        return pathStr.indexOf('c') !== -1;
    });
    console.log("Accidental natural glyph paths count:", accidentalPaths.length);
    assert("Only 1 accidental natural glyph path is drawn", accidentalPaths.length === 1, "got count=" + accidentalPaths.length);
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
