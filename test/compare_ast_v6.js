const fs = require('fs');
const path = require('path');
const vm = require('vm');
const util = require('util'); // 💡 引入 util 用於深層解構 [object Object]

// ============================================================================
// 1. 全功能 DOM & SVG 沙盒環境
// ============================================================================
function createBrowserContext() {
    class MockElement {
        constructor(tagName) {
            this.tagName = tagName ? tagName.toLowerCase() : 'div';
            this.attributes = {};
            this.childNodes = [];
            this.parentNode = null;
            this.style = {};
            this.children = [];
            this.textContent = '';
        }
        setAttribute(k, v) { this.attributes[k] = String(v); return this; }
        setAttributeNS(ns, k, v) { this.attributes[k] = String(v); return this; }
        getAttribute(k) { return this.attributes[k]; }
        removeAttribute(k) { delete this.attributes[k]; }
        appendChild(child) {
            if (!child) return child;
            child.parentNode = this;
            this.childNodes.push(child);
            if (child.tagName) this.children.push(child);
            return child;
        }
        insertBefore(child, ref) {
            if (!child) return child;
            child.parentNode = this;
            this.childNodes.unshift(child);
            if (child.tagName) this.children.unshift(child);
            return child;
        }
        removeChild(child) {
            const idx = this.childNodes.indexOf(child);
            if (idx !== -1) this.childNodes.splice(idx, 1);
            const cIdx = this.children.indexOf(child);
            if (cIdx !== -1) this.children.splice(cIdx, 1);
            return child;
        }
        getBBox() { return { x: 0, y: 0, width: 50, height: 15 }; }
        addEventListener() { }
        mouseup(fn) { return this; }
        attr(attributes) {
            if (attributes && typeof attributes === 'object') {
                for (const k in attributes) this.setAttribute(k, attributes[k]);
            }
            return this;
        }
        toBack() {
            if (this.parentNode && this.parentNode.childNodes) {
                this.parentNode.insertBefore(this, this.parentNode.childNodes[0]);
            }
            return this;
        }
    }

    const mockBody = new MockElement('body');
    const $break = { name: '$break' };

    const sandbox = {
        $break: $break,
        window: {},
        navigator: { userAgent: "node" },
        document: {
            body: mockBody,
            createElement: (tag) => new MockElement(tag),
            createElementNS: (ns, tag) => new MockElement(tag),
            getElementsByTagName: (tag) => tag === 'body' ? [mockBody] : [],
            createTextNode: (str) => ({ nodeValue: str || '', textContent: str || '' }),
            querySelector: (sel) => sel === 'body' ? mockBody : new MockElement('div'),
            createEvent: () => ({ initEvent: () => { } }),
            write: () => { },
            getElementById: (id) => new MockElement('div')
        },
        Event: class MockEvent { },
        Element: MockElement,
        HTMLElement: MockElement,
        SVGElement: MockElement,
        SVGPathElement: class SVGPathElement extends MockElement { },
        SVGTextElement: class SVGTextElement extends MockElement { },
        SVGRectElement: class SVGRectElement extends MockElement { },
        SVGLineElement: class SVGLineElement extends MockElement { },
        SVGGElement: class SVGGElement extends MockElement { },
        SVGSVGElement: class SVGSVGElement extends MockElement { },
        console: console
    };

    sandbox.window.window = sandbox.window;
    sandbox.window.document = sandbox.document;
    sandbox.window.$break = $break;
    sandbox.window.Element = sandbox.Element;
    sandbox.window.SVGElement = sandbox.SVGElement;
    sandbox.self = sandbox;

    const context = vm.createContext(sandbox);

    const prototypePath = path.resolve(__dirname, '../../abcjs_20100604/prototype.js');
    if (fs.existsSync(prototypePath)) {
        vm.runInContext(fs.readFileSync(prototypePath, 'utf-8'), context);
    }

    return context;
}

function loadJSInContext(filePath, context) {
    const code = fs.readFileSync(filePath, 'utf-8');
    vm.runInContext(code, context);
}

