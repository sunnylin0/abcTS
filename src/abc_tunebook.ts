/**
 * @author paulrosen
 */

class AbcTuneBook {
  tunes: string[];

  constructor(book: string) {
    // 处理输入字符串并初始化曲谱数组‌:ml-citation{ref="5" data="citationList"}
    const processedBook = book.trim();
    this.tunes = processedBook.split("\nX:");

    // 处理首元素格式‌:ml-citation{ref="5" data="citationList"}
    if (! (this.tunes[0].indexOf("X:")===0)) {
      this.tunes[0] = "X:1\n" + (this.tunes || '');
    }

    // 清理每个曲谱并重建索引‌:ml-citation{ref="5,7" data="citationList"}
    this.tunes = this.tunes.map((tune, index) => {
      const cleaned = tune.trim();
      return index > 0 ? `X:${cleaned}` : cleaned;
    }).filter(tune => tune.length > 0);
  }
}
