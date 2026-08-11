// test-jianpu-helpers.js
// 共用測試工具薄轉接層，重導向至 test/helpers/ 正式模組。
const { createBrowserContext, loadJSInContext } = require('./test/helpers/browserSandbox');
const { createMockPaper } = require('./test/helpers/mockPaper');

module.exports = { createBrowserContext, loadJSInContext, createMockPaper };