// ============================================================================
// 2. 模擬繪圖元件 (Mock Paper)
// ============================================================================
function createMockPaper() {
    const drawLog = [];

    const mockElement = {
        attr: function (attributes) {
            if (drawLog.length > 0) {
                drawLog[drawLog.length - 1].attr = JSON.parse(JSON.stringify(attributes));
            }
            return this;
        },
        toBack: function () {
            if (drawLog.length > 0) drawLog[drawLog.length - 1].toBack = true;
            return this;
        },
        getBBox: () => ({ x: 0, y: 0, width: 50, height: 15 }),
        mouseup: function () { return this; },
        appendChild: () => { },
        setAttribute: () => { },
        style: {}
    };

    const createDummySvgNode = () => ({
        setAttribute: () => { },
        appendChild: () => { },
        insertBefore: () => { },
        removeChild: () => { },
        style: {},
        childNodes: []
    });

    return {
        drawLog,
        svg: createDummySvgNode(),
        paper: createDummySvgNode(),
        canvas: { parentNode: createDummySvgNode(), style: {} },
        parentElement: createDummySvgNode(),
        clear: function () { },
        setPaper: function () { return this; },

        path: (pathVal) => {
            let pathString = pathVal;
            if (pathVal && typeof pathVal === 'object') {
                pathString = pathVal.path || pathVal;
            }
            drawLog.push({ type: 'path', path: pathString });
            return mockElement;
        },
        text: (x, y, textStr, attr) => {
            drawLog.push({ type: 'text', x, y, text: textStr, attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
            return mockElement;
        },
        rect: (attr) => {
            drawLog.push({ type: 'rect', attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
            return mockElement;
        },
        setSize: (w, h) => drawLog.push({ type: 'setSize', w, h }),
        setResponsiveWidth: (w, h) => drawLog.push({ type: 'setResponsiveWidth', w, h }),
        set: function () {
            return {
                push: function () { return this; },
                attr: function (a) { drawLog.push({ type: 'setAttr', attr: a }); return this; },
                scale: function () { return this; },
                mouseup: function () { return this; },
                toBack: function () { return this; }
            };
        }
    };
}

// ============================================================================
// 3. 比對與 Diff 高亮
// ============================================================================
function deepCompare(obj1, obj2, path = '') {
    if (obj1 === undefined && obj2 !== undefined) throw new Error(`Value mismatch at ${path}: old is undefined`);
    if (obj1 !== undefined && obj2 === undefined) throw new Error(`Value mismatch at ${path}: new is undefined`);
    if (typeof obj1 !== typeof obj2) throw new Error(`Type mismatch at ${path}: old is ${typeof obj1}, new is ${typeof obj2}`);

    if (obj1 === null || obj1 === undefined || typeof obj1 !== 'object') {
        if (obj1 !== obj2) throw new Error(`Value mismatch at ${path}: old = ${JSON.stringify(obj1)}, new = ${JSON.stringify(obj2)}`);
        return;
    }

    if (Array.isArray(obj1)) {
        if (!Array.isArray(obj2)) throw new Error(`Type mismatch at ${path}`);
        if (obj1.length !== obj2.length) throw new Error(`Array length mismatch at ${path}: old=${obj1.length}, new=${obj2.length}`);
        for (let i = 0; i < obj1.length; i++) deepCompare(obj1[i], obj2[i], `${path}[${i}]`);
        return;
    }

    const filterKeys = (obj) => Object.keys(obj).filter(k => typeof obj[k] !== 'function' && !['each', 'strip', 'gsub', 'last'].includes(k)).sort();
    const keys1 = filterKeys(obj1);
    const keys2 = filterKeys(obj2);

    const missingInNew = keys1.filter(k => !keys2.includes(k));
    const extraInNew = keys2.filter(k => !keys1.includes(k));
    if (missingInNew.length > 0) throw new Error(`Missing keys in new AST at ${path}: [${missingInNew.join(', ')}]`);
    if (extraInNew.length > 0) throw new Error(`Extra keys in new AST at ${path}: [${extraInNew.join(', ')}]`);

    for (const key of keys1) deepCompare(obj1[key], obj2[key], `${path}.${key}`);
}

function printDrawLogDiff(oldLog, newLog) {
    const red = (str) => `\x1b[31m\x1b[1m${str}\x1b[0m`;
    const gray = (str) => `\x1b[90m${str}\x1b[0m`;

    const formatItem = (x) => {
        if (!x) return 'undefined';
        if (x.type === 'text') return `text: "${x.text}" at (${x.x}, ${x.y})`;
        if (x.type === 'setSize') return `setSize: ${x.w}x${x.h}`;
        if (x.type === 'setResponsiveWidth') return `setResponsiveWidth: ${x.w}x${x.h}`;
        if (x.type === 'path') {
            let p = x.path ? (typeof x.path === 'string' ? x.path : JSON.stringify(x.path).substring(0, 40) + '...') : (x.attr?.path || '');
            const stroke = x.attr?.stroke || 'none';
            const fill = x.attr?.fill || '#0';
            return `path: ${String(p).substring(0, 60)} (stroke=${stroke}, fill=${fill})`;
        }
        return JSON.stringify(x);
    };

    const highlightDiff = (strOld, strNew) => {
        let diffOld = '', diffNew = '';
        const maxLen = Math.max(strOld.length, strNew.length);
        for (let i = 0; i < maxLen; i++) {
            const cOld = strOld[i] || '', cNew = strNew[i] || '';
            if (cOld === cNew) {
                diffOld += cOld; diffNew += cNew;
            } else {
                diffOld += cOld ? red(cOld) : '';
                diffNew += cNew ? red(cNew) : '';
            }
        }
        return { diffOld, diffNew };
    };

    console.log('\n================ 🔍 DRAW LOG DIFF 🔍 ================');
    const maxCount = Math.max(oldLog.length, newLog.length);
    for (let i = 0; i < maxCount; i++) {
        const itemOld = formatItem(oldLog[i]);
        const itemNew = formatItem(newLog[i]);
        if (itemOld !== itemNew) {
            const { diffOld, diffNew } = highlightDiff(itemOld, itemNew);
            console.log(`\x1b[33m[Line ${i} MISMATCH]\x1b[0m`);
            console.log(`  ${gray('OLD:')} ${diffOld}`);
            console.log(`  ${gray('NEW:')} ${diffNew}`);
        } else {
            console.log(gray(`  [${i} MATCH] ${itemOld}`));
        }
    }
    console.log('=====================================================\n');
}

// ============================================================================
// 4. 測試主流程
// ============================================================================
const oldContext = createBrowserContext();
const newContext = createBrowserContext();

const oldFiles = [
    'sprintf.js',
    'abc_glyphs.js',
    'abc_graphelements.js',
    'abc_layout.js',
    'abc_write.js',
    'abc_tunebook.js',
    'abc_tokenizer.js',
    'abc_parse_header.js',
    'abc_parse.js',
    'abc_tune.js'
];
console.log('Loading abcjs_20100604 files...');
oldFiles.forEach(file => loadJSInContext(path.resolve(__dirname, '../../abcjs_20100604', file), oldContext));

const OldAbcTuneBook = oldContext.AbcTuneBook || oldContext.window.AbcTuneBook;
const OldAbcParse = oldContext.AbcParse || oldContext.window.AbcParse;
const OldABCPrinter = oldContext.ABCPrinter || oldContext.window.ABCPrinter;

console.log('Loading abcTS bundled file...');
loadJSInContext(path.resolve(__dirname, '../dist/abcjs-basic.js'), newContext);

const testABCStrings = [
    `X:1\nT:Simple Tune\nM:4/4\nK:C\nC D E F|G A B c|`,
    `X:2\nT:With Lyrics\nM:3/4\nK:G\nG2 A B2 c | d3 d3 |\nw: Ho- ly Ho- ly | Lord God |`,
    `X:3\nT:With Gracenotes and Slurs\nM:2/4\nK:D\n{g}A2 (Bc) | d4 |`
];

let passed = 0;
testABCStrings.forEach((abc, idx) => {
    console.log(`\n------------------ Running Test Case ${idx + 1} ------------------`);

    const oldBook = new OldAbcTuneBook(abc);

    // 1. 舊版渲染 (OLD)
    const oldPaper = createMockPaper();
    try {
        const oldParser = new OldAbcParse();
        oldParser.parse(oldBook.tunes[0].abc);
        const oldPrinter = new OldABCPrinter(oldPaper);
        oldPrinter.printABC(oldParser.getTune());
        console.log(`[DEBUG OLD] 順利執行完畢，Log 筆數: ${oldPaper.drawLog.length}`);
    } catch (e) {
        const isBreak = !e || e.name === '$break' || (typeof e === 'object' && Object.keys(e).length === 0);
        if (isBreak) {
            console.log(`[DEBUG OLD] 觸發 Prototype.js $break 正常結束，Log 筆數: ${oldPaper.drawLog.length}`);
        } else {
            console.error(`❌ [OLD Error] 舊版渲染失敗:`, e);
            process.exit(1);
        }
    }

    // 2. 新版渲染 (NEW)
    const newPaper = createMockPaper();
    const SvgClass = newContext.window.Svg || newContext.Svg;
    let printerPaper = newPaper;

    if (SvgClass) {
        const dummyWrapper = newContext.document.createElement('div');
        const realSvgInst = new SvgClass(dummyWrapper);

        printerPaper = new Proxy(realSvgInst, {
            get(target, prop) {
                const origMethod = target[prop];

                if (prop === 'path' && typeof origMethod === 'function') {
                    return function (attr) {
                        const res = origMethod.apply(target, arguments);
                        const pathVal = attr?.path || attr;
                        newPaper.path(pathVal);
                        if (attr && typeof attr === 'object') {
                            newPaper.drawLog[newPaper.drawLog.length - 1].attr = JSON.parse(JSON.stringify(attr));
                        }
                        return res;
                    };
                }

                if (prop === 'text' && typeof origMethod === 'function') {
                    return function (x, y, textStr, attr) {
                        const res = origMethod.apply(target, arguments);
                        newPaper.text(x, y, textStr, attr);
                        return res;
                    };
                }

                return typeof origMethod === 'function' ? origMethod.bind(target) : origMethod;
            }
        });
    }

    // 強制掛載純字串與 Paper
    newContext.__rawAbcString = String(abc);
    newContext.__sandboxPaper = printerPaper;

    console.log(`[DEBUG NEW] 進入沙盒執行 Parse 與 PrintABC...`);

    // 💡 使用 util.inspect 把沙盒內拋出的原型物件徹底拆解！
    const vmResult = vm.runInContext(`
    (function() {
      try {
        var str = String(window.__rawAbcString);
        var ParseClass = window.AbcParse || (window.ABCJS && window.ABCJS.AbcParse);
        var PrinterClass = window.ABCPrinter || (window.ABCJS && window.ABCJS.ABCPrinter);
        
        if (!ParseClass) return { success: false, errDetails: "找不到 AbcParse 類別！" };
        if (!PrinterClass) return { success: false, errDetails: "找不到 ABCPrinter 類別！" };

        var parser = new ParseClass();
        parser.parse(str);
        
        var tune = parser.getTune();
        var printer = new PrinterClass(window.__sandboxPaper);
        printer.printABC(tune);
        
        return { success: true };
      } catch (err) {
        var isBreak = (err === window.$break) || (err && err.name === '$break');
        return {
          success: isBreak,
          isBreak: isBreak,
          rawErr: err
        };
      }
    })()
  `, newContext);

    if (!vmResult.success) {
        console.error(`\n❌ [新版 Parse/Print 真正的錯誤真相]`);
        // 💡 使用 util.inspect 解構深層屬性
        console.error(util.inspect(vmResult.rawErr || vmResult.errDetails, { showHidden: true, depth: null, colors: true }));
        process.exit(1);
    }

    console.log(`[DEBUG NEW] 新版成功繪製！ Log 筆數: ${newPaper.drawLog.length}`);

    // 3. 繪圖日誌比對 (Stage D)
    try {
        deepCompare(oldPaper.drawLog, newPaper.drawLog, `DrawLog[${idx}]`);
        console.log(`✅ Stage D (Renderer Compare) Passed!`);
    } catch (drawErr) {
        console.error(`❌ [Stage D] Renderer Mismatch!`);
        printDrawLogDiff(oldPaper.drawLog, newPaper.drawLog);
        process.exit(1);
    }

    passed++;
});

console.log(`\n✅ All ${passed} test cases passed successfully!`);