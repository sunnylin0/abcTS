import { AbcParse } from "./abc_parse";
import { AbcTune } from "./abc_tune";
import { AbcTuneBook } from "./abc_tunebook";
import { Svg } from "./svg";
import { ABCPrinter } from "./abc_write";
import { ABCMidiWriter } from "./abc_midiwriter";

interface ParserOptions { }
interface MidiOptions { }

// 定義EditArea類
export class EditArea {
	textarea: HTMLTextAreaElement;
	changelistener: { fireChanged: () => void }
	constructor(textareaid: string) {
		this.textarea = document.getElementById(textareaid) as HTMLTextAreaElement;
	}

	addSelectionListener(listener: ABCEditor) {
		this.textarea.onmousemove = () => {
			listener.fireSelectionChanged();
		}
	}

	addChangeListener(listener: ABCEditor) {
		this.changelistener = listener;
		this.textarea.onkeyup = () => {
			listener.fireChanged();
		}
		this.textarea.onmouseup = () => {
			listener.fireChanged();
		}
		this.textarea.onchange = () => {
			listener.fireChanged();
		}
	}

	getSelection(): { start: number, end: number } {
		return { start: this.textarea.selectionStart, end: this.textarea.selectionEnd };
	}

	setSelection(start: number, end: number) {
		this.textarea.setSelectionRange(start, end);
		this.textarea.focus();
	}

	getString(): string {
		return this.textarea.value;
	}

	setString(str: string) {
		this.textarea.value = str;
		if (this.changelistener) {
			this.changelistener.fireChanged();
		}
	}

	getElem(): HTMLTextAreaElement {
		return this.textarea;
	}
}

// 定義 ABCEditor 類別
export class ABCEditor {
	editarea: EditArea;
	div: HTMLElement;
	mididiv?: HTMLElement;
	warningsdiv?: HTMLElement;
	parserparams: ParserOptions;
	midiparams: MidiOptions;
	oldt: string;
	bReentry: boolean;
	bIsPaused: boolean;
	timerId: number | ReturnType<typeof setTimeout> | null = null;
	printer: ABCPrinter;
	tune: AbcTune;
	svg: Svg;

	constructor(editarea: string | EditArea, params: {
		canvas_id?: string,
		generate_midi?: boolean,
		midi_id?: string,
		generate_warnings?: boolean,
		warnings_id?: string,
		parser_options?: ParserOptions,
		midi_options?: MidiOptions
	}) {
		if (typeof editarea === "string") {
			this.editarea = new EditArea(editarea);
		} else {
			this.editarea = editarea;
		}
		this.editarea.addSelectionListener(this);
		this.editarea.addChangeListener(this);

		if (params.canvas_id) {
			this.div = document.getElementById(params.canvas_id) as HTMLElement;
		} else {
			this.div = document.createElement("div");
			this.editarea.getElem().parentNode.insertBefore(this.div, this.editarea.getElem());
		}

		if (params.generate_midi || params.midi_id) {
			if (params.midi_id) {
				this.mididiv = document.getElementById(params.midi_id) as HTMLElement;
			} else {
				this.mididiv = this.div;
			}
		}

		if (params.generate_warnings || params.warnings_id) {
			if (params.warnings_id) {
				this.warningsdiv = document.getElementById(params.warnings_id) as HTMLElement;
			} else {
				this.warningsdiv = this.div;
			}
		}

		this.parserparams = params.parser_options || {};
		this.midiparams = params.midi_options || {};

		this.oldt = "";
		this.bReentry = false;
		this.bIsPaused = false;
		this.timerId = null;

		this.updateRendering();
	}

	updateRendering() {
		if (this.bIsPaused || this.bReentry) return;
		this.bReentry = true;
		const t: string = this.editarea.getString();
		if (t === this.oldt) {
			this.updateSelection();
			this.bReentry = false;
			return;
		}
		// 只需在使用者輸入停止後才進行渲染，因此請等待一段時間並定時器進行更新。
		const This: ABCEditor = this;
		const doRendering = () => {
			This.timerId = null;
			const newText: string = This.editarea.getString(); // 重新取得文本，在回呼期間發生變化
			This.oldt = newText;
			// clear out any old tune
			This.div.innerHTML = "";
			const tunebook: AbcTuneBook = new AbcTuneBook(t);
			const abcParser: AbcParse = new AbcParse();
			abcParser.parse(tunebook.tunes[0].abc); //TODO handle multiple tunes
			const tune: AbcTune = abcParser.getTune();
			const paper: Svg = new Svg(This.div);
			paper.setSize(800, 400);
			This.printer = new ABCPrinter(paper);
			This.printer.printABC(tune);

			this.tune = tune;
			this.svg = paper;

			if (This.mididiv) {
				if ((This.mididiv !== This.div) && (This.mididiv.innerHTML = "")) {
					var midiwriter: ABCMidiWriter = new ABCMidiWriter(This.mididiv, This.midiparams);
					midiwriter.writeABC(tune);
				}
			}
			if (This.warningsdiv) {
				const warnings = abcParser.getWarnings();
				This.warningsdiv.innerHTML = warnings?.length ? warnings.join("<br />") : "No errors";
			}

			This.printer.addSelectListener(This);
			This.updateSelection();
			This.bReentry = false;
		};

		if (this.timerId)	// 若使用者仍在輸入，取消更新
			clearTimeout(this.timerId);
		this.timerId = setTimeout(doRendering, 300);	// 這是否是響應速度和避免過度重繪之間的一個好的折衷方案？
	}

	updateSelection() {
		const selection = this.editarea.getSelection();
		try {
			this.printer.rangeHighlight(selection.start, selection.end);
		} catch (e) { } // 可能 printer 尚未定義
	}

	fireSelectionChanged() {
		this.updateSelection();
	}

	fireChanged() {
		this.updateRendering();
	}

	highlight(abcelem: { startChar: number, endChar: number }) {

		this.editarea.setSelection(abcelem.startChar, abcelem.endChar);
	};
	pause(shouldPause: boolean) {
		this.bIsPaused = shouldPause;
		if (!shouldPause)
			this.updateRendering();
	};
}
