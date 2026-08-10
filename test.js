const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================================
// 🌐 瀏覽器沙盒與 DOM 擬真環境 (Sandbox)
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
        clear() {
            this.childNodes = [];
            this.children = [];
            this.textContent = '';
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
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout
    };

    sandbox.window.window = sandbox.window;
    sandbox.window.document = sandbox.document;
    sandbox.window.console = console;
    sandbox.window.$break = $break;
    sandbox.window.Element = sandbox.Element;
    sandbox.window.SVGElement = sandbox.SVGElement;
    sandbox.self = sandbox;

    return vm.createContext(sandbox);
}

// ============================================================================
// 🎨 Mock 繪圖紙與元素鏈式包裝 (Mock Paper)
// ============================================================================
function createMockPaper() {
    const drawLog = [];

    const createDummySvgNode = (tag = 'svg') => {
        const node = {
            tagName: tag,
            style: {},
            attributes: {},
            childNodes: [],
            parentNode: null,
            setAttribute: function (k, v) { this.attributes[k] = String(v); return this; },
            setAttributeNS: function (ns, k, v) { this.attributes[k] = String(v); return this; },
            getAttribute: function (k) { return this.attributes[k]; },
            removeAttribute: function (k) { delete this.attributes[k]; },
            appendChild: function (child) { if (child) child.parentNode = this; this.childNodes.push(child); return child; },
            insertBefore: function (child) { if (child) child.parentNode = this; this.childNodes.unshift(child); return child; },
            removeChild: function (child) { return child; },
            getBBox: () => ({ x: 0, y: 0, width: 50, height: 15 })
        };
        node.parentNode = node;
        return node;
    };

    const dummySvg = createDummySvgNode('svg');

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
        translate: function (x, y) { return this; },
        getBBox: () => ({ x: 0, y: 0, width: 50, height: 15 }),
        mouseup: function () { return this; },
        appendChild: () => { },
        setAttribute: function (k, v) { return this; },
        style: {},
        remove: function () {
            if (drawLog.length > 0) drawLog.pop();
            return this;
        }
    };

    return {
        drawLog,
        svg: dummySvg,
        paper: dummySvg,
        canvas: { parentNode: dummySvg, style: {} },
        parentElement: dummySvg,
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
        setSize: function (w, h) {
            drawLog.push({ type: 'setSize', w, h });
            return this;
        },
        setResponsiveWidth: function (w, h) {
            drawLog.push({ type: 'setResponsiveWidth', w, h });
            return this;
        },
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
// 🚀 測試執行主邏輯
// ============================================================================
try {
    console.log('🔄 [abcTS] 正在初始化沙盒環境...');
    const context = createBrowserContext();

    console.log('📦 正在載入 abcTS 打包腳本 (dist/abcjs-basic.js)...');
    const filePath = path.resolve(__dirname, 'dist/abcjs-basic.js');
    if (!fs.existsSync(filePath)) {
        throw new Error(`❌ 打包後的檔案不存在，請先執行 pnpm run build：${filePath}`);
    }
    const code = fs.readFileSync(filePath, 'utf-8');
    vm.runInContext(code, context);

    // 取得沙盒內建的建構子
    const rawAbcTuneBook = context.AbcTuneBook || context.window.AbcTuneBook;
    const rawAbcParse = context.AbcParse || context.window.AbcParse;
    const rawABCPrinter = context.ABCPrinter || context.window.ABCPrinter;

    if (!rawAbcTuneBook || !rawAbcParse || !rawABCPrinter) {
        throw new Error('❌ 未能從沙盒中成功取得核心建構子 (AbcTuneBook, AbcParse, ABCPrinter)');
    }

    // 將類別掛載至 global，打通 register.ts / fun-tracer 的 Monkey Patch 監聽通道
    global.AbcTuneBook = rawAbcTuneBook;
    global.AbcParse = rawAbcParse;
    global.ABCPrinter = rawABCPrinter;

    // 重新從 global 拿回可能已經被 Monkey Patch 的建構子
    const AbcTuneBook = global.AbcTuneBook || rawAbcTuneBook;
    const AbcParse = global.AbcParse || rawAbcParse;
    const ABCPrinter = global.ABCPrinter || rawABCPrinter;

    console.log('🎵 正在解析測試樂譜 (Cooley\'s)...');
    const testAbc = `X: 1
T: Cooley's
M: 4/4
L: 1/8
R: reel
K: Emin
|:D2|EB{c}BA B2 EB|~B2 AB dBAG|FDAD BDAD|FDAD dAFD|
EBBA B2 EB|B2 AB defg|afe^c dBAF|DEFD E2:|
|:gf|eB B2 efge|eB B2 gedB|A2 FA DAFA|A2 FA defg|
eB B2 eBgB|eB B2 defg|afe^c dBAF|DEFD E2:|`;

    const book = new AbcTuneBook(testAbc);
    
    // 斷言：樂譜數量應該是 1
    if (book.tunes.length !== 1) {
        throw new Error(`預期的樂譜數量為 1，但得到: ${book.tunes.length}`);
    }

    const parser = new AbcParse();
    parser.parse(book.tunes[0].abc);
    const tune = parser.getTune();

    console.log(`\n✨ 成功解析樂譜："${tune.metaText.title}"`);

    console.log('🎨 正在模擬渲染樂譜...');
    const mockPaper = createMockPaper();
    const printer = new ABCPrinter(mockPaper);
    printer.printABC(tune);

    console.log(`📊 渲染完成，總繪圖日誌 (DrawLog) 筆數: ${mockPaper.drawLog.length}`);
    
    // 斷言：DrawLog 應該有寫入數據
    if (mockPaper.drawLog.length === 0) {
        throw new Error('❌ 繪圖日誌為空，表示渲染並未被正確觸發！');
    }

    // 檢查是否有警告資訊
    const warnings = parser.getWarnings() || [];
    if (warnings.length > 0) {
        console.warn('⚠️ 解析時產生了警告訊息：', warnings);
    } else {
        console.log('🎉 樂譜解析無任何警告或錯誤。');
    }

    console.log('\n=================================================');
    console.log('✅  ABCJS (TS 版本) 核心功能 Node.js 測試通過！');
    console.log('=================================================');
    process.exit(0);

} catch (err) {
    console.error('\n❌ 測試執行失敗：', err);
    process.exit(1);
}
