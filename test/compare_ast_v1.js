const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================================
// 1. 沙盒環境建置 (Browser Mock Environment)
// ============================================================================
function createBrowserContext() {
  class MockElement { }
  class MockEvent { }

  const sandbox = {
    window: {},
    navigator: { userAgent: "node" },
    document: {
      createElement: () => ({ setAttribute: () => { }, appendChild: () => { }, style: {} }),
      getElementsByTagName: () => [],
      createTextNode: (str) => ({ nodeValue: str || '' }),
      createEvent: () => ({
        initEvent: () => { },
        __proto__: MockEvent.prototype
      }),
      write: () => { },
      getElementById: (id) => (typeof id === 'string' ? { setAttribute: () => { }, appendChild: () => { }, style: {} } : id)
    },
    Event: MockEvent,
    Element: MockElement,
    HTMLElement: class HTMLElement extends MockElement { },
    SVGElement: class SVGElement extends MockElement { },
    console: console
  };

  sandbox.window.window = sandbox.window;
  sandbox.window.Element = sandbox.Element;
  sandbox.window.Event = sandbox.Event;
  sandbox.self = sandbox;

  const context = vm.createContext(sandbox);

  const prototypePath = path.resolve(__dirname, '../../abcjs_20100604/prototype.js');
  if (fs.existsSync(prototypePath)) {
    vm.runInContext(fs.readFileSync(prototypePath, 'utf-8'), context);
  } else {
    console.warn(`⚠️ Warning: prototype.js not found at ${prototypePath}`);
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

    // 模擬 SVG 節點
    const createMockSvgNode = () => ({
        setAttribute: () => { },
        appendChild: () => { },
        style: {},
        childNodes: []
    });

    const mockElement = {
        attr: function (attributes) {
            if (drawLog.length > 0) drawLog[drawLog.length - 1].attr = JSON.parse(JSON.stringify(attributes));
            return this;
        },
        toBack: function () {
            if (drawLog.length > 0) drawLog[drawLog.length - 1].toBack = true;
            return this;
        },
        scale: function (sx, sy, x, y) {
            if (drawLog.length > 0) drawLog[drawLog.length - 1].scale = { sx, sy, x, y };
            return this;
        },
        translate: function (x, y) {
            if (drawLog.length > 0) drawLog[drawLog.length - 1].translate = { x, y };
            return this;
        },
        getBBox: () => ({ x: 0, y: 0, width: 10, height: 10 }),
        mouseup: function () { return this; },
        appendChild: () => { },
        setAttribute: () => { },
        style: {}
    };

    return {
        drawLog,
        // 💡 新版 abcTS 相容介面
        paper: createMockSvgNode(),
        svg: createMockSvgNode(),
        canvas: { parentNode: createMockSvgNode(), style: {} },
        parentElement: createMockSvgNode(),
        clear: function () { },
        setPaper: function (el) { return this; },

        // 繪圖核心方法
        path: (pathVal) => {
            const pathString = (pathVal && typeof pathVal === 'object' && pathVal.path) ? pathVal.path : pathVal;
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
        dottedLine: (attr) => {
            drawLog.push({ type: 'dottedLine', attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
            return mockElement;
        },
        rectBeneath: (attr) => {
            drawLog.push({ type: 'rectBeneath', attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
            return mockElement;
        },
        setSize: (w, h) => drawLog.push({ type: 'setSize', w, h }),
        setResponsiveWidth: (w, h) => drawLog.push({ type: 'setResponsiveWidth', w, h }),
        set: () => ({
            push: () => { },
            attr: (attributes) => {
                drawLog.push({ type: 'setAttr', attr: JSON.parse(JSON.stringify(attributes)) });
                return this;
            },
            scale: (sx, sy, x, y) => {
                drawLog.push({ type: 'setScale', sx, sy, x, y });
                return this;
            },
            mouseup: function () { return this; }
        })
    };
}
// ============================================================================
// 3. 核心比對與 Diff 高亮輔助函式
// ============================================================================
function deepCompare(obj1, obj2, path = '') {
  if (obj1 === undefined && obj2 !== undefined) {
    throw new Error(`Value mismatch at ${path}: old is undefined, new is ${JSON.stringify(obj2)}`);
  }
  if (obj1 !== undefined && obj2 === undefined) {
    throw new Error(`Value mismatch at ${path}: old is ${JSON.stringify(obj1)}, new is undefined`);
  }
  if (typeof obj1 !== typeof obj2) {
    throw new Error(`Type mismatch at ${path}: old is ${typeof obj1}, new is ${typeof obj2}`);
  }
  if (obj1 === null || obj1 === undefined || typeof obj1 !== 'object') {
    if (obj1 !== obj2) {
      throw new Error(`Value mismatch at ${path}: old = ${JSON.stringify(obj1)}, new = ${JSON.stringify(obj2)}`);
    }
    return;
  }
  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2)) throw new Error(`Type mismatch at ${path}: old is Array, new is not`);
    if (obj1.length !== obj2.length) {
      throw new Error(`Array length mismatch at ${path}: old length = ${obj1.length}, new length = ${obj2.length}`);
    }
    for (let i = 0; i < obj1.length; i++) {
      deepCompare(obj1[i], obj2[i], `${path}[${i}]`);
    }
    return;
  }

  const filterKeys = (obj) => {
    return Object.keys(obj).filter(k => {
      if (typeof obj[k] === 'function') return false;
      if (['each', 'strip', 'gsub', 'last'].includes(k)) return false;
      return true;
    }).sort();
  };

  const keys1 = filterKeys(obj1);
  const keys2 = filterKeys(obj2);

  const missingInNew = keys1.filter(k => !keys2.includes(k));
  const extraInNew = keys2.filter(k => !keys1.includes(k));

  if (missingInNew.length > 0) throw new Error(`Missing keys in new AST at ${path}: [${missingInNew.join(', ')}]`);
  if (extraInNew.length > 0) throw new Error(`Extra keys in new AST at ${path}: [${extraInNew.join(', ')}]`);

  for (const key of keys1) {
    deepCompare(obj1[key], obj2[key], `${path}.${key}`);
  }
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
// 4. 模組載入與測試案例執行 (Test Runner)
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

const NewAbcTuneBook = newContext.AbcTuneBook || newContext.window.AbcTuneBook || newContext.window.ABCJS?.AbcTuneBook;
const NewAbcParse = newContext.AbcParse || newContext.window.AbcParse || newContext.window.ABCJS?.AbcParse;
const NewABCPrinter = newContext.ABCPrinter || newContext.window.ABCPrinter || newContext.window.ABCJS?.ABCPrinter;

const testABCStrings = [
  `X:1\nT:Simple Tune\nM:4/4\nK:C\nC D E F|G A B c|`,
  `X:2\nT:With Lyrics\nM:3/4\nK:G\nG2 A B2 c | d3 d3 |\nw: Ho- ly Ho- ly | Lord God |`,
  `X:3\nT:With Gracenotes and Slurs\nM:2/4\nK:D\n{g}A2 (Bc) | d4 |`
];

let passed = 0;
testABCStrings.forEach((abc, idx) => {
  console.log(`\n------------------ Running Test Case ${idx + 1} ------------------`);

  let oldBook, newBook;
  try {
    oldBook = new OldAbcTuneBook(abc);
    newBook = new NewAbcTuneBook(abc);
  } catch (e) {
    console.error(`❌ Parse Error:`, e);
    process.exit(1);
  }

  // 階段 A & B: AST 比對
  try {
    deepCompare(oldBook, newBook, `TuneBook[${idx}]`);
    console.log(`✅ Stage A & B (AST Compare) Passed!`);
  } catch (err) {
    console.error(`❌ [Stage C] AST Mismatch:`, err.message || err);
    process.exit(1);
  }

    // 階段 D: 繪圖渲染比對
    let oldPaper = createMockPaper();
    let newPaper = createMockPaper();

    try {
        const oldParser = new OldAbcParse();
        oldParser.parse(oldBook.tunes[0].abc);
        const oldPrinter = new OldABCPrinter(oldPaper);
        oldPrinter.printABC(oldParser.getTune());

        const newParser = new NewAbcParse();
        newParser.parse(newBook.tunes[0].abc);
        const newPrinter = new NewABCPrinter(newPaper);

        // 💡 如果新版需要呼叫 setPaper
        if (typeof newPrinter.setPaper === 'function') {
            newPrinter.setPaper(newPaper);
        }

        newPrinter.printABC(newParser.getTune());

        // 比對
        deepCompare(oldPaper.drawLog, newPaper.drawLog, `DrawLog[${idx}]`);
        console.log(`✅ Stage D (Renderer Compare) Passed!`);
    } catch (drawErr) {
        console.error(`\n❌ [Stage D] Renderer Mismatch!`);
        printDrawLogDiff(oldPaper.drawLog, newPaper.drawLog);
        process.exit(1);
    }

  passed++;
});

console.log(`\n✅ All ${passed} test cases passed successfully!`);