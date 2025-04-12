/**
 * @author paulrosen
 */
class PlayEmbedded {
  private playTune: PlayTune;

  constructor() {
    this.playTune = new PlayTune();
  }

  /**
   * 播放 ABC 解析後的樂曲
   * @param abcParsed 解析後的 ABC 樂曲數據
   */
  play(abcParsed: any): void {
    const abcPitchToAbsPitch: number[] = [
      33, 35, 36, 38, 40, 41, 43,
      45, 47, 48, 50, 52, 53, 55,
      57, 59, 60, 62, 64, 65, 67,
      69, 71, 72, 74, 76, 77, 79,
      81, 83, 84, 86, 88, 89, 91,
      93, 95, 96, 98, 100, 101, 103
    ];
    const tune: [number, number][] = [];

    // 將解析後的格式轉換為絕對音高和時值的陣列
    abcParsed.lines.forEach((line: any) => {
      if (line.staff !== undefined) {
        line.staff.forEach((item: any) => {
          switch (item.el_type) {
            case 'note':
              tune.push([abcPitchToAbsPitch[item.pitch], item.duration]);
              break;
          }
        });
      }
    });

    // 播放樂曲
    this.playTune.play(tune, 89);
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.playTune.stop();
  }
}