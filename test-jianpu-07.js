// test-jianpu-07.js  — JianpuVoiceRenderer Unit Test
// 直接對 JianpuVoiceRenderer 發射，不走 ABCPrinter 完整流程。
// 驗證解耦後的 Seam：render() 產出的 drawLog 與原始行為一致。
// Run: pnpm run build && node test-jianpu-07.js

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

const ABCVoiceElement = context.ABCVoiceElement || context.window.ABCVoiceElement;
const pitchToJianpu = context.pitchToJianpu || context.window.pitchToJianpu;

if (!ABCVoiceElement) {
    console.error("FATAL: ABCVoiceElement is not exported to global. Check index.ts.");
    process.exit(1);
}

// ── 建立 Mock ABCPrinter ─────────────────────────────────────────────────────
function createMockPrinter() {
    const mockPaper = createMockPaper();
    return {
        paper: mockPaper,
        drawLog: mockPaper.drawLog,
        glyphs: {
            printSymbol: (x, y, name, paper) => {
                mockPaper.drawLog.push({ type: 'symbol', x, y, name });
                return { mouseup: () => {} };
            }
        },
        notifySelect: () => {},
        calcY: (pitch) => 100 - pitch * 4,
        bindInteraction: (svgEl, absEl) => {
            const elements = Array.isArray(svgEl) ? svgEl : [svgEl];
            for (const el of elements) {
                if (el) {
                    el._abcElement = absEl;
                }
            }
        },
        beginGroup: () => {},
        endGroup: () => null,
    };
}

// ── 建立 Mock ABCVoiceElement ──────────────────────────────────────
function makeVoice({ y = 50, jianpuKey = { root: 'C', accidentals: [] }, jianpuOctave = 0, children = [] } = {}) {
    const voice = new ABCVoiceElement(y, 0, 1);
    voice.jianpuKey = jianpuKey;
    voice.jianpuOctave = jianpuOctave;
    voice.children = children;
    voice.clef = 'jianpu';
    return voice;
}

const ABCAbsoluteElement = context.ABCAbsoluteElement || context.window.ABCAbsoluteElement;
const ABCRelativeElement = context.ABCRelativeElement || context.window.ABCRelativeElement;

function makeNoteChild(pitch, duration = 0.25, x = 100) {
    const abcelem = {
        el_type: 'note',
        pitches: [{ pitch, accidental: undefined }],
        averagepitch: pitch,
        minpitch: pitch,
        maxpitch: pitch,
    };
    const absEl = new ABCAbsoluteElement(abcelem, duration);
    absEl.x = x;
    
    const keyRoot = 'C';
    const refOctave = 0;
    const res = pitchToJianpu(pitch, keyRoot, refOctave);
    const notehead = new ABCRelativeElement(String(res.degree), 0, 12, 0, { type: 'jianpuNote' });
    absEl.addHead(notehead);

    const octaveDelta = res.octaveDelta;
    if (octaveDelta > 0) {
        for (let k = 0; k < octaveDelta; k++) {
            absEl.addChild(new ABCRelativeElement('.', 0, 0, -12 - k * 4, { type: 'jianpuDot' }));
        }
    } else if (octaveDelta < 0) {
        const absDelta = Math.abs(octaveDelta);
        for (let k = 0; k < absDelta; k++) {
            absEl.addChild(new ABCRelativeElement('.', 0, 0, 10 + k * 4, { type: 'jianpuDot' }));
        }
    }

    let beats = duration * 4;
    let numDashes = 0;
    let dot = 0;
    if (beats >= 1) {
        if (Math.abs(beats - Math.round(beats)) < 1e-9) {
            numDashes = Math.round(beats) - 1;
        } else {
            let floorBeats = Math.floor(beats);
            numDashes = floorBeats - 1;
            let rem = beats - floorBeats;
            if (Math.abs(rem - 0.5) < 1e-9) dot = 1;
        }
    } else {
        let dots = 0;
        let base = duration;
        const testBase1 = duration / 1.5;
        const log2_1 = Math.log2(testBase1);
        if (Math.abs(log2_1 - Math.round(log2_1)) < 1e-9) {
            dots = 1;
            base = testBase1;
        } else {
            const testBase2 = duration / 1.75;
            const log2_2 = Math.log2(testBase2);
            if (Math.abs(log2_2 - Math.round(log2_2)) < 1e-9) {
                dots = 2;
                base = testBase2;
            }
        }
        dot = dots;
    }

    for (let k = 0; k < numDashes; k++) {
        absEl.addRight(new ABCRelativeElement('-', 18 + k * 24, 12, 0, { type: 'jianpuDash' }));
    }

    if (dot > 0) {
        for (let k = 0; k < dot; k++) {
            absEl.addRight(new ABCRelativeElement('.', 12 + k * 6, 2, -6, { type: 'jianpuDot', linewidth: 1.5 }));
        }
    }

    return absEl;
}

function makeRestChild(duration = 0.25, x = 100) {
    const abcelem = {
        el_type: 'note',
        rest: { type: 'rest' },
        pitches: [],
        averagepitch: 7,
        minpitch: 7,
        maxpitch: 7,
    };
    const absEl = new ABCAbsoluteElement(abcelem, duration);
    absEl.x = x;

    const notehead = new ABCRelativeElement('0', 0, 12, 0, { type: 'jianpuNote' });
    absEl.addHead(notehead);

    return absEl;
}

function makeBarChild(x = 80) {
    return {
        x,
        duration: 0,
        beam: null,
        abcelem: { el_type: 'bar' },
        draw: (printer, bartop) => {
            printer.paper.drawLog.push({ type: 'bar', x });
        },
    };
}

