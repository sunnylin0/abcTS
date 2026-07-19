//    abc_tokenizer.ts: tokenizes an ABC Music Notation string to support abc_parse.
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


// this is a series of functions that get a particular element out of the passed stream.
// the return is the number of characters consumed, so 0 means that the element wasn't found.
// also returned is the element found. This may be a different length because spaces may be consumed that aren't part of the string.
// The return structure for most calls is { len: num_chars_consumed, token: str }



export class AbcTokenizer {
	/**
	 * 跳過字串開頭的空白字符
	 * @param str
	 * @returns
	 */
	skipWhiteSpace(str: string): number {
		for (let i = 0; i < str.length; i++) {
			if (!this.isWhiteSpace(str.charAt(i))) {
				return i;
			}
		}
		return str.length; // 全是空格
	}

	// 判斷是否結束
	finished(str: string, i: number): boolean {
		return i >= str.length;
	}

	// 吃掉（即跳過）從指定索引開始的空白字符，並返回吃掉的字符數
	eatWhiteSpace(line: string, index: number): number {
		let i;
		for (i = index; i < line.length; i++) {
			if (!this.isWhiteSpace(line.charAt(i))) {
				return i - index;
			}
		}
		return i - index;
	}

	// 取得基本音高字母，忽略前導空格，並規範化為大寫
	getKeyPitch(str: string): { len?: number, token?: string } {
		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i)) {
			return { len: 0 };
		}
		switch (str.charAt(i)) {
			case 'A': return { len: i + 1, token: 'A' };
			case 'B': return { len: i + 1, token: 'B' };
			case 'C': return { len: i + 1, token: 'C' };
			case 'D': return { len: i + 1, token: 'D' };
			case 'E': return { len: i + 1, token: 'E' };
			case 'F': return { len: i + 1, token: 'F' };
			case 'G': return { len: i + 1, token: 'G' };
			case 'a': return { len: i + 1, token: 'A' };
			case 'b': return { len: i + 1, token: 'B' };
			case 'c': return { len: i + 1, token: 'C' };
			case 'd': return { len: i + 1, token: 'D' };
			case 'e': return { len: i + 1, token: 'E' };
			case 'f': return { len: i + 1, token: 'F' };
			case 'g': return { len: i + 1, token: 'G' };
		}
		return { len: 0 };
	}

	// 取得基本本升降號，忽略前導空格，只包含在鍵中出現的那些
	getSharpFlat(str: string): { len: number, token?: string } {
		switch (str.charAt(0)) {
			case '#': return { len: 1, token: '#' };
			case 'b': return { len: 1, token: 'b' };
		}
		return { len: 0 };
	}

	// 取得模式標記
	getMode(str: string): { len: number, token?: string } {
		const skipAlpha = (str: string, start: number): number => {
			// This returns the index of the next non-alphabetic char, or the entire length of the string if not found.
			while (start < str.length && (
				(str.charAt(start) >= 'a' && str.charAt(start) <= 'z') ||
				(str.charAt(start) >= 'A' && str.charAt(start) <= 'Z'))) {
				start++;
			}
			return start;
		};

		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i)) {
			return { len: 0 };
		}
		let firstThree = str.substring(i, i + 3).toLowerCase();
		if (firstThree.length > 1 &&
			firstThree.charAt(1) === ' ' || firstThree.charAt(1) === '^' ||
			firstThree.charAt(1) === '_' || firstThree.charAt(1) === '=') {
			firstThree = firstThree.charAt(0);	// This will handle the case of 'm'
		}
		switch (firstThree) {
			case 'mix': return { len: skipAlpha(str, i), token: 'Mix' };
			case 'dor': return { len: skipAlpha(str, i), token: 'Dor' };
			case 'phr': return { len: skipAlpha(str, i), token: 'Phr' };
			case 'lyd': return { len: skipAlpha(str, i), token: 'Lyd' };
			case 'loc': return { len: skipAlpha(str, i), token: 'Loc' };
			case 'aeo': return { len: skipAlpha(str, i), token: 'm' };
			case 'maj': return { len: skipAlpha(str, i), token: '' };
			case 'ion': return { len: skipAlpha(str, i), token: '' };
			case 'min': return { len: skipAlpha(str, i), token: 'm' };
			case 'm': return { len: skipAlpha(str, i), token: 'm' };
		}
		return { len: 0 };
	}

	// 取得譜號標記
	getClef(str: string): { len: number, token?: ClefType, warn?: string, explicit?: boolean } {
		let strOrig = str;
		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i)) {
			return { len: 0 };
		}
		let needsClef = false;
		let strClef = str.substring(i);
		if (strClef.startsWith('clef=')) {
			needsClef = true;
			strClef = strClef.substring(5);
			i += 5;
		}
		if (strClef.length === 0 && needsClef) {
			return { len: i + 5, warn: "No clef specified: " + strOrig };
		}

		let j: number = this.skipWhiteSpace(strClef);
		if (this.finished(strClef, j)) {
			return { len: 0 };
		}
		if (j > 0) {
			i += j;
			strClef = strClef.substring(j);
		}
		let name: ClefType = 'none';
		if (strClef.startsWith('treble'))
			name = 'treble';
		else if (strClef.startsWith('bass3'))
			name = 'bass3';
		else if (strClef.startsWith('bass'))
			name = 'bass';
		else if (strClef.startsWith('tenor'))
			name = 'tenor';
		else if (strClef.startsWith('alto2'))
			name = 'alto2';
		else if (strClef.startsWith('alto1'))
			name = 'alto1';
		else if (strClef.startsWith('alto'))
			name = 'alto';
		else if (strClef.startsWith('none'))
			name = 'none';
		else
			return { len: i + 5, warn: "Unknown clef specified: " + strOrig };


		strClef = strClef.substring(name.length);
		j = this.isMatch(strClef, '+8');
		if (j > 0)
			name += "+8";
		else {
			j = this.isMatch(strClef, '-8');
			if (j > 0)
				name += "-8";
		}

		return { len: i + name.length, token: name as ClefType, explicit: needsClef };
	}

	// 取得小節線標記
	getBarLine(line: string, i: number): { len?: number, token?: string, warn?: string } {
		switch (line.charAt(i)) {
			case ']':
				++i;
				switch (line.charAt(i)) {
					case '|': return { len: 2, token: "bar_thick_thin" };
					case '[':
						++i;
						if ((line.charAt(i) >= '1' && line.charAt(i) <= '9') || line.charAt(i) === '"') {
							return { len: 2, token: "bar_invisible" };
						}
						return { len: 1, warn: "Unknown bar symbol" };
					default:
						return { len: 1, token: "bar_invisible" };
				}
				break;
			case ':':
				++i;
				switch (line.charAt(i)) {
					case ':': return { len: 2, token: "bar_dbl_repeat" };
					case '|': // :|
						++i;
						switch (line.charAt(i)) {
							case ']': // :|]
								++i;
								switch (line.charAt(i)) {
									case '|': // :|]|
										++i;
										if (line.charAt(i) === ':')
											return { len: 5, token: "bar_dbl_repeat" };
										return { len: 3, token: "bar_right_repeat" };
									default:
										return { len: 3, token: "bar_right_repeat" };
								}
								break;
							case '|': // :||
								++i;
								if (line.charAt(i) === ':')
									return { len: 4, token: "bar_dbl_repeat" };
								return { len: 3, token: "bar_right_repeat" };
							default:
								return { len: 2, token: "bar_right_repeat" };
						}
						break;
					default:
						return { len: 1, warn: "Unknown bar symbol" };
				}
				break;
			case '[': // 
				++i;
				if (line.charAt(i) === '|') { // [|
					++i;
					switch (line.charAt(i)) {
						case ':': return { len: 3, token: "bar_left_repeat" };
						case ']': return { len: 3, token: "bar_invisible" };
						default: return { len: 2, token: "bar_thick_thin" };
					}
				} else {
					if ((line.charAt(i) >= '1' && line.charAt(i) <= '9') || line.charAt(i) === '"') {
						return { len: 1, token: "bar_invisible" };
					}
					return { len: 0 };
				}
			case '|': // |
				++i;
				switch (line.charAt(i)) {
					case ']': return { len: 2, token: "bar_thin_thick" };
					case '|': // ||
						++i;
						if (line.charAt(i) === ':')
							return { len: 3, token: "bar_left_repeat" };
						return { len: 2, token: "bar_thin_thin" };
					case ':': // |:
						let colons = 0;
						while (line.charAt(i + colons) === ':')
							colons++;
						return { len: 1 + colons, token: "bar_left_repeat" };
					default: return { len: 1, token: "bar_thin" };
				}
			default:
				return { len: 0 };
		}
	}

	// 取得由 legalChars 匹配字串中字元組成的所有字符
	getTokenOf(str: string, legalChars: string): { len: number, token: string } {
		let i;
		for (i = 0; i < str.length; i++) {
			if (legalChars.indexOf(str.charAt(i)) < 0) {
				return { len: i, token: str.substring(0, i) };
			}
		}
		return { len: i, token: str };
	}

	// 取得下一個不包含空格的字元集
	getToken(str: string, start: number, end: number): string {
		// This returns the next set of chars that doesn't contain spaces
		let i = start;
		while (i < end && !this.isWhiteSpace(str.charAt(i))) {
			i++;
		}
		return str.substring(start, i);
	}

	// 檢查下一個標記是否與傳入的單字匹配，包括可能的前導空格
	isMatch(str: string, match: string): number {
		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i)) {
			return 0;
		}
		if (str.substring(i).startsWith(match)) {
			return i + match.length;
		}
		return 0;
	}

	// 取得鍵簽名中的變音記號標記，包含變音記號和音高字母
	getKeyAccidental(str: string): { len?: number, token?: { acc: string, note: string }, warn?: string } {
		const accTranslation: { [key: string]: string } = {
			'^': 'sharp',
			'^^': 'dblsharp',
			'=': 'natural',
			'_': 'flat',
			'__': 'dblflat',
			'_/': 'quarterflat',
			'^/': 'quartersharp'
		};
		let i = this.skipWhiteSpace(str);
		if (this.finished(str, i)) {
			return { len: 0 };
		}
		let acc: string;
		switch (str.charAt(i)) {
			case '^':
			case '_':
			case '=':
				acc = str.charAt(i);
				break;
			default: return { len: 0 };
		}
		i++;
		if (this.finished(str, i)) {
			return { len: 1, warn: 'Expected note name after accidental' };
		}
		switch (str.charAt(i)) {
			case 'a':
			case 'b':
			case 'c':
			case 'd':
			case 'e':
			case 'f':
			case 'g':
			case 'A':
			case 'B':
			case 'C':
			case 'D':
			case 'E':
			case 'F':
			case 'G':
				return { len: i + 1, token: { acc: accTranslation[acc], note: str.charAt(i) } };
			case '^':
			case '_':
			case '/':
				acc += str.charAt(i);
				i++;
				if (this.finished(str, i))
					return { len: 2, warn: 'Expected note name after accidental' };
				switch (str.charAt(i)) {
					case 'a':
					case 'b':
					case 'c':
					case 'd':
					case 'e':
					case 'f':
					case 'g':
					case 'A':
					case 'B':
					case 'C':
					case 'D':
					case 'E':
					case 'F':
					case 'G':
						return { len: i + 1, token: { acc: accTranslation[acc], note: str.charAt(i) } };
					default:
						return { len: 2, warn: 'Expected note name after accidental' };
				}
			default:
				return { len: 1, warn: 'Expected note name after accidental' };
		}
	}

	// 檢查字元是否為空白字符
	isWhiteSpace(ch: string): boolean {
		return ch === ' ' || ch === '\t' || ch === '\x12';
	}

	// 移除字串中的註解（以%開頭的部分）並修剪兩端空白字符
	getMeat(line: string, start: number, end: number): { start: number, end: number } {
		// This removes any comments starting with '%' and trims the ends of the string so that there are no leading or trailing spaces.
		// it returns just the start and end characters that contain the meat.
		var comment = line.indexOf('%', start);
		if (comment >= 0 && comment < end)
			end = comment;
		while (start < end && (line.charAt(start) === ' ' || line.charAt(start) === '\t' || line.charAt(start) === '\x12'))
			start++;
		while (start < end && (line.charAt(end - 1) === ' ' || line.charAt(end - 1) === '\t' || line.charAt(end - 1) === '\x12'))
			end--;
		return { start: start, end: end };
	}

	// 判斷是否為字母
	isLetter(ch: string): boolean {
		return (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z');
	}

	// 判斷是否為數字
	isNumber(ch: string): boolean {
		return (ch >= '0' && ch <= '9');
	}

	// 將輸入的字串標記化，傳回所有標記的陣列
	tokenize(line: string, start: number, end: number): { type?: string, token?: string, start?: number, end?: number, continueId?: boolean }[] {
		// this returns all the tokens inside the passed string. A token is a punctuation mark, a string of digits, a string of letters.
		//  Quoted strings are one token.
		// The type of token is returned: quote, alpha, number, punct
		var ret = this.getMeat(line, start, end);
		start = ret.start;
		end = ret.end;
		let tokens: { type?: string, token?: string, start?: number, end?: number, continueId?: boolean }[] = [];
		let i: number;
		while (start < end) {
			if (line.charAt(start) === '"') {
				i = start + 1;
				while (i < end && line.charAt(i) !== '"')
					i++;
				tokens.push({ type: 'quote', token: line.substring(start + 1, i), start: start + 1, end: i });
				i++;
			} else if (this.isLetter(line.charAt(start))) {
				i = start + 1;
				while (i < end && this.isLetter(line.charAt(i)))
					i++;
				tokens.push({ type: 'alpha', token: line.substring(start, i), continueId: this.isNumber(line.charAt(i)), start, end: i });
				start = i + 1;
			} else if (this.isNumber(line.charAt(start))) {
				i = start + 1;
				while (i < end && this.isNumber(line.charAt(i))) {
					i++;
				}
				tokens.push({ type: 'number', token: line.substring(start, i), continueId: this.isLetter(line.charAt(i)), start, end: i });
				start = i + 1;
			} else if (line.charAt(start) === ' ') {
				i = start + 1;
			} else {
				tokens.push({ type: 'punct', token: line.charAt(start), start, end: start + 1 });
				i = start + 1;
			}
			start = i;
		}
		return tokens;
	}

	// 在V:欄位中取得下一個標記，標記由空格或等號分隔
	getVoiceToken(line: string, start: number, end: number): { len: number, token?: string, warn?: string } {
		// This finds the next token. A token is delimited by a space or an equal sign. If it starts with a quote, then the portion between the quotes is returned.
		let i = start;
		while (i < end && this.isWhiteSpace(line.charAt(i)) || line.charAt(i) === '=') {
			i++;
		}

		if (line.charAt(i) === '"') {
			let close = line.indexOf('"', i + 1);
			if (close === -1 || close >= end) {
				return { len: 1, warn: "Missing close quote" };
			}
			return { len: close - start + 1, token: this.translateString(line.substring(i + 1, close)) };
		} else {
			let ii = i;
			while (ii < end && !this.isWhiteSpace(line.charAt(ii)) && line.charAt(ii) !== '=') {
				ii++;
			}
			return { len: ii - start + 1, token: line.substring(i, ii) };
		}
	}

	// 字元轉換映射
	charMap: { [key: string]: string } = {
		"`a": 'à', "'a": "á", "^a": "â", "~a": "ã", "\"a": "ä", "oa": "å", "=a": "ā", "ua": "ă", ";a": "ą",
		"`e": 'è', "'e": "é", "^e": "ê", "\"e": "ë", "=e": "ē", "ue": "ĕ", ";e": "ę", ".e": "ė",
		"`i": 'ì', "'i": "í", "^i": "î", "\"i": "ï", "=i": "ī", "ui": "ĭ", ";i": "į",
		"`o": 'ò', "'o": "ó", "^o": "ô", "~o": "õ", "\"o": "ö", "=o": "ō", "uo": "ŏ", "/o": "ø",
		"`u": 'ù', "'u": "ú", "^u": "û", "~u": "ũ", "\"u": "ü", "ou": "ů", "=u": "ū", "uu": "ŭ", ";u": "ų",
		"`A": 'À', "'A": "Á", "^A": "Â", "~A": "Ã", "\"A": "Ä", "oA": "Å", "=A": "Ā", "uA": "Ă", ";A": "Ą",
		"`E": 'È', "'E": "É", "^E": "Ê", "\"E": "Ë", "=E": "Ē", "uE": "Ĕ", ";E": "Ę", ".E": "Ė",
		"`I": 'Ì', "'I": "Í", "^I": "Î", "~I": "Ĩ", "\"I": "Ï", "=I": "Ī", "uI": "Ĭ", ";I": "Į", ".I": "İ",
		"`O": 'Ò', "'O": "Ó", "^O": "Ô", "~O": "Õ", "\"O": "Ö", "=O": "Ō", "uO": "Ŏ", "/O": "Ø",
		"`U": 'Ù', "'U": "Ú", "^U": "Û", "~U": "Ũ", "\"U": "Ü", "oU": "Ů", "=U": "Ū", "uU": "Ŭ", ";U": "Ų",
		"ae": "æ", "AE": "Æ", "oe": "œ", "OE": "Œ", "ss": "ß",
		"'c": "ć", "^c": "ĉ", "uc": "č", "cc": "ç", ".c": "ċ", "cC": "Ç", "'C": "Ć", "^C": "Ĉ", "uC": "Č", ".C": "Ċ",
		"~n": "ñ",
		"=s": "š", "vs": "š",
		"vz": 'ž'

		// More chars: Ñ Ĳ ĳ Ď ď Đ đ Ĝ ĝ Ğ ğ Ġ ġ Ģ ģ Ĥ ĥ Ħ ħ Ĵ ĵ Ķ ķ ĸ Ĺ ĺ Ļ ļ Ľ ľ Ŀ ŀ Ł ł Ń ń Ņ ņ Ň ň ŉ Ŋ ŋ   Ŕ ŕ Ŗ ŗ Ř ř Ś ś Ŝ ŝ Ş ş Š Ţ ţ Ť ť Ŧ ŧ Ŵ ŵ Ŷ ŷ Ÿ ÿ Ÿ Ź ź Ż ż Ž 
	};

	charMap2: { [key: string]: string } = {
		"251": "©"
	};

	// 翻譯包含特殊字元轉義的字串
	translateString(str: string): string {
		let arr = str.split('\\');
		if (arr.length === 1) {
			return str;
		}
		let out: string | null = null;
		arr.forEach(s => {
			if (out === null) {
				out = s;
			} else if (s.length < 2)
				out += "\\" + s;
			else {
				let c = this.charMap[s.substring(0, 2)];
				if (c !== undefined)
					out += c + s.substring(2);
				else {
					c = this.charMap2[s.substring(0, 3)];
					if (c !== undefined)
						out += c + s.substring(3);
					else
						out += "\\" + s;
				}
			}
		});
		return out!;
	}

	// 取得數字
	getNumber(line: string, index: number): { num: number, index: number } {
		let num = 0;
		while (index < line.length) {
			switch (line.charAt(index)) {
				case '0': num = num * 10; index++; break;
				case '1': num = num * 10 + 1; index++; break;
				case '2': num = num * 10 + 2; index++; break;
				case '3': num = num * 10 + 3; index++; break;
				case '4': num = num * 10 + 4; index++; break;
				case '5': num = num * 10 + 5; index++; break;
				case '6': num = num * 10 + 6; index++; break;
				case '7': num = num * 10 + 7; index++; break;
				case '8': num = num * 10 + 8; index++; break;
				case '9': num = num * 10 + 9; index++; break;
				default:
					return { num, index };
			}
		}
		return { num, index };
	}

	// 取得分數
	getFraction(line: string, index: number): { value: number, index: number } {
		let num = 1;
		let den = 1;
		if (line.charAt(index) !== '/') {
			let ret = this.getNumber(line, index);
			num = ret.num;
			index = ret.index;
		}
		if (line.charAt(index) === '/') {
			index++;
			if (line.charAt(index) === '/') {
				let div = 0.5;
				while (line.charAt(index++) === '/') {
					div /= 2;
				}
				return { value: num * div, index: index - 1 };
			} else {
				let iSave = index;
				let ret2 = this.getNumber(line, index);
				if (ret2.num === 0 && iSave === index) { // 如果沒有使用任何字符，則預設 2
					ret2.num = 2;
				}
				if (ret2.num !== 0) {
					den = ret2.num;
				}
				index = ret2.index;
			}
		}
		return { value: num / den, index };
	}

	// 反轉字串
	theReverser(str: string): string {
		if (str.endsWith(", The"))
			return "The " + str.substring(0, str.length - 5);
		if (str.endsWith(", A"))
			return "A " + str.substring(0, str.length - 3);
		return str;
	}

	// 移除字串中的註釋
	stripComment(str: string): string {
		let i = str.indexOf('%');
		if (i >= 0)
			return str.substring(0, i).trim();
		return str.trim();
	}

	// 取得整數值
	getInt(str: string): { value?: number, digits: number } {
		// This parses the beginning of the string for a number and returns { value: num, digits: num }
		// If digits is 0, then the string didn't point to a number.
		let x = parseInt(str);
		if (isNaN(x)) {
			return { digits: 0 };
		}
		let s = "" + x;
		let i = str.indexOf(s); // 考慮前導空格
		return { value: x, digits: i + s.length };
	}

	// 取得浮點數
	getFloat(str: string): { value?: number, digits: number } {
		// This parses the beginning of the string for a number and returns { value: num, digits: num }
		// If digits is 0, then the string didn't point to a number.
		let x = parseFloat(str);
		if (isNaN(x)) {
			return { digits: 0 };
		}
		let s = "" + x;
		let i = str.indexOf(s); // 考慮前導空格
		return { value: x, digits: i + s.length };
	}

	// 取得測量值（如長度、尺寸等）
	getMeasurement(tokens: { type: string, token: string, start: number, end: number }[]): { used: number, value?: number } {
		if (tokens.length === 0)
			return { used: 0 };
		if (tokens[0].type !== 'number')
			return { used: 0 };
		let num = tokens.shift()!.token;
		if (tokens.length === 0)
			return { used: 1, value: parseInt(num) };

		let x = tokens.shift()!;
		let used = 1;
		if (x.token === '.') {
			used++;
			if (tokens.length === 0) {
				return { used: used, value: parseInt(num) };
			}
			if (tokens[0].type === 'number') {
				x = tokens.shift()!;
				num = num + '.' + x.token;
				used++;
				if (tokens.length === 0) {
					return { used: used, value: parseFloat(num) };
				}
			}
			x = tokens.shift()!;
		}
		switch (x.token) {
			case 'pt': return { used: used + 1, value: parseFloat(num) };
			case 'cm': return { used: used + 1, value: parseFloat(num) / 2.54 * 72 };
			case 'in': return { used: used + 1, value: parseFloat(num) * 72 };
		}
		return { used: 0 };
	}

	// 替換字串中的轉義字符
	substInChord(str: string): string {
		while (str.indexOf("\\n") !== -1) {
			str = str.replace("\\n", "\n");
		}
		return str;
	}

	// 取得括號內的子字串
	getBrackettedSubstring(line: string, i: number, maxErrorChars: number, _matchChar?: string): [number, string, boolean] {
		// This extracts the sub string by looking at the first character and searching for that
		// character later in the line (or search for the optional _matchChar).
		// For instance, if the first character is a quote it will look for
		// the end quote. If the end of the line is reached, then only up to the default number
		// of characters are returned, so that a missing end quote won't eat up the entire line.
		// It returns the substring and the number of characters consumed.
		// The number of characters consumed is normally two more than the size of the substring,
		// but in the error case it might not be.
		let matchChar = _matchChar || line.charAt(i);
		let pos = i + 1;
		while (pos < line.length && line.charAt(pos) !== matchChar) {
			++pos;
		}
		if (line.charAt(pos) === matchChar) {
			return [pos - i + 1, this.substInChord(line.substring(i + 1, pos)), true];
		} else { // 到達行尾，選擇任意數量的字元以防止行消失
			pos = i + maxErrorChars;
			if (pos > line.length - 1) {
				pos = line.length - 1;
			}
			return [pos - i + 1, this.substInChord(line.substring(i + 1, pos)), false];
		}
	}
}
