var Raphael: Raphael;

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

  if (pathArray[0][0] == "M") {
    x = pathArray[0][1];
    y = pathArray[0][2];
    mx = x;
    my = y;
    start++;
    res[push](["M", x, y]);
  }

  for (let i = start, ii = pathArray[length]; i < ii; i++) {
    const r: any[] = (res[i] = []);
    const pa = pathArray[i];

    if (pa[0] != lowerCase.call(pa[0])) {
      r[0] = lowerCase.call(pa[0]);
      switch (r[0]) {
        case "a":
          r[1] = pa[1];
          r[2] = pa[2];
          r[3] = pa[3];
          r[4] = pa[4];
          r[5] = pa[5];
          r[6] = +(pa[6] - x).toFixed(3);
          r[7] = +(pa[7] - y).toFixed(3);
          break;
        case "v":
          r[1] = +(pa[1] - y).toFixed(3);
          break;
        case "m":
          mx = pa[1];
          my = pa[2];
          break;
        default:
          for (let j = 1, jj = pa[length]; j < jj; j++) {
            r[j] = +(pa[j] - (j % 2 ? x : y)).toFixed(3);
          }
      }
    } else {
      res[i] = [];
      if (pa[0] == "m") {
        mx = pa[1] + x;
        my = pa[2] + y;
      }
      for (let k = 0, kk = pa[length]; k < kk; k++) {
        res[i][k] = pa[k];
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

function scale_font(font: Font, size: number, raphael: Raphael): void {
  const scale = size / font.face["units-per-em"];
  const res: string[] = [];

  for (const glyph in font.glyphs) {
    let symb: Symbol;
    try {
      symb = raphael.path(font.glyphs[glyph].d).attr({ fill: "#000", stroke: "none" });
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