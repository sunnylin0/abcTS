const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 1. 建立獨立的瀏覽器模擬環境
function createBrowserContext() {
  // 💡 建立假的 Element 類別 (給 Prototype.js 擴充用)
  class MockElement { }
  class MockEvent { } // 💡 Mock Event 類別

  const sandbox = {
    window: {},
    navigator: { userAgent: "node" },
    document: {
      createElement: () => ({ setAttribute: () => { }, appendChild: () => { }, style: {} }),
      getElementsByTagName: () => [],
      createTextNode: (str) => ({ nodeValue: str || '' }),
      // 💡 補上 createEvent，回傳包含 initEvent 方法與原型鏈的 Event 物件
      createEvent: () => ({
        initEvent: () => { },
        __proto__: MockEvent.prototype
      }),
      write: () => { },
      getElementById: (id) => typeof id === 'string' ? { setAttribute: () => { }, appendChild: () => { }, style: {} } : id
    },
    Event: MockEvent,
    Element: MockElement,
    HTMLElement: class HTMLElement extends MockElement { },
    SVGElement: class SVGElement extends MockElement { },
    console: console
  };
  sandbox.window.window = sandbox.window;
  sandbox.window.Element = sandbox.Element;
  sandbox.window.Event = sandbox.Event; // 讓 window.Event 也能存取到
  sandbox.self = sandbox;

  const context = vm.createContext(sandbox);

  // 載入原版的 prototype.js
  const prototypePath = path.resolve(__dirname, '../../abcjs_20100604/prototype.js');

  if (fs.existsSync(prototypePath)) {
    const prototypeCode = fs.readFileSync(prototypePath, 'utf-8');
    vm.runInContext(prototypeCode, context);
  } else {
    console.warn(`⚠️ Warning: prototype.js not found at ${prototypePath}`);
  }

  return context;
}

const oldContext = createBrowserContext();
const newContext = createBrowserContext();

function loadJSInContext(filePath, context) {
  const code = fs.readFileSync(filePath, 'utf-8');
  vm.runInContext(code, context);
}

