/**
 * @author paulrosen
 */



// Define an interface for the structure of each tune object
interface TuneInfo {
  abc: string;      // The ABC notation string for the tune
  startPos: number; // The starting character position in the original book string
}

class AbcTuneBook {
  tunes: TuneInfo[];

  constructor(book: string) {
    // 初始化处理流程
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
      this.tunes.shift();  // 移除首条无效记录‌:ml-citation{ref="3" data="citationList"}
    }

    // 截断双换行符后的内容
    this.tunes.forEach(tune => {
      const endIndex = tune.abc.indexOf('\n\n');
      if (endIndex > -1) {
        tune.abc = tune.abc.substring(0, endIndex);  // 保持原处理逻辑‌:ml-citation{ref="3" data="citationList"}
      }
    });
  }
}


