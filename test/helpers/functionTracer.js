/**
 * ============================================================================
 * 🔍 函式追蹤與攔截代理器 (functionTracer.js)
 * ============================================================================
 *
 * 【檔案簡介】
 * 提供 createFunctionTracer() 工具，對指定物件/原型上的函式進行 Monkey Patch 監控，
 * 自動記錄每次執行的「傳入參數 (args)」與「回傳值 (result)」，並提供兩邊 Call Trace 的比對器。
 */

function createFunctionTracer() {
    const logs = [];

    /**
     * 綁定監控目標
     * @param {Object} targetObj 要掛載的物件或 Prototype
     * @param {string} methodName 函式名稱
     * @param {string} label 自訂識別標籤
     */
    function trace(targetObj, methodName, label = methodName) {
        if (!targetObj || typeof targetObj[methodName] !== 'function') {
            return;
        }

        const originalFn = targetObj[methodName];
        targetObj[methodName] = function (...args) {
            const result = originalFn.apply(this, args);
            
            // 深拷貝參數與結果以防被後續修改
            let safeArgs = [];
            let safeResult = null;
            try {
                safeArgs = JSON.parse(JSON.stringify(args));
            } catch (e) {
                safeArgs = args.map(a => String(a));
            }
            try {
                safeResult = result !== undefined ? JSON.parse(JSON.stringify(result)) : undefined;
            } catch (e) {
                safeResult = String(result);
            }

            logs.push({
                label,
                methodName,
                args: safeArgs,
                result: safeResult
            });

            return result;
        };
    }

    function getLogs() {
        return logs;
    }

    function clear() {
        logs.length = 0;
    }

    /**
     * 自動掛載目標物件或 Prototype 上的所有 function
     */
    function autoTraceClass(targetObj, className) {
        if (!targetObj) return;
        const keys = Object.getOwnPropertyNames(targetObj);
        for (const key of keys) {
            if (key !== 'constructor' && typeof targetObj[key] === 'function') {
                trace(targetObj, key, `${className}.${key}`);
            }
        }
    }

    return { trace, autoTraceClass, getLogs, clear };
}


/**
 * 比對舊版與新版的 Function Tracer logs
 */
function compareTraces(oldTracer, newTracer, deepCompareFn) {
    const oldLogs = oldTracer.getLogs();
    const newLogs = newTracer.getLogs();

    console.log(`\n================ 🧪 FUNCTION TRACE COMPARISON 🧪 ================`);
    console.log(`舊版總呼叫次數: ${oldLogs.length} / 新版總呼叫次數: ${newLogs.length}`);

    const maxCount = Math.max(oldLogs.length, newLogs.length);
    let mismatchCount = 0;

    for (let i = 0; i < maxCount; i++) {
        const oldCall = oldLogs[i];
        const newCall = newLogs[i];

        if (!oldCall || !newCall) {
            console.error(`❌ [Trace #${i + 1} 數量不符]`);
            console.error(`  OLD: ${oldCall ? oldCall.label : 'undefined'}`);
            console.error(`  NEW: ${newCall ? newCall.label : 'undefined'}`);
            mismatchCount++;
            break;
        }

        try {
            if (oldCall.label !== newCall.label) {
                throw new Error(`Label mismatch: old=${oldCall.label}, new=${newCall.label}`);
            }
            deepCompareFn(oldCall.args, newCall.args, `Trace[${i}].args (${oldCall.label})`);
            deepCompareFn(oldCall.result, newCall.result, `Trace[${i}].result (${oldCall.label})`);
            console.log(`\x1b[90m  [Trace #${i + 1} MATCH] ${oldCall.label}\x1b[0m`);
        } catch (err) {
            mismatchCount++;
            console.error(`\x1b[33m❌ [Trace #${i + 1} MISMATCH] ${oldCall.label}\x1b[0m`);
            console.error(`  原因: ${err.message}`);
            console.error(`  OLD args:`, JSON.stringify(oldCall.args));
            console.error(`  NEW args:`, JSON.stringify(newCall.args));
            console.error(`  OLD result:`, JSON.stringify(oldCall.result));
            console.error(`  NEW result:`, JSON.stringify(newCall.result));
            break; // 抓到第一個出錯的地方即停下，利於精準除錯
        }
    }
    console.log(`=================================================================\n`);
    return mismatchCount === 0;
}

module.exports = { createFunctionTracer, compareTraces };
