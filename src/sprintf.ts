/**
 * sprintf() for JavaScript v.0.4
 *
 * Copyright (c) 2007 Alexandru Marasteanu <http://alexei.417.ro/>
 * Thanks to David Baird (unit test and patch).
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation; either version 2 of the License, or (at your option) any later
 * version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, write to the Free Software Foundation, Inc., 59 Temple
 * Place, Suite 330, Boston, MA 02111-1307 USA
 */

function str_repeat(i: any, m: number): string {
  const o: any[] = [];
  while (m > 0) {
    o[--m] = i;
  }
  return o.join('');
}



function sprintf(format: string, ...args: (string | number)[]): string {
  let i = 0;
  let f = format;
  const o: string[] = [];
  let m: RegExpExecArray | null;
  let a: string | number;
  let p: string;
  let c: string;
  let x: number;

  while (f) {
    if ((m = /^[^\x25]+/.exec(f))) {
      o.push(m[0]);
    } else if ((m = /^\x25{2}/.exec(f))) {
      o.push('%');
    } else if ((m = /^\x25(?:(\d+)\$)?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(f))) {
      a = args[m[1] ? parseInt(m[1], 10) - 1 : i++];
      if (a === null || a === undefined) {
        throw new Error("Too few arguments.");
      }
      if (/[^s]/.test(m[7]) && typeof a !== 'number') {
        throw new Error(`Expecting number but found ${typeof a}`);
      }
      switch (m[7]) {
        case 'b':
          a = (a as number).toString(2);
          break;
        case 'c':
          a = String.fromCharCode(a as number);
          break;
        case 'd':
          a = parseInt(a.toString() , 10);
          break;
        case 'e':
          a = m[6] ? (a as string).toExponential(parseInt(m[6], 10)) : (a as string).toExponential();
          break;
        case 'f':
          a = m[6] ? parseFloat(a as string).toFixed(parseInt(m[6], 10)) : parseFloat(a as string);
          break;
        case 'o':
          a = (a as number).toString(8);
          break;
        case 's':
          a = m[6] ? (a as string).substring(0, parseInt(m[6], 10)) : a as string;
          break;
        case 'u':
          a = Math.abs(a as number);
          break;
        case 'x':
          a = (a as number).toString(16);
          break;
        case 'X':
          a = (a as number).toString(16).toUpperCase();
          break;
      }
      a = (/[def]/.test(m[7]) && m[2] && (a as number) > 0 ? '+' + a : a);
      c = m[3] ? (m[3] === '0' ? '0' : m[3].charAt(1)) : ' ';
      x = parseInt(m[5], 10) - String(a).length;
      p = m[5] ? str_repeat(c, x) : '';
      o.push(m[4] ? a + p : p + a);
    } else {
      throw new Error("Huh ?!");
    }
    f = f.substring(m[0].length);
  }
  return o.join('');
}


// ´ú¸Õ
// console.log(sprintf("Hello, %s! You have %d unread messages.", "Alice", 5)); // ¿é¥X: Hello, Alice! You have 5 unread messages.
// console.log(sprintf("Binary: %b, Hex: %x, Octal: %o", 255, 255, 255)); // ¿é¥X: Binary: 11111111, Hex: ff, Octal: 377