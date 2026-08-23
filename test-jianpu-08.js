// test-jianpu-08.js
// 🎯 測試接縫 Seam A: AbcTokenizer.tokenize

const { createBrowserContext, loadJSInContext } = require('./test-jianpu-helpers');
const path = require('path');
const fs = require('fs');

const context = createBrowserContext();
const filePath = path.resolve(__dirname, "dist/abcjs-basic.js");
if (!fs.existsSync(filePath)) { console.error("Run: pnpm run build first"); process.exit(1); }
loadJSInContext(filePath, context);

const AbcTokenizer = context.AbcTokenizer || context.window.AbcTokenizer;
if (!AbcTokenizer) {
    console.error("FATAL: AbcTokenizer is not exported to global. Check index.ts.");
    process.exit(1);
}

const tokenizer = new AbcTokenizer();
let failed = 0;

function assert(condition, message) {
    if (!condition) {
        console.log(`  ❌ FAIL: ${message}`);
        failed++;
    } else {
        console.log(`  OK  ${message}`);
    }
}

console.log("--- Seam A: AbcTokenizer.tokenize unit tests ---");

try {
    // 測試簡單的音符與空格
    const res1 = tokenizer.tokenizeLine("C D E z");
    assert(Array.isArray(res1), "tokenize returns an array");
    assert(res1.length === 7, "C D E z produces 7 tokens (4 content + 3 whitespace)");
    assert(res1[0].type === 'note' && res1[0].text === 'C', "first token is note 'C'");
    assert(res1[1].type === 'whitespace', "second token is whitespace");
    assert(res1[6].type === 'rest' && res1[6].text === 'z', "last token is rest 'z'");

    // 測試小節線與偶然記號
    const res2 = tokenizer.tokenizeLine("^F/2 | [V:1]");
    assert(res2.length === 5, "^F/2 | [V:1] produces 5 tokens");
    assert(res2[0].type === 'note' && res2[0].text === '^F/2', "first token is note '^F/2'");
    assert(res2[2].type === 'bar' && res2[2].text === '|', "third token is bar '|'");
    assert(res2[4].type === 'inline_header' && res2[4].text === '[V:1]', "fifth token is inline_header '[V:1]'");

    // 測試註解與和弦
    const res3 = tokenizer.tokenizeLine("\"Am\" G % comment");
    assert(res3.length === 5, "\"Am\" G % comment produces 5 tokens");
    assert(res3[0].type === 'chord' && res3[0].text === '"Am"', "first token is chord '\"Am\"'");
    assert(res3[4].type === 'comment' && res3[4].text === '% comment', "last token is comment '% comment'");

} catch (err) {
    console.log("  ❌ FAIL: tokenizer.tokenize threw an error", err);
    failed++;
}

console.log("====================================================");
if (failed > 0) {
    console.log(`Result: FAIL (${failed} failed)`);
    process.exit(1);
} else {
    console.log("Result: ALL PASS");
    process.exit(0);
}
