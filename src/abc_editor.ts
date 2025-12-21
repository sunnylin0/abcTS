import * as React from 'react';
﻿import * as ReactDOM from 'react-dom';
﻿import { ABCMidiWriter } from "./abc_midiwriter";
﻿import { AbcParse } from "./abc_parse";
﻿import { AbcTune } from "./abc_tune";
﻿import { AbcTuneBook } from "./abc_tunebook";
﻿import { AbcReactWrite } from './abc_react_write';
﻿import { ABCPrinter } from "./abc_write";
﻿import { Svg } from "./svg";
﻿
﻿import "./string_extension";
﻿import "./proto";
﻿import "./sprintf";
﻿
﻿// 定义 EditArea 类
﻿export class EditArea {
﻿	textarea: HTMLTextAreaElement;
﻿	changelistener: { fireChanged: () => void }
﻿	constructor(textareaid: string) {
﻿		this.textarea = document.getElementById(textareaid) as HTMLTextAreaElement;
﻿	}
﻿
﻿	addSelectionListener(listener: { fireSelectionChanged: () => void }) {
﻿		this.textarea.onmousemove = () => {
﻿			listener.fireSelectionChanged();
﻿		}
﻿	}
﻿
﻿	addChangeListener(listener: { fireChanged: () => void }) {
﻿		this.changelistener = listener;
﻿		this.textarea.onkeyup = () => {
﻿			listener.fireChanged();
﻿		}
﻿		this.textarea.onmouseup = () => {
﻿			listener.fireChanged();
﻿		}
﻿		this.textarea.onchange = () => {
﻿			listener.fireChanged();
﻿		}
﻿	}
﻿
﻿	getSelection(): { start: number, end: number } {
﻿		return { start: this.textarea.selectionStart, end: this.textarea.selectionEnd };
﻿	}
﻿
﻿	setSelection(start: number, end: number) {
﻿		this.textarea.setSelectionRange(start, end);
﻿		this.textarea.focus();
﻿	}
﻿
﻿	getString(): string {
﻿		return this.textarea.value;
﻿	}
﻿
﻿		setString(str: string) {
﻿
﻿			this.textarea.value = str;
﻿
﻿			if (this.changelistener) {
﻿
﻿				this.changelistener.fireChanged();
﻿
﻿			}
﻿
﻿		}
﻿
﻿	
﻿
﻿	    setValueWithoutUpdate(str: string) {
﻿
﻿	        this.textarea.value = str;
﻿
﻿	    }
﻿
﻿	
﻿
﻿		getElem(): HTMLTextAreaElement {
﻿
﻿			return this.textarea;
﻿
﻿		}
﻿
﻿	}
﻿
﻿	
﻿
﻿	// 定义 ABCEditor 类
﻿
﻿	export class ABCEditor {
﻿
﻿		editarea: EditArea;
﻿
﻿		div: HTMLElement;
﻿
﻿		mididiv?: HTMLElement;
﻿
﻿		warningsdiv?: HTMLElement;
﻿
﻿		parserparams: ParserOptions;
﻿
﻿		midiparams: MidiOptions;
﻿
﻿		oldt: string;
﻿
﻿		bReentry: boolean;
﻿
﻿		bIsPaused: boolean;
﻿
﻿		timerId: number | null;
﻿
﻿		tune:AbcTune;
﻿
﻿	
﻿
﻿		constructor(editarea: string | EditArea, params: {
﻿
﻿			canvas_id?: string,
﻿
﻿			generate_midi?: boolean,
﻿
﻿			midi_id?: string,
﻿
﻿			generate_warnings?: boolean,
﻿
﻿			warnings_id?: string,
﻿
﻿			parser_options?: ParserOptions,
﻿
﻿			midi_options?: MidiOptions,
﻿
﻿	        staffwidth?: number,
﻿
﻿		}) {
﻿
﻿			if (typeof editarea === "string") {
﻿
﻿				this.editarea = new EditArea(editarea);
﻿
﻿			} else {
﻿
﻿				this.editarea = editarea;
﻿
﻿			}
﻿
﻿			this.editarea.addSelectionListener(this);
﻿
﻿			this.editarea.addChangeListener(this);
﻿
﻿	
﻿
﻿			if (params.canvas_id) {
﻿
﻿				this.div = document.getElementById(params.canvas_id) as HTMLElement;
﻿
﻿			} else {
﻿
﻿				this.div = document.createElement("div");
﻿
﻿				this.editarea.getElem().parentNode.insertBefore(this.div, this.editarea.getElem());
﻿
﻿			}
﻿
﻿	
﻿
﻿			if (params.generate_midi || params.midi_id) {
﻿
﻿				if (params.midi_id) {
﻿
﻿					this.mididiv = document.getElementById(params.midi_id) as HTMLElement;
﻿
﻿				} else {
﻿
﻿					this.mididiv = document.createElement("div");
﻿
﻿	                this.div.parentNode.insertBefore(this.mididiv, this.div.nextSibling);
﻿
﻿				}
﻿
﻿			}
﻿
﻿	
﻿
﻿			if (params.generate_warnings || params.warnings_id) {
﻿
﻿				if (params.warnings_id) {
﻿
﻿					this.warningsdiv = document.getElementById(params.warnings_id) as HTMLElement;
﻿
﻿				} else {
﻿
﻿					this.warningsdiv = document.createElement("div");
﻿
﻿	                this.div.parentNode.insertBefore(this.warningsdiv, this.div.nextSibling);
﻿
﻿				}
﻿
﻿			}
﻿
﻿	
﻿
﻿			this.parserparams = params.parser_options || {};
﻿
﻿	        this.parserparams.staffwidth = params.staffwidth;
﻿
﻿			this.midiparams = params.midi_options || {};
﻿
﻿	
﻿
﻿			this.oldt = "";
﻿
﻿			this.bReentry = false;
﻿
﻿			this.bIsPaused = false;
﻿
﻿			this.timerId = null;
﻿
﻿	
﻿
﻿			this.updateRendering();
﻿
﻿		}
﻿
﻿	
﻿
﻿	    handleAbcChange = (newAbc: string) => {
﻿
﻿	        this.editarea.setValueWithoutUpdate(newAbc);
﻿
﻿	        this.oldt = newAbc;
﻿
﻿	    }
﻿
﻿	
﻿
﻿		updateRendering() {
﻿
﻿			if (this.bIsPaused || this.bReentry) return;
﻿
﻿			this.bReentry = true;
﻿
﻿			const t = this.editarea.getString();
﻿
﻿			if (t === this.oldt) {
﻿
﻿				this.bReentry = false;
﻿
﻿				return;
﻿
﻿			}
﻿
﻿			// 僅在使用者停止輸入後才進行渲染，因此請等待一會兒並透過計時器進行更新。
﻿
﻿			const This = this;
﻿
﻿			const doRendering = () => {
﻿
﻿				This.timerId = null;
﻿
﻿				const newText = This.editarea.getString(); // 重新获取文本，以防在回调期间发生变化
﻿
﻿				This.oldt = newText;
﻿
﻿				
﻿
﻿				const tunebook = new AbcTuneBook(newText);
﻿
﻿				const abcParser = new AbcParse();
﻿
﻿				abcParser.parse(tunebook.tunes[0].abc); //TODO handle multiple tunes
﻿
﻿				const tune = abcParser.getTune();			
﻿
﻿				This.tune = tune;
﻿
﻿	
﻿
﻿	            // Render the React component
﻿
﻿	            ReactDOM.render(
﻿
﻿	                React.createElement(AbcReactWrite, { abc: newText, params: This.parserparams, onAbcChange: This.handleAbcChange }),
﻿
﻿	                This.div
﻿
﻿	            );
﻿
﻿	
﻿
﻿				if ( This.mididiv) {
﻿
﻿	                this.mididiv.innerHTML = "";
﻿
﻿					var midiwriter = new ABCMidiWriter(This.mididiv, This.midiparams);
﻿
﻿					midiwriter.writeABC(tune);
﻿
﻿				}
﻿
﻿				if (This.warningsdiv) {
﻿
﻿					const warnings = abcParser.getWarnings();
﻿
﻿					This.warningsdiv.innerHTML = warnings?.length ? warnings.join("<br />") : "No errors";
﻿
﻿				}
﻿
﻿	
﻿
﻿				This.bReentry = false;
﻿
﻿			};
﻿
﻿		if (this.timerId)	// If the user is still typing, cancel the update
﻿			clearTimeout(this.timerId);
﻿		this.timerId = setTimeout(doRendering, 300);	// Is this a good comprimise between responsiveness and not redrawing too much?
﻿	}
﻿
﻿	fireSelectionChanged() {
﻿		// This will be handled by React components
﻿	}
﻿
﻿	fireChanged() {
﻿		this.updateRendering();
﻿	}
﻿
﻿	pause(shouldPause) {
﻿		this.bIsPaused = shouldPause;
﻿		if (!shouldPause)
﻿			this.updateRendering();
﻿	};
﻿}
﻿
﻿let edit = {aa:3,bb:11}
﻿let abc = "string hi hi"
﻿
﻿export {AbcParse,AbcTune,ABCPrinter,Svg }
﻿