// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults


/*global $, $$, Class, Ajax, Element */
/*global window, confirm */
/*global ParseAbc, AbcTuneBook, AbcParserLint, PlayEmbedded, DrawNotation, ABCPrinter, Raphael */
/*extern abcParser, EditArea, editArea, writeOneTune */
/*global abc_contents_output */

let abc_contents_output = {}
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
	highlight(abcelem: ABCElement) {
		this.setSelection(abcelem.startChar, abcelem.endChar);
	}
}

const editArea = new EditArea('abc');

/////////////////////////////////////////////////////////////////////////////////

let abcParser = null;
let printer = null;
let paper = null;

/////////////////////////////////////////////////////////////////////////////////

// This function takes a string representing an ABC tune book, and a callback routine, and it parses the string
// and calls the callback routine for each tune it finds. If a tune is parsed in error, then the callback is called with null.
function processAbc(params) {
	var strAbc = params.tunebook;
	var fnCallback = params.fnCallback;
	var ret = [];
	//try {
		var tunebook = new AbcTuneBook(strAbc);
		if (abcParser === null)
			abcParser = new ParseAbc();

		for (var i = 0; i < tunebook.tunes.length; i++) {
			abcParser.parse(tunebook.tunes[i].abc);
			var tune = abcParser.getTune();
			var warnings = abcParser.getWarnings();
			ret.push(fnCallback(tune, warnings, i));
		}
	//} catch (e) {
	//	ret.push(fnCallback(null, e, null));
	//}
	return ret;
}

/////////////////////////////////////////////////////////////////////////////////

function abc_mousemove() {
	var selection = editArea.getSelection();
	try {
		printer.rangeHighlight(selection.start, selection.end);
	} catch (e) { }
}

function writeOneTune(tune, warnings, count) {
	if (warnings) {
		warnings = warnings.join("<br />");
		document.getElementById('warnings').innerHTML = warnings;
	}
	else
		document.getElementById('warnings').innerHTML = 'No errors';
	var canvas = document.getElementById("canvas" + count);
	paper = Raphael(canvas, 1500, 1500);
	printer = new ABCPrinter(paper);
	printer.printABC(tune);
	printer.addSelectListener(editArea);
	abc_mousemove();
}

let bReentry = false;
var oldt = "";
function abc_keystroke() {
	if (bReentry)
		return;
	bReentry = true;
	var t = editArea.get();
	if (t == oldt) {
		abc_mousemove();
		bReentry = false;
		return;
	} else {
		oldt = t;
	}
	// clear out any old tune
	var done = false;
	var i = 0;
	while (!done) {
		var el = document.getElementById("canvas" + i);
		if (el)
			el.innerHTML = "";
		else
			done = true;
		i++;
	}

	processAbc({ tunebook: t, fnCallback: writeOneTune });

	// Put the click handlers on all the music we just printed.
	//	var paths = $$('path');
	//	var click = function() {
	//		var x = this.getAttribute('abc-pos');
	//		//$(this).setStyle({ backgroundColor: '#ff0000' });
	//		if (x && !x.startsWith('-1')) {
	//			var arr = x.split(',');
	//			editArea.setSelection(parseInt(arr[0])-1, parseInt(arr[1]));
	//		}
	//	};
	//	paths.each(function(path) {
	//		path.onclick = click;
	//	});

	bReentry = false;
}

function redrawCurrent(): void {
	abc_keystroke();
}

function pickTuneAndPdf(pdf_id, folder, abc_file) {
	var sel = abc_contents_output[abc_file];
	//$("persistent_url").update("http://" + window.location.host + "/comparison?tune=" + abc_file);
	var filename = abc_file.substring(0, abc_file.lastIndexOf('.'));
	var pdf_file = "/testdata/" + folder + '/' + filename.gsub('\\+', '%2B') + '.ps';
	//$("abcm2ps_output").update(sel.out.gsub(' ', '&nbsp;').gsub('\n', '<br />'));

	editArea.set(sel.abc);
	abc_keystroke();
	var pdf = document.getElementById(pdf_id);
	pdf.innerHTML = "<embed src='" + pdf_file + "' height='100%' width='100%'>";
}

function pickTune(value) {
	var sel = abc_contents_output[value];
	editArea.set(value.replace(/`n/g, '\n').replace(/`a/, "'"));
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

function saveCurrentToTest() {
	var onSuccess = function (resp) {
		var arr = resp.responseText.split('/');
		var fname = arr[arr.length - 1];
		fname = fname.split(' ')[0];
		$('paul_failed_tests').appendChild(new Element('option').update(fname));
		abc_contents_output[fname] = { abc: editArea.get(), out: "Unknown: reload page to see this data." };
	};
	var t = editArea.get();
	new Ajax.Updater('ajax_status', '/tunes/save_test',
		{ parameters: { abc: t, authenticity_token: window.authenticity_token }, onSuccess: onSuccess });
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
	var num_success = parseInt(document.getElementById('success_count').innerHTML);
	var num_fail = parseInt(document.getElementById('fail_count').innerHTML);
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