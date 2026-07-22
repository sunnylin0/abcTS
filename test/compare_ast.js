/**
 * ============================================================================
 * 🔍 資料正規化與深度比對引擎模組 (compareEngine.js)
 * ============================================================================
 *
 * 【檔案簡介】
 * 本模組為專案的「驗證核心」，負責將舊版與新版產生的數據進行標準化，並進行嚴格的 100% 精準度比對。
 * 
 * 【主要功能與特色】
 *  1. 深度比對 (deepCompare)：遞迴比對 AST 物件與 DrawLog 陣列，確保 key/value 100% 一致。
 *  2. 終極 Path 正規化 (normalizePathString)：無視 Array/String 格式差異，自動修剪空格並四捨五入浮點數位數（去除微小小數點誤差）。
 *  3. 樣式名稱對映：處理舊版特有屬性（如將 Raphael 的 `text-anchor: "begin"` 對映為標準 SVG `"start"`）。
 *  4. 高亮 Diff 輸出 (printDrawLogDiff)：比對失敗時，精確高亮顯示失配的行號與具體字元差異。
 *
 * ============================================================================
 */
const path = require('path');
const { createBrowserContext, loadJSInContext } = require('./helpers/browserSandbox');
const { createMockPaper } = require('./helpers/mockPaper');
const { createSvgProxy } = require('./helpers/svgProxy');
const { deepCompare, normalizeDrawLog, printDrawLogDiff } = require('./helpers/compareEngine');
const { testABCStrings } = require('./testABCStrings.js');

// 1. 初始化沙盒與載入腳本
const oldContext = createBrowserContext();
const newContext = createBrowserContext();

const oldFiles = [
	'prototype.js', 'sprintf.js', 'abc_glyphs.js', 'abc_graphelements.js',
	'abc_layout.js', 'abc_write.js', 'abc_tunebook.js', 'abc_tokenizer.js',
	'abc_parse_header.js', 'abc_parse.js', 'abc_tune.js'
];

console.log('Loading abcjs_20100604 files...');
oldFiles.forEach(file => loadJSInContext(path.resolve(__dirname, '../../abcjs_20100604', file), oldContext));

console.log('Loading abcTS bundled file...');
loadJSInContext(path.resolve(__dirname, '../dist/abcjs-basic.js'), newContext);

const OldAbcTuneBook = oldContext.AbcTuneBook || oldContext.window.AbcTuneBook;
const OldAbcParse = oldContext.AbcParse || oldContext.window.AbcParse;
const OldABCPrinter = oldContext.ABCPrinter || oldContext.window.ABCPrinter;

const NewAbcTuneBook = newContext.window.AbcTuneBook || newContext.AbcTuneBook;
const NewAbcParse = newContext.window.AbcParse || newContext.AbcParse;
const NewABCPrinter = newContext.window.ABCPrinter || newContext.ABCPrinter;

// 2. 測試執行主流程
let passed = 0;
let fail =0;
testABCStrings.forEach((abc, idx) => {
	console.log(`\n------------------ Running Test Case ${idx + 1} ------------------`);

	const oldBook = new OldAbcTuneBook(abc);
	const newBook = new NewAbcTuneBook(abc);

	// Stage A & B: AST 比對
	deepCompare(oldBook, newBook, `TuneBook[${idx}]`);
	console.log(`✅ Stage A & B (AST Compare) Passed!`);

	// 1. 舊版渲染
	const oldPaper = createMockPaper();
	try {
		const oldParser = new OldAbcParse();
		oldParser.parse(oldBook.tunes[0].abc);
		const oldPrinter = new OldABCPrinter(oldPaper);
		oldPrinter.printABC(oldParser.getTune());
		console.log(`[DEBUG OLD] 順利執行完畢，Log 筆數: ${oldPaper.drawLog.length}`);
	} catch (e) {
		const isBreak = !e || e.name === '$break' || (typeof e === 'object' && Object.keys(e).length === 0);
		if (!isBreak) {
			console.error(`❌ [OLD Error] 舊版渲染失敗:`, e);
			process.exit(1);
		}
	}

	// 2. 新版渲染
	console.log(`\n[DEBUG NEW] 開始執行純 TS 新版解析與渲染...`);
	const newPaper = createMockPaper();
	const dummyWrapper = newContext.document.createElement('div');
	newContext.document.body.appendChild(dummyWrapper);

	const SvgClass = newContext.window.Svg || newContext.Svg;
	const printerPaper = SvgClass
		? createSvgProxy(new SvgClass(dummyWrapper), newPaper, newContext)
		: newPaper;

	try {
		const newParser = new NewAbcParse();
		newParser.parse(newBook.tunes[0].abc);
		const newPrinter = new NewABCPrinter(printerPaper);
		newPrinter.printABC(newParser.getTune());
		console.log(`[DEBUG NEW] 新版成功繪製！ Log 筆數: ${newPaper.drawLog.length}`);
	} catch (err) {
		console.error(`\n❌ [新版 TS Parse/Print 崩潰細節]`, err);
		process.exit(1);
	}

	// Stage D: 繪圖日誌比對
	console.log('OLD Raw First 5 Logs:', oldPaper.drawLog.slice(0, 5));
	console.log('NEW Raw First 5 Logs:', newPaper.drawLog.slice(0, 5));
	const normalizedOldLog = normalizeDrawLog(oldPaper.drawLog);
	const normalizedNewLog = normalizeDrawLog(newPaper.drawLog);
	try {
		deepCompare(normalizedOldLog, normalizedNewLog, `DrawLog[TestCase_${idx + 1}]`);
		console.log(`✅ Stage D (Renderer Compare) Passed!`);
		passed++;
	} catch (drawErr) {
		fail++;
		console.error(`❌ [Stage D Mismatch 具體原因]`, drawErr.message);
		printDrawLogDiff(normalizedOldLog, normalizedNewLog);
	}

});

console.log(`\n✅  ${passed} passed successfully  / ❌  ${fail} fail`);