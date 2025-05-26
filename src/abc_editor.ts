// 定义 EditArea 类
class EditArea {
	textarea: HTMLTextAreaElement;
	changelistener: { fireChanged: () => void }
	constructor(textareaid: string) {
		this.textarea = document.getElementById(textareaid) as HTMLTextAreaElement;
	}

	addSelectionListener(listener: { fireSelectionChanged: () => void }) {
		this.textarea.onmousemove = () => {
			listener.fireSelectionChanged();
		}
	}

	addChangeListener(listener: { fireChanged: () => void }) {
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

// 定义 ABCEditor 类
class ABCEditor {
	editarea: EditArea;
	div: HTMLElement;
	mididiv?: HTMLElement;
	warningsdiv?: HTMLElement;
	parserparams: ParserOptions;
	midiparams: MidiOptions;
	oldt: string;
	bReentry: boolean;
	bIsPaused: boolean;
	timerId: number | null;
	printer: ABCPrinter;
	tune;
	svg;

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
		const t = this.editarea.getString();
		if (t === this.oldt) {
			this.updateSelection();
			this.bReentry = false;
			return;
		}
		// 僅在使用者停止輸入後才進行渲染，因此請等待一會兒並透過計時器進行更新。
		const This = this;
		const doRendering = () => {
			This.timerId = null;
			const newText = This.editarea.getString(); // 重新获取文本，以防在回调期间发生变化
			This.oldt = newText;
			// clear out any old tune
			This.div.innerHTML = "";
			const tunebook = new AbcTuneBook(t);
			const abcParser = new AbcParse();
			abcParser.parse(tunebook.tunes[0].abc); //TODO handle multiple tunes
			const tune = abcParser.getTune();			
			const paper = new Svg(This.div);
			paper.setSize(800,400)
			This.printer = new ABCPrinter(paper);
			This.printer.printABC(tune);

			this.tune = tune;
			this.svg = paper;

			if ( This.mididiv) {
				if ((This.mididiv !== This.div) && (This.mididiv.innerHTML = "")) {
					var midiwriter = new ABCMidiWriter(This.mididiv, This.midiparams);
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

		if (this.timerId)	// If the user is still typing, cancel the update
			clearTimeout(this.timerId);
		this.timerId = setTimeout(doRendering, 300);	// Is this a good comprimise between responsiveness and not redrawing too much?
	}

	updateSelection() {
		const selection = this.editarea.getSelection();
		try {
			this.printer.rangeHighlight(selection.start, selection.end);
		} catch (e) { } // 可能 printer 尚未定义
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
	pause(shouldPause) {
		this.bIsPaused = shouldPause;
		if (!shouldPause)
			this.updateRendering();
	};
}
