const fs = require("fs"), path = require("path"), vm = require("vm");
class ME {
    constructor(t){this.tagName=t;this.attributes={};this.childNodes=[];this.children=[];this.style={};}
    setAttribute(k,v){this.attributes[k]=String(v);return this;}
    setAttributeNS(ns,k,v){this.attributes[k]=String(v);return this;}
    getAttribute(k){return this.attributes[k];}
    removeAttribute(k){delete this.attributes[k];}
    appendChild(c){if(c){c.parentNode=this;this.childNodes.push(c);if(c.tagName)this.children.push(c);}return c;}
    insertBefore(c){if(c){c.parentNode=this;this.childNodes.unshift(c);}return c;}
    removeChild(c){return c;}
    getBBox(){return{x:0,y:0,width:50,height:15};}
    addEventListener(){}
    mouseup(){return this;}
    attr(a){if(a)for(const k in a)this.setAttribute(k,a[k]);return this;}
    toBack(){return this;}
    clear(){this.childNodes=[];this.children=[];return this;}
}
const mb = new ME("body");
const sandbox = {
    window:{}, navigator:{userAgent:"node"},
    document:{
        body:mb, createElement:t=>new ME(t), createElementNS:(ns,t)=>new ME(t),
        getElementsByTagName:t=>t==="body"?[mb]:[], createTextNode:s=>({nodeValue:s,textContent:s}),
        querySelector:sel=>sel==="body"?mb:new ME("div"), createEvent:()=>({initEvent:()=>{}}),
        write:()=>{}, getElementById:id=>new ME("div")
    },
    Event:class{}, Element:ME, HTMLElement:ME, SVGElement:ME, SVGPathElement:ME,
    SVGTextElement:ME, SVGRectElement:ME, SVGLineElement:ME, SVGGElement:ME, SVGSVGElement:ME,
    console, setTimeout, clearTimeout
};
sandbox["$break"] = {name:"$break"};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.console = console;
sandbox.window["$break"] = sandbox["$break"];
sandbox.window.Element = ME;
sandbox.window.SVGElement = ME;
sandbox.self = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "dist/abcjs-basic.js"), "utf-8"), ctx);
const AbcTuneBook = ctx.AbcTuneBook || ctx.window.AbcTuneBook;
const AbcParse = ctx.AbcParse || ctx.window.AbcParse;
const book = new AbcTuneBook("X:1\nT:T\nM:4/4\nL:1/8\nK:G\nV:1 clef=jianpu\n[V:1] CDEF|");
const p = new AbcParse();
p.parse(book.tunes[0].abc);
const tune = p.getTune();
console.log("lines count:", tune.lines.length);
const line0 = tune.lines[0];
console.log("line0 keys:", Object.keys(line0||{}));
const staff0 = line0 && line0.staff && line0.staff[0];
console.log("staff[0]:", JSON.stringify(staff0, null, 2));
console.log("key.root:", staff0 && staff0.key && staff0.key.root);
