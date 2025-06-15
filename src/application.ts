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

/*global $, Ajax, Element */
/*global window, confirm */
/*global AbcParse, AbcTuneBook, AbcParserLint, PlayEmbedded, DrawNotation, ABCPrinter, Raphael */
/*extern abcParser, pickTunebook, selectTune */
/*global abc_contents_output */



/////////////////////////////////////////////////////////////////////////////////

let abcParser: AbcParse = null;


/////////////////////////////////////////////////////////////////////////////////

// This function takes a string representing an ABC tune book, and a callback routine, and it parses the string
// and calls the callback routine for each tune it finds. If a tune is parsed in error, then the callback is called with null.
export function processAbc(params) {
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



