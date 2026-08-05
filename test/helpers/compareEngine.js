/**
 * ============================================================================
 * 🎼 abcjs 重構效能與相容性比對測試主腳本 (compare_ast.js)
 * ============================================================================
 *
 * 【檔案簡介】
 * 本檔案為 abcjs 重構至 abcTS 測試套件的「主流程控制器」。負責整合 DOM 沙盒、
 * Mock 紙張、SVG Proxy 代理與比較引擎，依序對 ABC 樂譜進行 AST 語法樹與 SVG 繪圖
 * 指令（DrawLog）的 100% 精準度比對。
 *
 * 【執行階段 (Testing Stages)】
 *  - Stage A & B (AST Compare): TuneBook / Tune 數據結構 100% 完全對齊。
 *  - Stage D (Renderer Compare): 繪圖指令、座標、樣式屬性 100% 完全對齊。
 *
 * ============================================================================
 */

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

function normalizePathString(p) {
    if (!p) return '';
    let str = Array.isArray(p) ? JSON.stringify(p) : String(p);
    str = str.replace(/[\[\]"',]/g, ' ');
    str = str.replace(/-?\d+(\.\d+)?/g, (match) => {
        const num = Number(match);
        return Number(num.toFixed(4));
    });
    return str.replace(/\s+/g, ' ').trim();
}

function normalizeDrawLog(drawLog) {
    return drawLog
        .filter(item => item && item.type !== 'setResponsiveWidth')
        .map(item => {
            const copy = JSON.parse(JSON.stringify(item));
            delete copy.toBack;

            if (copy.type === 'path') {
                const rawPath = copy.path || copy.attr?.path;
                copy.path = normalizePathString(rawPath);
            }

            if (copy.type === 'text') {
                copy.x = Number(Number(copy.x).toFixed(4));
                copy.y = Number(Number(copy.y).toFixed(4));
                if (copy.attr && copy.attr['text-anchor'] === 'begin') {
                    copy.attr['text-anchor'] = 'start';
                }
            }

            if (copy.type === 'setSize') {
                copy.w = Number(Number(copy.w).toFixed(4));
                copy.h = Number(Number(copy.h).toFixed(4));
            }


            if (copy.attr) {
                if (copy.attr.path) delete copy.attr.path;
                if (!copy.attr.stroke) copy.attr.stroke = 'none';
                if (!copy.attr.fill || copy.attr.fill === '#0') copy.attr.fill = '#000000';
            }

            return copy;
        });
}

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

module.exports = { deepCompare, normalizeDrawLog, printDrawLogDiff };