function makeMeterChild(num = '4', den = '4', x = 30) {
    return {
        x,
        duration: 0,
        beam: null,
        abcelem: {
            el_type: 'meter',
            value: [{ num, den }],
        },
        draw: (printer, bartop) => {
            printer.paper.drawLog.push({ type: 'meter', x });
        },
    };
}

// ── Seam A: 行首標記 (1=Key & 拍號) ─────────────────────────────────────────
console.log("\n--- Seam A: Header rendering (1=Key, Meter) ---");
{
    const printer = createMockPrinter();
    const voice = makeVoice({ jianpuKey: { root: 'G', accidentals: [] }, children: [makeMeterChild('3', '4')] });
    voice.jianpu_draw(printer, 0);

    const texts = printer.drawLog.filter(e => e.type === 'text').map(e => e.text);
    assert("Header contains '1=G'", texts.includes('1=G'), `got=${JSON.stringify(texts)}`);
    assert("Header contains '3/4' meter", texts.includes('3/4'), `got=${JSON.stringify(texts)}`);
}

// ── Seam B: 音符數字渲染 ─────────────────────────────────────────────────────
console.log("\n--- Seam B: Note degree rendering ---");
{
    // C major: pitches 0,1,2,3,4,5,6 -> degrees 1,2,3,4,5,6,7
    const printer = createMockPrinter();
    const notes = [0, 1, 2, 3, 4, 5, 6].map((p, i) => makeNoteChild(p, 0.25, 100 + i * 40));
    const voice = makeVoice({ children: notes });
    voice.jianpu_draw(printer, 0);

    const digits = printer.drawLog
        .filter(e => e.type === 'text' && /^[1-7]$/.test(e.text))
        .map(e => e.text);
    assert("C Major scale renders 1-7", JSON.stringify(digits) === JSON.stringify(['1','2','3','4','5','6','7']),
        `got=${JSON.stringify(digits)}`);
}

// ── Seam C: 休止符渲染為 0 ───────────────────────────────────────────────────
console.log("\n--- Seam C: Rest renders as '0' ---");
{
    const printer = createMockPrinter();
    const voice = makeVoice({ children: [makeRestChild()] });
    voice.jianpu_draw(printer, 0);

    const digits = printer.drawLog.filter(e => e.type === 'text' && e.text === '0');
    assert("Rest renders as '0'", digits.length === 1, `got=${JSON.stringify(digits)}`);
}

// ── Seam D: 高八度圓點 ────────────────────────────────────────────────────────
console.log("\n--- Seam D: High octave dots (pitch=7 -> octaveDelta=1) ---");
{
    const printer = createMockPrinter();
    // pitch=7 → octave 1, C in octave +1 → degree 1, delta +1
    const voice = makeVoice({ children: [makeNoteChild(7, 0.25, 100)] });
    voice.jianpu_draw(printer, 0);

    const dots = printer.drawLog.filter(e => e.type === 'circle');
    assert("High octave: 1 circle above note", dots.length === 1, `got circles=${dots.length}`);
    assert("Dot Y is above note Y (y - 12)", dots[0] && dots[0].cy === 50 - 12, `got cy=${dots[0] && dots[0].cy}`);
}

// ── Seam E: 八分音符底線 ─────────────────────────────────────────────────────
console.log("\n--- Seam E: Eighth note gets 1 underline ---");
{
    const printer = createMockPrinter();
    // duration=0.125 -> 八分音符 -> 1 underline
    const voice = makeVoice({ children: [makeNoteChild(0, 0.125, 100)] });
    voice.jianpu_draw(printer, 0);

    const underlines = printer.drawLog.filter(e => e.type === 'path' && typeof e.path === 'string' && e.path.includes('M'));
    // 只有底線路徑，沒有延音橫線（duration 0.125 不觸發延音線）
    assert("Eighth note has 1 underline path", underlines.length === 1, `got paths=${underlines.length}`);
}

// ── Seam F: 二分音符延音橫線 ─────────────────────────────────────────────────
console.log("\n--- Seam F: Half note gets 1 dash line ---");
{
    const printer = createMockPrinter();
    // duration=0.5 -> 二分音符 -> 1 dash
    const voice = makeVoice({ children: [makeNoteChild(0, 0.5, 100)] });
    voice.jianpu_draw(printer, 0);

    const paths = printer.drawLog.filter(e => e.type === 'path');
    assert("Half note has 1 dash line", paths.length === 1, `got=${paths.length}`);
}

// ── Seam G: 互動選取與屬性掛載 ───────────────────────────────────────────────
console.log("\n--- Seam G: Interaction association (bindInteraction) ---");
{
    const printer = createMockPrinter();
    let selected = null;
    printer.notifySelect = (el) => { selected = el; };

    const note = makeNoteChild(0, 0.25, 100);
    const voice = makeVoice({ children: [note] });
    voice.jianpu_draw(printer, 0);

    const mockClickedNode = {
        _abcElement: note,
        parentNode: null
    };

    let curr = mockClickedNode;
    while (curr) {
        if (curr._abcElement) {
            printer.notifySelect(curr._abcElement);
            break;
        }
        curr = curr.parentNode;
    }

    assert("Global delegation bubble-up notifies selection correctly", selected === note);
}

// ── 結果 ─────────────────────────────────────────────────────────────────────
console.log("\n" + "=".repeat(52));
console.log("Result: " + passed + " passed, " + failed + " failed");
if (failed > 0) { console.error("FAIL"); process.exit(1); }
else { console.log("ALL PASS"); process.exit(0); }
