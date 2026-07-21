/**
 * [比較原版 abcjs] 與 [本專案TS] 版 ast 差異
 */

const version = "0.0.4";
const fs = require('fs');
const path = require('path');
const vm = require('vm');
//請寫上原版 abcjs 的目錄
const oldPath = '../../abcjs_20100604'; 

/** 要截入舊專案的 js 檔 */
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


console.log('Compare AST Version: ', version);

// ============================================================================
// 1. 沙盒環境建置 (全功能 Browser & SVG Context)
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
		mouseup() { return this; }
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

	const prototypePath = path.resolve(__dirname, oldPath, 'prototype.js');
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
// 2. 模擬繪圖元件 (萬能 Mock Paper：支援傳給舊版與新版 Svg 實例)
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
		scale: function (sx, sy, x, y) {
			if (drawLog.length > 0) drawLog[drawLog.length - 1].scale = { sx, sy, x, y };
			return this;
		},
		translate: function (x, y) {
			if (drawLog.length > 0) drawLog[drawLog.length - 1].translate = { x, y };
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
		// 相容性屬性
		svg: createDummySvgNode(),
		paper: createDummySvgNode(),
		canvas: { parentNode: createDummySvgNode(), style: {} },
		parentElement: createDummySvgNode(),
		clear: function () { },
		setPaper: function () { return this; },

		// 核心繪圖 API
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
// 3. 比對與高亮比對日誌 (使用 compare_ast_v1.js 的經典格式)
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
// 4. 測試執行模組
// ============================================================================
const oldContext = createBrowserContext();
const newContext = createBrowserContext();


console.log('Loading abcjs_20100604 files...');
oldFiles.forEach(file => loadJSInContext(path.resolve(__dirname, oldPath, file), oldContext));

const OldAbcTuneBook = oldContext.AbcTuneBook || oldContext.window.AbcTuneBook;
const OldAbcParse = oldContext.AbcParse || oldContext.window.AbcParse;
const OldABCPrinter = oldContext.ABCPrinter || oldContext.window.ABCPrinter;

console.log('Loading abcTS bundled file...');
loadJSInContext(path.resolve(__dirname, '../dist/abcjs-basic.js'), newContext);

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

	// 1. 舊版渲染
	const oldPaper = createMockPaper();
	try {
		const oldParser = new OldAbcParse();
		oldParser.parse(oldBook.tunes[0].abc);
		const oldPrinter = new OldABCPrinter(oldPaper);
		oldPrinter.printABC(oldParser.getTune());
	} catch (e) {
		if (e && e.name !== '$break' && Object.keys(e).length > 0) throw e;
	}
	// ============================================================================
	// 2. 新版渲染 (萬能 Proxy 攔截重構版)
	// ============================================================================
	const newPaper = createMockPaper();
	try {
		const newParser = new NewAbcParse();
		newParser.parse(newBook.tunes[0].abc);

		const SvgClass = newContext.window.Svg || newContext.Svg;
		let paperArg = newPaper;

		if (SvgClass) {
			try {
				const dummyWrapper = newContext.document.createElement('div');
				const svgInst = new SvgClass(dummyWrapper);

				// 🎯 建立萬能 Proxy 攔截器，確保新版 Svg 實例上的任何繪圖呼叫都會同步到 newPaper
				paperArg = new Proxy(svgInst, {
					get(target, prop, receiver) {
						// 如果呼叫的是繪圖核心 API，直接攔截並導向 newPaper 的實作
						if (['path', 'text', 'rect', 'dottedLine', 'rectBeneath', 'setSize', 'setResponsiveWidth', 'set'].includes(prop)) {
							return newPaper[prop].bind(newPaper);
						}

						// 其餘屬性或方法，維持原新版 Svg 實例的行為
						const value = Reflect.get(target, prop, receiver);
						return typeof value === 'function' ? value.bind(target) : value;
					}
				});
			} catch (err) {
				paperArg = newPaper;
			}
		}

		const newPrinter = new NewABCPrinter(paperArg);
		newPrinter.printABC(newParser.getTune());
	} catch (e) {
		const isBreakOrEmpty = !e || e.name === '$break' || (typeof e === 'object' && Object.keys(e).length === 0 && !e.message);
		if (!isBreakOrEmpty) {
			console.error(`❌ New Printer Fatal Error:`, e instanceof Error ? e.stack : e);
			process.exit(1);
		}
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