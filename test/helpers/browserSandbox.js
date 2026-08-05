/**
 * ============================================================================
 * 🌐 瀏覽器沙盒與 DOM 擬真環境模組 (browserSandbox.js)
 * ============================================================================
 *
 * 【檔案簡介】
 * 本模組利用 Node.js 原生的 `vm` (Virtual Machine) 模組，建立完全獨立且物理隔離的 
 * DOM/SVG 沙盒環境。
 * 
 * 【主要功能與特色】
 *  1. 原型隔離 (Prototype Isolation)：
 *     完全隔絕舊版 `Prototype.js` 對全域 Array/String/Object 原型的污染。
 *  2. DOM/SVG Mock API：
 *     提供擬真的 `MockElement`、`document` 與 `window` 物件，確保樂譜解析器與繪圖庫
 *     在無真實瀏覽器環境下依然能正常執行。
 *
 * ============================================================================
 */

const fs = require('fs');
const vm = require('vm');

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
        clear() {
            this.childNodes = [];
            this.children = [];
            this.textContent = '';
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
        console: console
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

module.exports = { createBrowserContext, loadJSInContext };