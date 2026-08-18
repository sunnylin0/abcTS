/**
 * ============================================================================
 * 🎨 Mock 繪圖紙與元素鏈式包裝模組 (mockPaper.js)
 * ============================================================================
 *
 * 【檔案簡介】
 * 本模組負責建立擬真的繪圖畫布 (Mock Paper) 並捕捉所有繪圖指令日誌 (DrawLog)。
 * 
 * 【主要功能與特色】
 *  1. DrawLog 收集器：精確記錄 `path`、`text`、`rect`、`setSize` 等繪圖動作。
 *  2. 鏈式呼叫支援 (Method Chaining)：封裝繪圖元素，確保 `.attr()` 與 `.toBack()` 能順暢連鎖。
 *  3. 臨時元素動態清理：攔截 `.remove()` 動作，自動移除樂譜渲染過程中用於測量寬度的臨時元素紀錄。
 *
 * ============================================================================
 */

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
        circle: (cx, cy, r) => {
            drawLog.push({ type: 'circle', cx, cy, r });
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

function wrapElementWithAttrSync(el, newPaper) {
    if (!el || typeof el !== 'object') return el;
    if (el.__wrapped) return el;
    el.__wrapped = true;

    const origAttr = el.attr;
    if (typeof origAttr === 'function') {
        el.attr = function (attrObj) {
            const res = origAttr.apply(this, arguments);
            if (attrObj && typeof attrObj === 'object') {
                const lastLog = newPaper.drawLog[newPaper.drawLog.length - 1];
                if (lastLog) {
                    if (lastLog.type === 'path' && attrObj.path !== undefined) {
                        lastLog.path = attrObj.path;
                        if (lastLog.path && lastLog.path.toString().includes("314.75")) {
                            console.log(`[TARGET PATH DETECTED] path:`, lastLog.path);
                            console.log(new Error().stack);
                        }
                    }
                    if (!lastLog.attr) lastLog.attr = {};
                    const attrCopy = { ...attrObj };
                    if (attrCopy.path) delete attrCopy.path;
                    Object.assign(lastLog.attr, JSON.parse(JSON.stringify(attrCopy)));
                }
            }
            return wrapElementWithAttrSync(res || this, newPaper);
        };
    }

    const origToBack = el.toBack;
    if (typeof origToBack === 'function') {
        el.toBack = function () {
            const res = origToBack.apply(this, arguments);
            const lastLog = newPaper.drawLog[newPaper.drawLog.length - 1];
            if (lastLog) lastLog.toBack = true;
            return wrapElementWithAttrSync(res || this, newPaper);
        };
    }

    const origRemove = el.remove;
    el.remove = function () {
        let res;
        if (typeof origRemove === 'function') {
            res = origRemove.apply(this, arguments);
        }
        console.log("WRAP_REMOVE POP CALLED! Pre-pop length:", newPaper.drawLog.length);
        if (newPaper.drawLog.length > 0) {
            console.log("POP VALUE:", newPaper.drawLog[newPaper.drawLog.length - 1]);
            newPaper.drawLog.pop();
        }
        return wrapElementWithAttrSync(res || this, newPaper);
    };

    return el;
}

module.exports = { createMockPaper, wrapElementWithAttrSync };