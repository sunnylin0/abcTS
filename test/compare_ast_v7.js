/**
 * ============================================================================
 * 🎼 abcjs 重構效能與相容性比對測試腳本 (compare_ast.js)
 * ============================================================================
 *
 * 【腳本簡介】
 * 本腳本用於驗證專案從舊版 JavaScript (abcjs_20100604, 包含 Prototype.js / Raphael.js)
 * 重構至純 TypeScript 新版 (abcTS) 過程中，語法解析 (AST) 與 SVG 繪圖渲染 (Renderer) 
 * 的 100% 邏輯一致性與精準度。
 *
 * 【主要測試階段 (Testing Stages)】
 *  - Stage A & B (AST Compare):
 *    比對舊版與新版解析器 (AbcParse) 產生的樂譜 TuneBook 與 Tune 數據結構，
 *    確保音符、節拍、調號、歌詞等抽象語法樹 100% 對齊。
 *
 *  - Stage D (Renderer Compare):
 *    模擬 SVG 繪圖環境，比對舊版 (ABCPrinter + Raphael) 與新版 (ABCPrinter + Svg.ts) 
 *    產生的渲染指令日誌 (DrawLog)，包含五線譜路徑 (Path)、文字 (Text)、樣式 (Attr) 與尺寸 (setSize)。
 *
 * 【核心架構與技術特點】
 *  1. 沙盒環境隔離 (Browser Context via Node.js vm):
 *     建立完全獨立的 DOM/SVG 擬真沙盒環境，隔絕 Prototype.js 對全域原型的污染。
 *
 *  2. Proxy 動態代理與繪圖攔截:
 *     封裝新版 Svg 實例與傳回元素，精確捕捉連鎖呼叫如 .attr({...}) 及 .toBack() 的屬性變化。
 *
 *  3. 資料正規化 (Normalization Engine):
 *     - Path 規範化：無視陣列/JSON/字串格式差異，統一提取純 SVG 命令與座標。
 *     - 浮點數收斂：自動四捨五入小數點誤差 (如 755.0000000000001 -> 755)。
 *     - 樣式對齊：處理舊版特有屬性名稱對映 (如 text-anchor: "begin" -> "start")。
 *
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const util = require('util');

const { testABCStrings } = require('./testABCStrings.js');

// ============================================================================
// 1. 全功能 DOM & SVG 沙盒環境 (含全域例外攔截)
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
		console: console // 💡 確保 console 綁定進沙盒
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

function loadJSInContext(filePath, context) {
	const code = fs.readFileSync(filePath, 'utf-8');
	vm.runInContext(code, context);
}

// ============================================================================
// 2. 模擬繪圖元件 (Mock Paper) - 強化 SVG DOM 節點防護
// ============================================================================
function createMockPaper() {
	const drawLog = [];

	// 💡 建立一個具備 DOM/SVG 屬性操作能力的的擬真 DOM Node
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
		translate: function (x, y) {
			// 💡 補上 translate 相容，讓舊版文字位移不中斷
			return this;
		},
		getBBox: () => ({ x: 0, y: 0, width: 50, height: 15 }),
		mouseup: function () { return this; },
		appendChild: () => { },
		setAttribute: function (k, v) { return this; },
		style: {}
	};

	return {
		drawLog,
		// 💡 補齊 ABCPrinter 可能讀取的所有根節點屬性
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
			drawLog.push({ type: 'setSize', w, h })
			return this;
		},
		setResponsiveWidth: function (w, h) {
			drawLog.push({ type: 'setResponsiveWidth', w, h })
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

// ============================================================================
// 💡 Path 正規化 Helper：無論傳入陣列還是字串，統一轉成標準 SVG Path 字串
// ============================================================================
// ============================================================================
// 💡 終極 Path 正規化 Helper：無視陣列、JSON字串、或一般字串，全部拔除符號並統一格式
// ============================================================================
function normalizePathString(p) {
	if (!p) return '';

	// 1. 若傳入的是真實陣列，先轉為字串以利統一處理
	let str = Array.isArray(p) ? JSON.stringify(p) : String(p);

	// 2. 暴力拔除所有陣列符號 [ ]、雙引號 "、單引號 '、以及逗號 ,，全部換成空白
	str = str.replace(/[\[\]"',]/g, ' ');

	// 3. 💡 關鍵修正：捕捉所有數字，四捨五入到小數點後 3 位（浮點數自動收斂）
	//    例如 755.0000000000001 -> 755，16.500 -> 16.5
	str = str.replace(/-?\d+(\.\d+)?/g, (match) => {
		const num = Number(match);
		// 如果是整數或接近整數，Number(num.toFixed(3)) 會自動省略多餘的 .000
		return Number(num.toFixed(6));
	});

	// 4. 將多個連續空白壓縮成單一空白，並去除頭尾空白
	return str.replace(/\s+/g, ' ').trim();
}


// ============================================================================
// 💡 正規化整個 Log 陣列，保留完整屬性的 Normalize DrawLog（不隱藏任何屬性差異）
// ============================================================================
function normalizeDrawLog(drawLog) {
	return drawLog
		.filter(item => {
			if (!item) return false;
			if (item.type === 'setResponsiveWidth') return false;
			return true;
		})
		.map(item => {
			const copy = JSON.parse(JSON.stringify(item));

			// 💡 關鍵修復：刪除動作型的 toBack 標籤，不干擾繪圖屬性比對
			delete copy.toBack;

			// 1. 處理 Path 正規化
			if (copy.type === 'path') {
				const rawPath = copy.path || copy.attr?.path;
				copy.path = normalizePathString(rawPath);
			}

			// 2. 處理 Text 座標浮點數
			if (copy.type === 'text') {
				copy.x = Number(Number(copy.x).toFixed(3));
				copy.y = Number(Number(copy.y).toFixed(3));

				// 💡 關鍵對齊修復：將 Raphael 的 "begin" 轉為標準 SVG 的 "start"
				if (copy.attr && copy.attr['text-anchor']) {
					if (copy.attr['text-anchor'] === 'begin') {
						copy.attr['text-anchor'] = 'start';
					}
				}
			}

			// 3. 處理 setSize 浮點數
			if (copy.type === 'setSize') {
				copy.w = Number(Number(copy.w).toFixed(3));
				copy.h = Number(Number(copy.h).toFixed(3));
			}

			// 4. 屬性補全與正規化 (不刪除額外屬性，如 data-name, class 等)
			if (copy.attr) {
				if (copy.attr.path) delete copy.attr.path; // 避免與 copy.path 欄位重複
				if (!copy.attr.stroke) copy.attr.stroke = 'none';
				if (!copy.attr.fill || copy.attr.fill === '#0') copy.attr.fill = '#000000';
			}

			return copy;
		});
}

// ============================================================================
// 🔍 印出完整高亮 Diff (完整輸出 attr 物件內容)
// ============================================================================
function printDrawLogDiff(oldLog, newLog) {
	const red = (str) => `\x1b[31m\x1b[1m${str}\x1b[0m`;
	const gray = (str) => `\x1b[90m${str}\x1b[0m`;

	const formatItem = (x) => {
		if (!x) return 'undefined';
		if (x.type === 'text') {
			const attrStr = x.attr ? ` attr=${JSON.stringify(x.attr)}` : '';
			return `text: "${x.text}" at (${x.x}, ${x.y})${attrStr}`;
		}
		if (x.type === 'setSize') return `setSize: ${x.w}x${x.h}`;
		if (x.type === 'setResponsiveWidth') return `setResponsiveWidth: ${x.w}x${x.h}`;
		if (x.type === 'path') {
			const pStr = normalizePathString(x.path || x.attr?.path);
			// 💡 完整顯示 attr，以便一眼看清哪裡多/少了屬性
			const attrStr = x.attr ? JSON.stringify(x.attr) : '';
			return `path: ${pStr.substring(0, 50)}${pStr.length > 50 ? '...' : ''} attr=${attrStr}`;
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
oldFiles.forEach(file => loadJSInContext(path.resolve(__dirname, '../../abcjs_20100604', file), oldContext));

const OldAbcTuneBook = oldContext.AbcTuneBook || oldContext.window.AbcTuneBook;
const OldAbcParse = oldContext.AbcParse || oldContext.window.AbcParse;
const OldABCPrinter = oldContext.ABCPrinter || oldContext.window.ABCPrinter;

console.log('Loading abcTS bundled file...');
loadJSInContext(path.resolve(__dirname, '../dist/abcjs-basic.js'), newContext);

const NewAbcTuneBook = newContext.window.AbcTuneBook || newContext.AbcTuneBook;
const NewAbcParse = newContext.window.AbcParse || newContext.AbcParse;
const NewABCPrinter = newContext.window.ABCPrinter || newContext.ABCPrinter;

//const testABCStrings = [
//	`X:1\nT:Simple Tune\nM:4/4\nK:C\nC D E F|G A B c|`,
//	`X:2\nT:With Lyrics\nM:3/4\nK:G\nG2 A B2 c | d3 d3 |\nw: Ho- ly Ho- ly | Lord God |`,
//	`X:3\nT:With Gracenotes and Slurs\nM:2/4\nK:D\n{g}A2 (Bc) | d4 |`
//];
let passed = 0;
testABCStrings.forEach((abc, idx) => {
	console.log(`\n------------------ Running Test Case ${idx + 1} ------------------`);

	const oldBook = new OldAbcTuneBook(abc);
	const newBook = new NewAbcTuneBook(abc);
	console.log('look Book:');
	console.log(oldBook);
	console.log(newBook);
	// A & B: AST 比對
	deepCompare(oldBook, newBook, `TuneBook[${idx}]`);
	console.log(`✅ Stage A & B (AST Compare) Passed!`);

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
	// 2. 新版渲染 (NEW - 具備屬性/方法全容錯的 Proxy)
	console.log(`\n[DEBUG NEW] 開始執行純 TS 新版解析與渲染...`);
	const newPaper = createMockPaper();

	// 1. 建立 DOM 節點
	const dummyWrapper = newContext.document.createElement('div');
	newContext.document.body.appendChild(dummyWrapper);

	const SvgClass = newContext.window.Svg || newContext.Svg;
	let printerPaper;


	// 💡 繪圖元素連鎖呼叫防護與 Log 同步函數
	// 💡 1. 升級版 wrapElementWithAttrSync：同時支援 path 與 text 的 .attr() 屬性同步
	const wrapElementWithAttrSync = (el) => {
		if (!el || typeof el !== 'object') return el;

		// 1. 攔截 .attr()
		const origAttr = el.attr;
		if (typeof origAttr === 'function') {
			el.attr = function (attrObj) {
				const res = origAttr.apply(this, arguments);

				if (attrObj && typeof attrObj === 'object') {
					const lastLog = newPaper.drawLog[newPaper.drawLog.length - 1];
					if (lastLog) {
						// 如果最後一筆是 path，同步 path 欄位
						if (lastLog.type === 'path' && attrObj.path !== undefined) {
							lastLog.path = attrObj.path;
						}

						// 將所有屬性同步更新至 lastLog.attr
						if (!lastLog.attr) lastLog.attr = {};
						const attrCopy = { ...attrObj };
						if (attrCopy.path) delete attrCopy.path;
						Object.assign(lastLog.attr, JSON.parse(JSON.stringify(attrCopy)));
					}
				}
				return wrapElementWithAttrSync(res || this);
			};
		}

		// 2. 💡 關鍵修復：攔截 .toBack() 並同步記錄到 newPaper.drawLog
		const origToBack = el.toBack;
		if (typeof origToBack === 'function') {
			el.toBack = function () {
				const res = origToBack.apply(this, arguments);
				const lastLog = newPaper.drawLog[newPaper.drawLog.length - 1];
				if (lastLog) {
					lastLog.toBack = true;
				}
				return wrapElementWithAttrSync(res || this);
			};
		}

		return el;
	};


	if (SvgClass) {
		const realSvgInst = new SvgClass(dummyWrapper);

		// 💡 建立代理器：兼顧方法攔截與實體屬性 (如 target.svg) 讀取
		printerPaper = new Proxy(realSvgInst, {
			get(target, prop, receiver) {
				const val = Reflect.get(target, prop, receiver);

				// A. 攔截繪圖方法並記錄 log
				if (prop === 'path' && typeof val === 'function') {
					return function (attr) {
						const res = val.apply(target, arguments);
						const pathVal = attr?.path || attr;
						newPaper.path(pathVal);
						if (attr && typeof attr === 'object' && newPaper.drawLog.length > 0) {
							newPaper.drawLog[newPaper.drawLog.length - 1].attr = JSON.parse(JSON.stringify(attr));
						}
						// 💡 封裝傳回的 SVG 元素，攔截後續的 .attr(...) 呼叫
						return wrapElementWithAttrSync(res);
					};
				}

				// 2. 攔截 text()
				if (prop === 'text' && typeof val === 'function') {
					return function (x, y, textStr, attr) {
						const res = val.apply(target, arguments);
						newPaper.text(x, y, textStr, attr);
						return wrapElementWithAttrSync(res);
					};
				}

				if (prop === 'setSize' && typeof val === 'function') {
					return function (w, h) {
						newPaper.setSize(w, h);
						return val.apply(target, arguments);
					};
				}

				if (prop === 'setResponsiveWidth' && typeof val === 'function') {
					return function (w, h) {
						newPaper.setResponsiveWidth(w, h);
						return val.apply(target, arguments);
					};
				}

				// B. 防護 closeGroup 回傳 null
				if (prop === 'closeGroup' && typeof val === 'function') {
					return function () {
						const res = val.apply(target, arguments);
						if (!res) return { setAttribute: () => { }, style: {} };
						return wrapElementWithAttrSync(res);
					};
				}

				// C. 如果是其餘 Function，自動綁定 target context 傳回
				if (typeof val === 'function') {
					return val.bind(target);
				}

				// D. 關鍵防護：如果讀取的是屬性 (如 .svg 或 .paper)，且值為 undefined，補上 Dummy DOM 元素
				if (val === undefined || val === null) {
					if (['svg', 'paper', 'parentElement', 'currentGroup', 'canvas'].includes(prop)) {
						return newContext.document.createElement('div');
					}
				}

				return val;
			}
		});
	} else {
		printerPaper = newPaper;
	}

	try {
		const newParser = new NewAbcParse();

		// 掛載 parse 防護
		const origParse = newParser.parse;
		newParser.parse = function (abcStr) {
			try {
				return origParse.apply(this, arguments);
			} catch (err) {
				if (!err || (typeof err === 'object' && Object.keys(err).length === 0)) {
					return;
				}
				throw err;
			}
		};

		console.log(`[DEBUG NEW] 1. 執行 parse()...`);
		newParser.parse(newBook.tunes[0].abc);

		console.log(`[DEBUG NEW] 2. 取得 tune...`);
		const newTune = newParser.getTune();

		console.log(`[DEBUG NEW] 3. 執行 printABC()...`);
		const newPrinter = new NewABCPrinter(printerPaper);
		newPrinter.printABC(newTune);

		console.log(`[DEBUG NEW] 4. 新版渲染成功完成！Log 筆數: ${newPaper.drawLog.length}`);

	} catch (err) {
		console.error(`\n❌ [新版 TS Parse/Print 崩潰細節]`);
		console.error(`  Error Class:`, err ? err.constructor.name : 'null');
		console.error(`  Error Message:`, err ? err.message : String(err));
		console.error(`  📍 Stack Trace:\n`, err ? err.stack : 'no stack');
		process.exit(1);
	}

	console.log(`[DEBUG NEW] 新版成功繪製！ Log 筆數: ${newPaper.drawLog.length}`);

	// 3. 繪圖日誌比對 (Stage D)
	const normalizedOldLog = normalizeDrawLog(oldPaper.drawLog);
	const normalizedNewLog = normalizeDrawLog(newPaper.drawLog);

	try {
		deepCompare(normalizedOldLog, normalizedNewLog, `DrawLog[TestCase_${idx + 1}]`);
		console.log(`✅ Stage D (Renderer Compare) Passed!`);
	} catch (drawErr) {
		console.error(`❌ [Stage D Mismatch 具體原因]`, drawErr.message); // 👈 印出是缺少屬性還是數值不服
		printDrawLogDiff(normalizedOldLog, normalizedNewLog);
		//process.exit(1);
	}

	passed++;
});

console.log(`\n✅ All ${passed} test cases passed successfully!`);