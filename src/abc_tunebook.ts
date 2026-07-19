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
	abc: string;      // 曲調的 ABC 記譜法字串
	startPos: number; // 原始書籍字串中的起始字元位置
}

export class AbcTuneBook {
	tunes: TuneInfo[];

	constructor(book: string) {
		// 初始化處理流程
		let directives = "";
		const processedBook = book.trim();  // 使用原生trim 取代  Prototype.js 的 strip‌:ml-citation{ref="4,7" data="citationList"}
		const rawTunes: string[] = processedBook.split("\nX:");
		let pos = 0;

		// 重建X: 標記並產生初始曲譜數組
		this.tunes = rawTunes.map((tune: string, index) => {
			const restoredTune = index > 0 ? `X:${tune}` : tune;  // 修复分割丢失的 X: 标记‌:ml-citation{ref="3" data="citationList"}
			const start = pos;
			pos += restoredTune.length;
			return { abc: restoredTune, startPos: start };
		});

		// 過濾無效起始曲譜
		if (this.tunes.length > 1 && !this.tunes[0].abc.startsWith('X:')) {
			// 這裡可能包含檔案級指令，如果是這樣，我們需要將其插入到每個曲庫中。我們或許可以勉強應付。
			// 我只是在這裡（在第一首曲子之前）查找文件範圍的指令，並將它們插入到每首曲子的末尾，因為
			// 整個樂譜會一次解析。指令會在印表機開始處理前讀取。
			var dir = this.tunes.shift();
			var arrDir = dir.abc.split('\n');
			arrDir.forEach(function (line) {
				if (line.startsWith('%%'))
					directives += '\n' + line;
			});
		}

		// 截斷雙換行符後的內容
		this.tunes.forEach(tune => {
			const endIndex = tune.abc.indexOf('\n\n');
			if (endIndex > 0)
				tune.abc = tune.abc.substring(0, endIndex);  // 保持原处理逻辑‌:ml-citation{ref="3" data="citationList"}
			tune.abc = directives + tune.abc;
		});
	}
}


