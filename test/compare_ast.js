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
const fs = require('fs');
const path = require('path');
const { createBrowserContext, loadJSInContext } = require('./helpers/browserSandbox');
const { createMockPaper } = require('./helpers/mockPaper');
const { createSvgProxy } = require('./helpers/svgProxy');
const { deepCompare, normalizeDrawLog, printDrawLogDiff } = require('./helpers/compareEngine');
const { createFunctionTracer, compareTraces } = require('./helpers/functionTracer');

// 0. 自動建立帶時間戳記的 Log 檔案記錄 (abcTS/test/logs/compare_YYYYMMDD_HHMMSS.log)
const logsDir = path.resolve(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

const now = new Date();
const timestamp = now.getFullYear().toString() +
	String(now.getMonth() + 1).padStart(2, '0') +
	String(now.getDate()).padStart(2, '0') + '_' +
	String(now.getHours()).padStart(2, '0') +
	String(now.getMinutes()).padStart(2, '0') +
	String(now.getSeconds()).padStart(2, '0');

const logFileName = `compare_${timestamp}.log`;
const logFilePath = path.join(logsDir, logFileName);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// 雙向側錄 console.log 與 console.error
const origStdoutWrite = process.stdout.write.bind(process.stdout);
const origStderrWrite = process.stderr.write.bind(process.stderr);

function appendLog(msg) {
	try {
		const cleanMsg = typeof msg === 'string' ? msg.replace(/\x1b\[[0-9;]*m/g, '') : String(msg);
		fs.appendFileSync(logFilePath, cleanMsg);
	} catch (e) { }
}

process.stdout.write = function (chunk, encoding, callback) {
	appendLog(chunk);
	return origStdoutWrite(chunk, encoding, callback);
};

process.stderr.write = function (chunk, encoding, callback) {
	appendLog(chunk);
	return origStderrWrite(chunk, encoding, callback);
};

console.log(`📝 測試結果 log 檔案已建立: file:///${logFilePath.replace(/\\/g, '/')}`);


// 0.5 解析 CLI 參數 (--file, --case, --all, --trace)

const args = process.argv.slice(2).reduce((acc, arg) => {
	const [k, v] = arg.split('=');
	if (k.startsWith('--')) acc[k.replace(/^--/, '')] = v || true;
	return acc;
}, {});

const targetFileName = args.file || (args.all ? 'testABCStrings_copy.js' : 'testABCStrings.js');
const targetFilePath = path.resolve(__dirname, targetFileName);

let testABCStrings = [];
if (fs.existsSync(targetFilePath)) {
	testABCStrings = require(targetFilePath).testABCStrings || [];
} else {
	console.error(`❌ 指定的測試檔案不存在: ${targetFilePath}`);
	process.exit(1);
}

if (args.case) {
	const caseIdx = parseInt(args.case, 10) - 1;
	if (caseIdx >= 0 && caseIdx < testABCStrings.length) {
		testABCStrings = [testABCStrings[caseIdx]];
		console.log(`🎯 僅執行指定的 Case #${args.case}`);
	} else {
		console.error(`❌ 指定的 --case=${args.case} 超出範圍 (總計 ${testABCStrings.length} 個案例)`);
		process.exit(1);
	}
}


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

// 1.5 全量 Function Tracer 自動綁定 (全 class 方法自動攔截入參出參)
const oldTracer = createFunctionTracer();
const newTracer = createFunctionTracer();

if (args.trace) {
	console.log('🔍 啟用 [全量 Function Tracer] 自動動態追蹤與監控...');
	const classesToTrace = [
		'AbcParse',
		// 'ABCPrinter',  'ABCLayout', 'ABCGlyphs',
		// 'ABCStaffGroupElement', 'ABCVoiceElement', 'ABCAbsoluteElement',
		// 'ABCRelativeElement'
	];
	classesToTrace.forEach(cls => {
		if (oldContext[cls] && oldContext[cls].prototype) 
			oldTracer.autoTraceClass(oldContext[cls].prototype, cls);
		if (newContext.window[cls] && newContext.window[cls].prototype) 
			newTracer.autoTraceClass(newContext.window[cls].prototype, cls);
	});
}


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
		console.log('NEW TUNE METATEXT:', newParser.getTune().metaText);
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

	if (args.trace) {
		console.log(`\n🔍 正在進行 Stage T (Function Call Trace Compare)...`);
		compareTraces(oldTracer, newTracer, deepCompare);
	}

	try {
		deepCompare(normalizedOldLog, normalizedNewLog, `DrawLog[TestCase_${idx + 1}]`);
		console.log(`✅ Stage D (Renderer Compare) Passed!`);
		passed++;
	} catch (drawErr) {
		fail++;
		console.error(`❌ [Stage D Mismatch 具體原因]`, drawErr.message);
		printDrawLogDiff(normalizedOldLog, normalizedNewLog);
	}

	// 清理沙盒 DOM 狀態防止狀態殘留與洩漏
	newContext.document.body.clear();
	oldContext.document.body.clear();

});

console.log(`\n✅  ${passed} passed successfully  / ❌  ${fail} fail`);
if (fail > 0) {
	process.exit(1);
}
