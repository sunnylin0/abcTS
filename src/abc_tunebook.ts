//    abc_tokenizer.js: tokenizes an ABC Music Notation string to support abc_parse.
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

/*extern AbcTokenizer */

// this is a series of functions that get a particular element out of the passed stream.
// the return is the number of characters consumed, so 0 means that the element wasn't found.
// also returned is the element found. This may be a different length because spaces may be consumed that aren't part of the string.
// The return structure for most calls is { len: num_chars_consumed, token: str }

interface TuneInfo {
	abc: string;      // The ABC notation string for the tune
	startPos: number; // The starting character position in the original book string
}

class AbcTuneBook {
	tunes: TuneInfo[];

	constructor(book: string) {
		// 初始化处理流程
		let directives = "";
		const processedBook = book.trim();  // 使用原生 trim 替代 Prototype.js 的 strip‌:ml-citation{ref="4,7" data="citationList"}
		const rawTunes = processedBook.split("\nX:");
		let pos = 0;

		// 重建 X: 标记并生成初始曲谱数组
		this.tunes = rawTunes.map((tune, index) => {
			const restoredTune = index > 0 ? `X:${tune}` : tune;  // 修复分割丢失的 X: 标记‌:ml-citation{ref="3" data="citationList"}
			const start = pos;
			pos += restoredTune.length;
			return { abc: restoredTune, startPos: start };
		});

		// 过滤无效起始曲谱
		if (this.tunes.length > 1 && !this.tunes[0].abc.startsWith('X:')) {
			// There could be file-wide directives in this, if so, we need to insert it into each tune. We can probably get away with
			// just looking for file-wide directives here (before the first tune) and inserting them at the bottom of each tune, since
			// the tune is parsed all at once. The directives will be seen before the printer begins processing.
			var dir = this.tunes.shift();
			var arrDir = dir.abc.split('\n');
			arrDir.forEach(function (line) {
				if (line.startsWith('%%'))
					directives += '\n' + line;
			});
		}

		// 截断双换行符后的内容
		this.tunes.forEach(tune => {
			const endIndex = tune.abc.indexOf('\n\n');
			if (endIndex > 0)
				tune.abc = tune.abc.substring(0, endIndex);  // 保持原处理逻辑‌:ml-citation{ref="3" data="citationList"}
				tune.abc = directives + tune.abc;
		});
	}
}


