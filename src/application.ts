// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults

let abcParser: ParseAbc | null = null;

class EditArea {
	private _id: string;

	constructor(id: string) {
		this._id = id || '';
	}

	set(str: string): void {
		const element = document.getElementById(this._id) as HTMLTextAreaElement;
		if (element) {
			element.value = str;
		}
	}

	get(): string {
		const element = document.getElementById(this._id) as HTMLTextAreaElement;
		return element ? element.value : '';
	}

	getSelection(): { start: number; end: number } {
		const element = document.getElementById(this._id) as HTMLTextAreaElement;
		if (element) {
			return { start: element.selectionStart, end: element.selectionEnd };
		}
		return { start: 0, end: 0 };
	}

	setSelection(start: number, end: number): void {
		const element = document.getElementById(this._id) as HTMLTextAreaElement;
		if (element) {
			element.setSelectionRange(start, end);
			element.focus();
		}
	}
}

const editArea = new EditArea('abc');

/////////////////////////////////////////////////////////////////////////////////

function redrawCurrent(): void {
	abc_keystroke();
}

function pickTuneAndPdf(pdf_id: string, abc_file: string, value: string): void {
	let pdf_file = abc_file.substring(0, abc_file.lastIndexOf('.'));
	pdf_file = `/testdata/${pdf_file}.pdf`;
	if (value === '') {
	// TODO
		alert("implement NEXT");
	}
	editArea.set(value.replace(/`n/g, '\n').replace(/`a/g, "'"));
	abc_keystroke();
	const pdf = document.getElementById(pdf_id);
	if (pdf) {
		pdf.innerHTML = `<embed src='${pdf_file}' height='100%' width='100%'>`;
	}
}

function pickTune(value: string): void {
	editArea.set(value.replace(/`n/g, '\n').replace(/`a/g, "'"));
	abc_keystroke();
}

function createPDF(): void {
	const t = editArea.get();
	new Ajax.Updater('ajax_status', '/tunes/createPdf', {
		parameters: { abc: t, authenticity_token: window.authenticity_token },
	});
}

function createMIDI(): void {
	const t = editArea.get();
	new Ajax.Updater('ajax_status', '/tunes/createMidi', {
		parameters: { abc: t, authenticity_token: window.authenticity_token },
	});
}

function save(): void {
	const t = editArea.get();
	new Ajax.Updater('ajax_status', '/tunes/save', {
		parameters: { abc: t, authenticity_token: window.authenticity_token },
	});
}

function magnify(value: number): void {
	DrawNotation.prototype.setCssZoom(value);
	abc_keystroke();
}

/////////////////////////////////////////////////////////////////////////////////

let playEmbedded: PlayEmbedded | null = null;
window.onload = function (): void {
	playEmbedded = new PlayEmbedded();
};

function play(): void {
	const t = editArea.get();
	if (abcParser === null) {
		abcParser = new ParseAbc();
	}
	abcParser.parse(t);
	if (playEmbedded) {
		playEmbedded.play(abcParser.getTune());
	}
}

function stopPlay(): void {
	if (playEmbedded) {
		playEmbedded.stop();
	}
}
//function doScale() {
//	var paper = Raphael(document.getElementById("canvas"), 1000, 600);
//	var font = paper.getFont("Maestro", 500);
//	scale_font(font, 30, paper);
//}


/////////////////////////////////////////////////////////////////////////////////

let printer: ABCPrinter | null = null;
let paper: RaphaelPaper | null = null;

//function parseABC() {
//  var abctrees;
//	try {
//		//console.profile();
//		  abctrees = new ABCParser(document.getElementById("abc").value).parse();
////		  var scratch = $('scratch');
////		  scratch.innerHTML = abctrees.toJSON();
//
//		  if (paper === null)
//			 paper = Raphael(document.getElementById("canvas"), 1000, 600);
//		 else
//			 $("canvas").innerHTML = "";
//		 if (printer === null)
//			  printer = new ABCPrinter(paper);
//		  printer.printABC(abctrees[0]);
//		//console.profileEnd();
//	} catch (e) {
//		if (e.text) {
//		  alert (e +" "+ e.text);
//		} else {
//		  throw e;
//		}
//	}
//}

/////////////////////////////////////////////////////////////////////////////////

let bReentry = false;
function abc_keystroke(): void {
	if (bReentry) return;
	bReentry = true;

	try {
	//	parseABC();
	//	var draw = new DrawNotation('music', 'main_title', 'author');
	//
		const t = editArea.get();
		if (abcParser === null) 
			abcParser = new ParseAbc();
		abcParser.parse(t);
		//	  var scratch = $('scratch2');
		const tune = abcParser.getTune();
		const canvas = document.getElementById("canvas");
		//canvas.down().update();
		canvas.innerHTML = "";
		//paper.remove();
		//if (paper === null)
		paper = Raphael(canvas, 1000, 600);
		//else
		//	 paper.remove();
		//canvas.innerHTML = "";
		//if (printer === null)
		printer = new ABCPrinter(paper);			
		printer.printABC(tune);
		//	  scratch.innerHTML = tune.toString();
		//	selection = editArea.getSelection();
		//	draw.draw(abcParser.getTune());
		
	} catch (e) {
		console.log("error: " + e);
		//canvas.update("error: " + e)
	}
	bReentry = false;
}

function click(): void {
	abc_keystroke();
}

function selectNote(div: HTMLElement): void {
	const pos = div.getAttribute("charPos");
	if (pos !== null) {
		const selection = editArea.getSelection();
		selection.start = parseInt(pos, 10);
		editArea.setSelection(selection.start, selection.start + 1);
	}
	abc_keystroke();
}

function doGradeTest(
	url: string,
	failed_tests: string,
	passed_tests: string,
	pass: boolean
): void {
	const failed = document.getElementById(failed_tests) as HTMLSelectElement;
	const passed = document.getElementById(passed_tests) as HTMLSelectElement;
	const selection = pass
		? failed.options[failed.selectedIndex]
		: passed.options[passed.selectedIndex];
	const value = selection.innerHTML;
	selection.remove();
	if (pass) {
		passed.appendChild(selection);
	} else {
		failed.appendChild(selection);
	}

	new Ajax.Request(url, {
		parameters: { pass: pass, value: value, authenticity_token: window.authenticity_token },
	});
}