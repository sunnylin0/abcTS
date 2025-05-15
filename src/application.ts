//    application.js: Interface between a web page and the abc javascript processor.
//    Copyright (C) 2010 Paul Rosen (paul at paulrosen dot net)
//
//    This program is free software: you can redistribute it and/or modify
//    it under the terms of the GNU General Public License as published by
//    the Free Software Foundation, either version 3 of the License, or
//    (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
//    You should have received a copy of the GNU General Public License
//    along with this program.  If not, see <http://www.gnu.org/licenses/>.

/*global $, $$, Class, Ajax, Element */
/*global window, confirm */
/*global AbcParse, AbcTuneBook, AbcParserLint, PlayEmbedded, DrawNotation, ABCPrinter, Raphael */
/*extern abcParser, EditArea, editArea, writeOneTune */
/*global abc_contents_output */

let abc_contents_output = {}
function $(id: string): HTMLElement {
	return document.querySelector(id)
}
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

let abcParser: AbcParse = null;
let printer: ABCPrinter = null;
let paper: Svg = null;

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
		abcParser = new AbcParse();

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
		$('#warnings').innerHTML = warnings;
	}
	else
		$('#warnings').innerHTML = 'No errors';
	var canvas = $("#canvas" + count);

	//paper = Raphael(canvas, 1500, 1500);
	paper = new Svg(canvas);
	paper.setSize(1500, 1500);

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
		var el = $("#canvas" + i);
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
	//DrawNotation.prototype.setCssZoom(value);
	//abc_keystroke();
}

function saveCurrentToTest() {
	var onSuccess = function (resp) {
		var arr = resp.responseText.split('/');
		var fname = arr[arr.length - 1];
		fname = fname.split(' ')[0];
		$('#paul_failed_tests').appendChild(new Element('option').update(fname));
		abc_contents_output[fname] = { abc: editArea.get(), out: "Unknown: reload page to see this data." };
	};
	var t = editArea.get();
	new Ajax.Updater('ajax_status', '/tunes/save_test',
		{ parameters: { abc: t, authenticity_token: window.authenticity_token }, onSuccess: onSuccess });
}
/////////////////////////////////////////////////////////////////////////////////

let playEmbedded: PlayEmbedded | null = null;
window.onload = function (): void {
	//playEmbedded = new PlayEmbedded();
};

function play(): void {
	//const t = editArea.get();
	//if (abcParser === null) {
	//	abcParser = new ParseAbc();
	//}
	//abcParser.parse(t);
	//if (playEmbedded) {
	//	playEmbedded.play(abcParser.getTune());
	//}
}

function stopPlay(): void {
	//if (playEmbedded) {
	//	playEmbedded.stop();
	//}
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
	selection['start'] = pos;
	if (pos !== undefined) {
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
	const failed = $(failed_tests) as HTMLSelectElement;
	const passed = $(passed_tests) as HTMLSelectElement;
	const selection = pass
		? failed.options[failed.selectedIndex]
		: passed.options[passed.selectedIndex];
	const value = selection.innerHTML;
	var num_success = parseInt($('#success_count').innerHTML);
	var num_fail = parseInt($('#fail_count').innerHTML);
	selection.remove();
	if (pass) {
		passed.appendChild(selection);
		num_success++;
		num_fail--;
	} else {
		failed.appendChild(selection);
		num_success--;
		num_fail++;
	}

	new Ajax.Request(url, {
		parameters: { pass: pass, value: value, authenticity_token: window.authenticity_token },
	});
}

let lint = new AbcParserLint();

function lintOneTune(tune: string | null, warnings: string[], count?: number): string[] {
	if (tune === null) return warnings;
	const output = lint.lint(tune, warnings);  // 假设存在lint对象类型定义
	return output;
}

function showRegression(): void {
	const t = editArea.get();
	const ret = processAbc({
		tunebook: t,
		fnCallback: lintOneTune
	});
	$("#warnings").innerHTML = ret.join('<br />')
		.replace(/\n/g, '<br />')
		.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
}

function runRegressionTest(): void {
	$("#warnings").innerHTML = "";
	let failList = "";
	Object.keys(abc_contents_output).forEach((filename: string) => {
		const contents = abc_contents_output[filename].abc;
		const ret = processAbc({
			tunebook: contents,
			fnCallback: lintOneTune
		}).join('\n');

		const onSuccess = (resp: { responseText: string }) => {
			const origFile = resp.responseText;
			if (ret === origFile) {
				$("#warnings").innerHTML = `${filename}: pass<br />${failList}`;
			} else {
				failList = `${filename}: fail<br />${failList}`;
				$("#warnings").innerHTML = failList;
			}
		};

		new Ajax.Request("/tunes/get_file", {
			method: "get",
			parameters: {
				authenticity_token: window.authenticity_token,
				file: `regression/${filename}.out`
			},
			onSuccess
		});
	});
}

function createRegressionData(): void {
	let count = 1;
	Object.keys(abc_contents_output).forEach((filename: string) => {
		const contents = abc_contents_output[filename].abc;
		const ret = processAbc({
			tunebook: contents,
			fnCallback: lintOneTune
		}).join('\n');

		new Ajax.Updater('warnings', "/tunes/write_regression_data", {
			method: "post",
			parameters: {
				authenticity_token: window.authenticity_token,
				filename,
				data: ret,
				count: count++
			}
		});
	});
}

function profileParser(): void {
	const t = editArea.get();
	for (let i = 1; i <= 20; i++) {
		const nothing = () => {
			($('#warnings') as HTMLElement).innerHTML = `Pass: ${i}`;
		};
		processAbc({ tunebook: t, fnCallback: nothing });
	}
}

function profileRegression(): void {
	const t = editArea.get();
	for (let i = 1; i <= 20; i++) {
		($('#warnings') as HTMLElement).innerHTML = "running...";
		processAbc({ tunebook: t, fnCallback: lintOneTune });
		($('#warnings') as HTMLElement).innerHTML = "finished";
	}
}