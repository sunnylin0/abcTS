// test-jianpu-03.js  — Ticket 03 TDD
// Seam A: pitchToJianpu function exists and returns correct degree & octaveDelta
// Seam B: drawLog contains text elements with values "1"–"7" at correct coordinates for a jianpu voice
// Run: pnpm run build && node test-jianpu-03.js


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
    printer.printSymbol = (x, offset, symbol) => {
        if (offset === 8) {
            mockPaper.drawLog.push({ type: 'text', text: symbol });
        }
        return { mouseup: () => {}, attr: () => ({ toBack: () => {} }), scale: () => {} };
    };
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
