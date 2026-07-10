var Raphael: Raphael;

if (typeof Raphael !== 'undefined' && Raphael) {
  Raphael.fn.toRelative = function (pathArray: any[] | string): any[] {
    const R = this.raphael;
    const push = "push";
    const length = "length";
    const proto = "prototype";
    const lowerCase = String[proto].toLowerCase;
    const toString = "toString";

    if (!R.is(pathArray, "array") || !R.is(pathArray && pathArray[0], "array")) {// rough assumption
      pathArray = R.parsePathString(pathArray);
    }

    const res: any[] = [];
    let x = 0,
      y = 0,
      mx = 0,
      my = 0,
      start = 0;

    if (pathArray[0][0] === "M") {
      x = +pathArray[0][1];
      y = +pathArray[0][2];
      mx = x;
      my = y;
      start = 1;
      res[push](["M", x, y]);
    }

    for (let i = start, ii = pathArray[length]; i < ii; i++) {
      const r: any[] = res[i] = [];
      const cmd = pathArray[i][0];

      if (cmd !== lowerCase.call(cmd)) {
        r[0] = lowerCase.call(cmd);
        switch (r[0]) {
          case "a":
            r[1] = pathArray[i][1];
            r[2] = pathArray[i][2];
            r[3] = pathArray[i][3];
            r[4] = pathArray[i][4];
            r[5] = pathArray[i][5];
            r[6] = pathArray[i][6] - x;
            r[7] = pathArray[i][7] - y;
            break;
          case "v":
            r[1] = pathArray[i][1] - y;
            break;
          case "h":
            r[1] = pathArray[i][1] - x;
            break;
          default:
            for (let j = 1, jj = pathArray[i][length]; j < jj; j++) {
              r[j] = pathArray[i][j] - (j % 2 ? x : y);
            }
        }
      } else {
        res[i] = [].concat(pathArray[i]);
        if (cmd === "m") {
          mx = pathArray[i][1] + x;
          my = pathArray[i][2] + y;
        }
      }

      const len = res[i][length];
      switch (res[i][0]) {
        case "z":
          x = mx;
          y = my;
          break;
        case "h":
          x += +res[i][len - 1];
          break;
        case "v":
          y += +res[i][len - 1];
          break;
        default:
          x += +res[i][len - 2];
          y += +res[i][len - 1];
      }
    }

    res[toString] = R._path2string;
    return res;
  };
}

function scale_font(font: Font, size: number, raphael: Raphael): void {
  const scale = size / font.face["units-per-em"];
  const res: string[] = [];

  for (const glyph in font.glyphs) {
    let symb: Symbol;
    try {
      symb = raphael.path({ path: font.glyphs[glyph].d, fill: "#000", stroke: "none" });
      symb.scale(scale, scale, 0, 0);
    } catch (e) {
      continue;
    }

    let path = symb.attrs["path"];
    if (path == null) {
      continue;
    }

    path = raphael.fn.toRelative(path);
    path[0][1] = +path[0][1].toFixed(3); // round out the M part
    path[0][2] = +path[0][2].toFixed(3);
    const w = Math.round(symb.getBBox().width * 1000) / 1000;
    const h = Math.round(symb.getBBox().height * 1000) / 1000;

    let gstr = "'";
    if (glyph.charCodeAt(0) > 127) {
      gstr +=
        "\\u" +
        (glyph.charCodeAt(0) < 1024 ? "0" : "") +
        (glyph.charCodeAt(0) < 255 ? "0" : "") +
        glyph.charCodeAt(0).toString(16);
    } else if (glyph == "\\" || glyph == "'") {
      gstr += "\\" + glyph;
    } else {
      gstr += glyph;
    }

    gstr += "':{d:";
    //gstr += JSON.stringify(path);
    gstr += path.toSource();
    gstr += ",w:" + w + ",h:" + h + "}";
    res.push(gstr);
  }

  document.write("{" + res.join(",") + "}");
}

function old(): void {
  // 此函數未使用，僅保留原始邏輯
  let gstr = "':{d:'";
  const path: any[] = [];
  const w = 0,
    h = 0;

  for (let i = 0; i < path.length; i++) {
    gstr += path[i][0];
    for (let j = 1, pathpart = path[i]; j < pathpart.length; j++) {
      gstr += " ";
      pathpart[j] = Math.round(pathpart[j] * 1000) / 1000;
      gstr += "" + pathpart[j];
    }
  }
  gstr += "',w:" + w + ",h:" + h + "}";
}