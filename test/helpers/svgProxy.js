/**
 * ============================================================================
 * 🛡️ SVG Proxy 動態代理與攔截模組 (svgProxy.js)
 * ============================================================================
 *
 * 【檔案簡介】
 * 本模組使用 ES6 `Proxy` 代理新版 `Svg` 繪圖實例，實現無感知的繪圖指令攔截與 Log 同步。
 * 
 * 【主要功能與特色】
 *  1. API 動態攔截：自動捕捉新版 `path()`、`text()`、`setSize()` 等方法呼叫，並同步寫入 DrawLog。
 *  2. 屬性安全防護：讀取未定義屬性（如 `.svg`、`.paper`、`.canvas`）時自動補充 Dummy DOM，防止中途拋出 TypeError。
 *  3. 連鎖方法包裝：將傳回的 SVG 元素自動包裹進屬性同步器中。
 *
 * ============================================================================
 */

const { wrapElementWithAttrSync } = require('./mockPaper');

function createSvgProxy(realSvgInst, newPaper, newContext) {
    return new Proxy(realSvgInst, {
        get(target, prop, receiver) {
            const val = Reflect.get(target, prop, receiver);

            if (prop === 'path' && typeof val === 'function') {
                return function (attr) {
                    const res = val.apply(target, arguments);
                    const pathVal = attr?.path || attr;
                    newPaper.path(pathVal);
                    if (attr && typeof attr === 'object' && newPaper.drawLog.length > 0) {
                        newPaper.drawLog[newPaper.drawLog.length - 1].attr = JSON.parse(JSON.stringify(attr));
                    }
                    return wrapElementWithAttrSync(res, newPaper);
                };
            }

            if (prop === 'text' && typeof val === 'function') {
                return function (x, y, textStr, attr) {
                    const res = val.apply(target, arguments);
                    newPaper.text(x, y, textStr, attr);
                    console.log("PROXY INTERCEPTED TEXT:", textStr);
                    return wrapElementWithAttrSync(res, newPaper);
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

            if (prop === 'closeGroup' && typeof val === 'function') {
                return function () {
                    const res = val.apply(target, arguments);
                    if (!res) return { setAttribute: () => { }, style: {} };
                    return wrapElementWithAttrSync(res, newPaper);
                };
            }

            if (typeof val === 'function') {
                return val.bind(target);
            }

            if (val === undefined || val === null) {
                if (['svg', 'paper', 'parentElement', 'currentGroup', 'canvas'].includes(prop)) {
                    return newContext.document.createElement('div');
                }
            }

            return val;
        }
    });
}

module.exports = { createSvgProxy };