// 2. 載入 abcjs_20100604 的核心解析與渲染代碼
const oldFiles = [
  'prototype.js',
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
oldFiles.forEach(file => {
  loadJSInContext(path.resolve(__dirname, '../../abcjs_20100604', file), oldContext);
});

const OldAbcTuneBook = oldContext.AbcTuneBook || oldContext.window.AbcTuneBook;
const OldAbcParse = oldContext.AbcParse || oldContext.window.AbcParse;
const OldABCPrinter = oldContext.ABCPrinter || oldContext.window.ABCPrinter;

// 3. 載入 abcTS 打包後的 umd bundle
console.log('Loading abcTS bundled file...');
loadJSInContext(path.resolve(__dirname, '../dist/abcjs-basic.js'), newContext);

const NewAbcTuneBook = newContext.AbcTuneBook || newContext.window.AbcTuneBook || (newContext.window.ABCJS && newContext.window.ABCJS.AbcTuneBook);
const NewAbcParse = newContext.AbcParse || newContext.window.AbcParse || (newContext.window.ABCJS && newContext.window.ABCJS.AbcParse);
const NewABCPrinter = newContext.ABCPrinter || newContext.window.ABCPrinter || (newContext.window.ABCJS && newContext.window.ABCJS.ABCPrinter);
const NewAbcSpacing = newContext.AbcSpacing || newContext.window.AbcSpacing || (newContext.window.ABCJS && newContext.window.ABCJS.AbcSpacing);
newContext.AbcSpacing = NewAbcSpacing;
const NewSprintf = newContext.sprintf || newContext.window.sprintf || (newContext.window.ABCJS && newContext.window.ABCJS.sprintf);
newContext.sprintf = NewSprintf;

// 4. 準備測試用 ABC 樂譜字串
const testABCStrings = [
  `X:1\nT:Simple Tune\nM:4/4\nK:C\nC D E F|G A B c|`,
  `X:2\nT:With Lyrics\nM:3/4\nK:G\nG2 A B2 c | d3 d3 |\nw: Ho- ly Ho- ly | Lord God |`,
  `X:3\nT:With Gracenotes and Slurs\nM:2/4\nK:D\n{g}A2 (Bc) | d4 |`
];

// 5. 模擬視覺呈現 MockPaper，用以收集與比對繪圖命令
function createMockPaper() {
  const drawLog = [];
  const mockElement = {
    attr: function (attributes) {
      if (drawLog.length > 0) {
        // 深拷貝 attributes 避免引用與副作用問題，並將其記錄在最尾項
        drawLog[drawLog.length - 1].attr = JSON.parse(JSON.stringify(attributes));
      }
      return this;
    },
    toBack: function () {
      if (drawLog.length > 0) {
        drawLog[drawLog.length - 1].toBack = true;
      }
      return this;
    },
    scale: function (sx, sy, x, y) {
      if (drawLog.length > 0) {
        drawLog[drawLog.length - 1].scale = { sx, sy, x, y };
      }
      return this;
    },
    getBBox: function () {
      return { x: 0, y: 0, width: 10, height: 10 };
    },
    mouseup: function (fn) { return this; },
    translate: function (x, y) {
      if (drawLog.length > 0) {
        drawLog[drawLog.length - 1].translate = { x, y };
      }
      return this;
    },
    appendChild: function () { },
    setAttribute: function () { },
    style: {}
  };

  return {
    drawLog,
    canvas: {
      parentNode: {
        setAttribute: function () { },
        style: {}
      }
    },
    parentElement: {
      setAttribute: function () { },
      style: {}
    },
    path: function (pathVal) {
      let pathString = pathVal;
      if (pathVal && typeof pathVal === 'object' && pathVal.path) {
        pathString = pathVal.path;
      }
      drawLog.push({ type: 'path', path: pathString });
      return mockElement;
    },
    text: function (x, y, textStr, attr) {
      drawLog.push({ type: 'text', x, y, text: textStr, attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
      return mockElement;
    },
    rect: function (attr) {
      drawLog.push({ type: 'rect', attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
      return mockElement;
    },
    dottedLine: function (attr) {
      drawLog.push({ type: 'dottedLine', attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
      return mockElement;
    },
    rectBeneath: function (attr) {
      drawLog.push({ type: 'rectBeneath', attr: attr ? JSON.parse(JSON.stringify(attr)) : undefined });
      return mockElement;
    },
    setSize: function (w, h) {
      drawLog.push({ type: 'setSize', w, h });
    },
    setResponsiveWidth: function (w, h) {
      drawLog.push({ type: 'setResponsiveWidth', w, h });
    },
    set: function () {
      const setLog = [];
      const setMock = {
        push: function (el) {
          setLog.push(el);
        },
        attr: function (attributes) {
          drawLog.push({ type: 'setAttr', attr: JSON.parse(JSON.stringify(attributes)) });
          return this;
        },
        scale: function (sx, sy, x, y) {
          drawLog.push({ type: 'setScale', sx, sy, x, y });
          return this;
        },
        mouseup: function (fn) { return this; }
      };
      return setMock;
    }
  };
}

// 6. 深度比對函數 (忽略 prototype 與 function)
function deepCompare(obj1, obj2, path = '') {
  if (typeof obj1 !== typeof obj2) {
    throw new Error(`Type mismatch at ${path}: old is ${typeof obj1}, new is ${typeof obj2}`);
  }
  if (obj1 === null || obj1 === undefined || typeof obj1 !== 'object') {
    if (obj1 !== obj2) {
      throw new Error(`Value mismatch at ${path}: old = "${obj1}", new = "${obj2}"`);
    }
    return;
  }
  if (Array.isArray(obj1)) {
    if (!Array.isArray(obj2)) throw new Error(`Type mismatch at ${path}: old is Array, new is not`);
    if (obj1.length !== obj2.length) {
      throw new Error(`Array length mismatch at ${path}: old length = ${obj1.length}, new = ${obj2.length}`);
    }
    for (let i = 0; i < obj1.length; i++) {
      deepCompare(obj1[i], obj2[i], `${path}[${i}]`);
    }
    return;
  }
  const keys1 = Object.keys(obj1).filter(k => typeof obj1[k] !== 'function').sort();
  const keys2 = Object.keys(obj2).filter(k => typeof obj2[k] !== 'function').sort();

  // 檢查 key 是否一致
  const missingInNew = keys1.filter(k => !keys2.includes(k));
  const extraInNew = keys2.filter(k => !keys1.includes(k));
  if (missingInNew.length > 0) throw new Error(`Missing keys in new AST at ${path}: ${missingInNew.join(', ')}`);
  if (extraInNew.length > 0) throw new Error(`Extra keys in new AST at ${path}: ${extraInNew.join(', ')}`);

  for (const key of keys1) {
    deepCompare(obj1[key], obj2[key], `${path}.${key}`);
  }
}

// 7. 執行測試
let passed = 0;
testABCStrings.forEach((abc, idx) => {
  try {
    // A. 驗證文字解析 (Parser) AST 一致性
    const oldBook = new OldAbcTuneBook(abc);
    const newBook = new NewAbcTuneBook(abc);
    deepCompare(oldBook, newBook, `TuneBook[${idx}]`);

    // B. 驗證視覺呈現 (Renderer) 渲染輸出一致性
    const oldParser = new OldAbcParse();
    oldParser.parse(oldBook.tunes[0].abc);
    const oldTune = oldParser.getTune();

    const newParser = new NewAbcParse();
    newParser.parse(newBook.tunes[0].abc);
    const newTune = newParser.getTune();

    const oldPaper = createMockPaper();
    const oldPrinter = new OldABCPrinter(oldPaper);
    oldPrinter.printABC(oldTune);

    const newPaper = createMockPaper();
    const newPrinter = new NewABCPrinter(newPaper);
    newPrinter.printABC(newTune);

    try {
      deepCompare(oldPaper.drawLog, newPaper.drawLog, `DrawLog[${idx}]`);
    } catch (compareErr) {
      // 1. 定義顏色控制碼
      const red = (str) => `\x1b[31m\x1b[1m${str}\x1b[0m`;    // 亮紅色 (不同處)
      const green = (str) => `\x1b[32m\x1b[1m${str}\x1b[0m`;  // 亮綠色
      const gray = (str) => `\x1b[90m${str}\x1b[0m`;         // 灰色 (相同處)

      // 2. 格式化 Single Item 轉為純字串
      const formatItem = (x) => {
        if (!x) return 'undefined';
        if (x.type === 'text') return `text: "${x.text}" at (${x.x}, ${x.y})`;
        if (x.type === 'setSize') return `setSize: ${x.w}x${x.h}`;
        if (x.type === 'setResponsiveWidth') return `setResponsiveWidth: ${x.w}x${x.h}`;
        if (x.type === 'path') {
          let p = '';
          if (x.path) {
            p = typeof x.path === 'string' ? x.path : JSON.stringify(x.path).substring(0, 40) + '...';
          } else if (x.attr && x.attr.path) {
            p = x.attr.path;
          }
          const stroke = (x.attr && x.attr.stroke) || 'none';
          const fill = (x.attr && x.attr.fill) || '#0';
          return `path: ${String(p).substring(0, 60)} (stroke=${stroke}, fill=${fill})`;
        }
        return JSON.stringify(x);
      };

      // 3. 字串逐字比對高亮函數 (只亮紅不同之處)
      const highlightDiff = (strOld, strNew) => {
        let diffOld = '';
        let diffNew = '';
        const maxLen = Math.max(strOld.length, strNew.length);

        for (let i = 0; i < maxLen; i++) {
          const charOld = strOld[i] || '';
          const charNew = strNew[i] || '';

          if (charOld === charNew) {
            diffOld += charOld;
            diffNew += charNew;
          } else {
            diffOld += charOld ? red(charOld) : '';
            diffNew += charNew ? red(charNew) : '';
          }
        }
        return { diffOld, diffNew };
      };

      // 4. 輸出高亮後的 Logs
      console.log('\n================ 🔍 DRAW LOG DIFF 🔍 ================');
      const maxCount = Math.max(oldPaper.drawLog.length, newPaper.drawLog.length);

      for (let i = 0; i < maxCount; i++) {
        const itemOld = formatItem(oldPaper.drawLog[i]);
        const itemNew = formatItem(newPaper.drawLog[i]);

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

      throw compareErr;
    }

    passed++;
  } catch (err) {
    console.error(`❌ Test case ${idx + 1} failed:`, err.stack);
    process.exit(1);
  }
});

console.log(`\n\n✅ All ${passed} AST and Renderer compare test cases passed!`);
