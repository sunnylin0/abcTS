const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================================
// 1. 沙盒環境建置 (全功能 DOM / SVG Mock Environment)
// ============================================================================
function createBrowserContext() {
	class MockElement {
		constructor(tagName) {
			this.tagName = tagName;
			this.attributes = {};
			this.childNodes = [];
			this.parentNode = null;
			this.style = {};
			this.children = [];
		}
		setAttribute(k, v) { this.attributes[k] = String(v); }
		setAttributeNS(ns, k, v) { this.attributes[k] = String(v); }
		getAttribute(k) { return this.attributes[k]; }
		removeAttribute(k) { delete this.attributes[k]; }
		appendChild(child) {
			child.parentNode = this;
			this.childNodes.push(child);
			if (child.tagName) this.children.push(child);
			return child;
		}
		insertBefore(child, ref) {
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
		getBBox() { return { x: 0, y: 0, width: 10, height: 10 }; }
		addEventListener() { }
	}

	class MockSVGElement extends MockElement { }
	class MockEvent { }

	// 定義 Prototype.js 所需的靈魂變數
	const $break = { name: '$break' };

	const sandbox = {
		$break: $break, // 💡 全域注入 $break，防止未定義報錯
		window: {},
		navigator: { userAgent: "node" },
		document: {
			createElement: (tag) => new MockElement(tag),
			createElementNS: (ns, tag) => new MockSVGElement(tag),
			getElementsByTagName: () => [],
			createTextNode: (str) => ({ nodeValue: str || '', textContent: str || '' }),
			querySelector: () => new MockElement('body'),
			createEvent: () => ({
				initEvent: () => { },
				__proto__: MockEvent.prototype
			}),
			write: () => { },
			getElementById: (id) => new MockElement('div')
		},
		Event: MockEvent,
		Element: MockElement,
		HTMLElement: MockElement,
		SVGElement: MockSVGElement,
		SVGPathElement: class SVGPathElement extends MockSVGElement { },
		SVGTextElement: class SVGTextElement extends MockSVGElement { },
		SVGRectElement: class SVGRectElement extends MockSVGElement { },
		SVGLineElement: class SVGLineElement extends MockSVGElement { },
		SVGGElement: class SVGGElement extends MockSVGElement { },
		SVGSVGElement: class SVGSVGElement extends MockSVGElement { },
		console: console
	};

	sandbox.window.window = sandbox.window;
	sandbox.window.$break = $break;
	sandbox.window.Element = sandbox.Element;
	sandbox.window.SVGElement = sandbox.SVGElement;
	sandbox.window.Event = sandbox.Event;
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
// 2. 舊版專用 MockPaper (Raphael/Canvas 介面)
// ============================================================================
function createOldMockPaper() {
	const drawLog = [];
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
		canvas: { parentNode: { setAttribute: () => { }, style: {} } },
		parentElement: { setAttribute: () => { }, style: {} },
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
// 3. 新版專用：將 SVG DOM 樹轉換為 DrawLog 紀錄
// ============================================================================
function extractNewDrawLogFromSvg(svgElement) {
	const drawLog = [];

	function traverse(node) {
		if (!node || !node.tagName) return;

		if (node.tagName === 'text') {
			const x = parseFloat(node.attributes.x || '0');
			const y = parseFloat(node.attributes.y || '0');
			const textStr = node.childNodes.map(c => c.nodeValue || c.textContent || '').join('');
			drawLog.push({ type: 'text', x, y, text: textStr, attr: { ...node.attributes } });
		} else if (node.tagName === 'path') {
			const pathStr = node.attributes.d || '';
			drawLog.push({ type: 'path', path: pathStr, attr: { ...node.attributes } });
		} else if (node.tagName === 'rect') {
			drawLog.push({ type: 'rect', attr: { ...node.attributes } });
		}

		if (node.childNodes && node.childNodes.length > 0) {
			node.childNodes.forEach(traverse);
		}
	}

	traverse(svgElement);
	return drawLog;
}

// ============================================================================
// 4. 比對與高亮輸出
// ============================================================================
// 6. 深度比對函數 (排除 Prototype.js 內部標籤與迴圈控制屬性)
function deepCompare(obj1, obj2, path = '') {
	if (obj1 === undefined && obj2 !== undefined) throw new Error(`Value mismatch at ${path}: old is undefined, new is defined`);
	if (obj1 !== undefined && obj2 === undefined) throw new Error(`Value mismatch at ${path}: old is defined, new is undefined`);
	if (typeof obj1 !== typeof obj2) throw new Error(`Type mismatch at ${path}: old is ${typeof obj1}, new is ${typeof obj2}`);

	if (obj1 === null || obj1 === undefined || typeof obj1 !== 'object') {
		if (obj1 !== obj2) throw new Error(`Value mismatch at ${path}: old = ${JSON.stringify(obj1)}, new = ${JSON.stringify(obj2)}`);
		return;
	}

	if (Array.isArray(obj1)) {
		if (!Array.isArray(obj2)) throw new Error(`Type mismatch at ${path}: old is Array, new is not`);
		if (obj1.length !== obj2.length) throw new Error(`Array length mismatch at ${path}: old length = ${obj1.length}, new length = ${obj2.length}`);
		for (let i = 0; i < obj1.length; i++) {
			deepCompare(obj1[i], obj2[i], `${path}[${i}]`);
		}
		return;
	}

	// 💡 關鍵修正：過濾 Prototype.js 注入的原型屬性與內部變數
	const isIgnoredKey = (k, targetObj) => {
		// 忽略 function
		if (typeof targetObj[k] === 'function') return true;
		// 忽略 Prototype.js 注入的全域或陣列/物件屬性
		const prototypeJsKeys = [
			'each', '_each', 'strip', 'gsub', 'last',
			'$break', '$continue', 'include', 'detect',
			'collect', 'select', 'reject', 'all', 'any'
		];
		if (prototypeJsKeys.includes(k)) return true;
		return false;
	};

	const filterKeys = (obj) => Object.keys(obj).filter(k => !isIgnoredKey(k, obj)).sort();

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
		if (x.type === 'path') return `path: ${String(x.path).substring(0, 50)}...`;
		return JSON.stringify(x);
	};

	console.log('\n================ 🔍 DRAW LOG DIFF 🔍 ================');
	const maxCount = Math.max(oldLog.length, newLog.length);
	for (let i = 0; i < maxCount; i++) {
		const itemOld = formatItem(oldLog[i]);
		const itemNew = formatItem(newLog[i]);
		if (itemOld !== itemNew) {
			console.log(`\x1b[33m[Line ${i} MISMATCH]\x1b[0m`);
			console.log(`  ${gray('OLD:')} ${itemOld}`);
			console.log(`  ${gray('NEW:')} ${red(itemNew)}`);
		} else {
			console.log(gray(`  [${i} MATCH] ${itemOld}`));
		}
	}
	console.log('=====================================================\n');
}

// ============================================================================
// 5. 測試主執行流程
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
// 💡 印出新版 UMD 匯出的變數結構
console.log('newContext.ABCJS keys:', newContext.window.ABCJS ? Object.keys(newContext.window.ABCJS) : 'ABCJS undefined');
console.log('newContext window keys:', Object.keys(newContext.window).filter(k => !['window', 'self', 'document', 'navigator', 'Element', 'Event'].includes(k)));


const NewAbcTuneBook = newContext.window.AbcTuneBook || newContext.AbcTuneBook;
const NewAbcParse = newContext.window.AbcParse || newContext.AbcParse;
const NewABCPrinter = newContext.window.ABCPrinter || newContext.ABCPrinter;

const testABCStrings = [
	`X:1\nT:Simple Tune\nM:4/4\nK:C\nC D E F|G A B c|`,
	`X:2\nT:With Lyrics\nM:3/4\nK:G\nG2 A B2 c | d3 d3 |\nw: Ho- ly Ho- ly | Lord God |`,
	`X:3\nT:With Gracenotes and Slurs\nM:2/4\nK:D\n{g}A2 (Bc) | d4 |`
];

let passed = 0;
testABCStrings.forEach((abc, idx) => {
	console.log(`\n------------------ Running Test Case ${idx + 1} ------------------`);

	const oldBook = new OldAbcTuneBook(abc);
	const newBook = new NewAbcTuneBook(abc);

	// AST 比對
	deepCompare(oldBook, newBook, `TuneBook[${idx}]`);
	console.log(`✅ Stage A & B (AST Compare) Passed!`);

	// Stage D 渲染部分 繪圖渲染比對
	const oldPaper = createOldMockPaper();

	// 1. 執行舊版渲染 (攔截 Prototype.js 的 $break 正常退出)
	try {
		const oldParser = new OldAbcParse();
		oldParser.parse(oldBook.tunes[0].abc);
		const oldPrinter = new OldABCPrinter(oldPaper);
		oldPrinter.printABC(oldParser.getTune());
	} catch (e) {
		if (e && e.name === '$break') {
			// 這代表 Prototype.js 正常中斷迴圈，忽略此例外
		} else {
			console.error(`❌ Old Printer Error:`, e);
			process.exit(1);
		}
	}

	// 2. 執行新版渲染
	let newDrawLog = [];
	try {
		const wrapper = newContext.document.createElement('div');
		const SvgClass = newContext.window.Svg || newContext.Svg;
		let newSvgPaper;

		if (SvgClass) {
			newSvgPaper = new SvgClass(wrapper);
		} else {
			newSvgPaper = newContext.document.createElementNS("http://www.w3.org/2000/svg", "svg");
		}

		const newParser = new NewAbcParse();
		newParser.parse(newBook.tunes[0].abc);
		const newPrinter = new NewABCPrinter(newSvgPaper);
		newPrinter.printABC(newParser.getTune());

		newDrawLog = extractNewDrawLogFromSvg(newSvgPaper.svg || newSvgPaper);
	} catch (e) {
		if (e && e.name === '$break') {
			// 忽略 Prototype.js $break
		} else {
			console.error(`❌ New Printer Error:`, e);
			process.exit(1);
		}
	}

	// 3. 比對兩者產生的 DrawLog
	try {
		deepCompare(oldPaper.drawLog, newDrawLog, `DrawLog[${idx}]`);
		console.log(`✅ Stage D (Renderer Compare) Passed!`);
	} catch (drawErr) {
		console.error(`❌ [Stage D] Renderer Mismatch!`);
		printDrawLogDiff(oldPaper.drawLog, newDrawLog);
		process.exit(1);
	}

	passed++;
});

console.log(`\n✅ All ${passed} test cases passed successfully!`);