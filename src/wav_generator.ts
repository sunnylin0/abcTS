//#######################################
//#
//# Written by sk89q <http://sk89q.therisenrealm.com>
//# Copyright 2008 sk89q. All rights reserved.
//#
//# Redistribution and use in source and binary forms, with or without
//# modification, are permitted provided that the following conditions
//# are met:
//#
//# 1. Redistributions of source code must retain the above
//#    copyright notice, this list of conditions and the following
//#    disclaimer.
//# 2. Redistributions in binary form must reproduce the above
//#    copyright notice, this list of conditions and the following
//#    disclaimer in the documentation and/or other materials provided
//#    with the distribution.
//#
//# THIS SOFTWARE IS PROVIDED BY SK89Q "AS IS" AND ANY EXPRESS
//# OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
//# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//# ARE DISCLAIMED. IN NO EVENT SHALL SK89Q BE LIABLE FOR ANY DIRECT,
//# INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
//# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
//# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
//# HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
//# STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//# ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
//# ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//#
//######################################



export class PlayTune {
	/*
		_players：用於存儲播放器元素的陣列。
		_playerI：當前播放器的索引。
		_songLines：存儲樂曲數據的陣列，每個元素是一個 [頻率, 時值] 的元組。
		_songLineIndex：當前播放的樂曲行索引。
		_isPlaying：是否正在播放的標誌。
	*/
	private _players: HTMLElement[] = [];
	private _playerI: number = 0;
	private _songLines: [number, number][] = [];
	private _songLineIndex: number = 0;
	private _isPlaying: boolean = false;




	constructor() {
		// 初始化按鈕狀態
		const stopButton: HTMLButtonElement = document.getElementById('stopButton') as HTMLButtonElement;
		if (stopButton)
			stopButton.disabled = true;

		const playButton: HTMLButtonElement = document.getElementById('playButton') as HTMLButtonElement;
		if (playButton)
			playButton.disabled = false;
	}

	/**
 * 播放指定頻率的聲音
 * @param frequency 頻率
 * @param seconds 持續時間（秒）
 */
	private _playFreq(frequency: number, seconds: number): void {
		const channels: number = 1;
		const sampleRate: number = 4024;
		const bitsPerSample: number = 16;
		const volume: number = 32767;

		let data: string[] = [];
		let samples: number = 0;

		// 生成正弦波形
		for (let i = 0; i < sampleRate * seconds; i++) {
			for (let c = 0; c < channels; c++) {
				const v: number = volume * Math.sin((2 * Math.PI) * (i / sampleRate) * frequency);
				data.push(pack("v", v));
				samples++;
			}
		}

		data = [data.join('')];

		// 格式化子塊
		const chunk1: string = [
			"fmt ", // 子塊標識符
			pack("V", 16), // 塊長度
			pack("v", 1), // 音頻格式（1 表示線性量化）
			pack("v", channels),
			pack("V", sampleRate),
			pack("V", sampleRate * channels * bitsPerSample / 8), // 字節率
			pack("v", channels * bitsPerSample / 8),
			pack("v", bitsPerSample)
		].join('');

		// 數據子塊（包含聲音）
		const chunk2: string = [
			"data", // 子塊標識符
			pack("V", samples * channels * bitsPerSample / 8), // 塊長度
			data
		].join('');

		// 頭部
		const header: string = [
			"RIFF",
			pack("V", 4 + (8 + chunk1.length) + (8 + chunk2.length)), // 長度
			"WAVE"
		].join('');

		const out: string = [header, chunk1, chunk2].join('');
		const dataURI: string = "data:audio/wav;base64," + escape(btoa(out));

		// 添加嵌入播放器
		if (this._playerI % 2 === 0) {
			if (this._players[0] && this._players[0].parentNode) {
				this._players[0].parentNode.removeChild(this._players[0]);
			}
			this._players[0] = document.createElement("embed");
			this._players[0].setAttribute("src", dataURI);
			this._players[0].setAttribute("width", "100");
			this._players[0].setAttribute("height", "70");
			this._players[0].setAttribute("autostart", "true");
			document.getElementById('players')?.appendChild(this._players[0]);
		} else {
			if (this._players[1] && this._players[1].parentNode) {
				this._players[1].parentNode.removeChild(this._players[1]);
			}
			this._players[1] = document.createElement("embed");
			this._players[1].setAttribute("src", dataURI);
			this._players[1].setAttribute("width", "100");
			this._players[1].setAttribute("height", "70");
			this._players[1].setAttribute("autostart", "true");
			document.getElementById('players')?.appendChild(this._players[1]);
		}
		this._playerI++;
	}

	/**
 * 播放樂曲
 * @param tune 樂曲數據（二維數組，表示音符和時值）
 * @param tempo 速度（BPM）
 */
	play(tune: number[][], tempo: number): void {
		// 頻率對應表（從低音 C 開始）
		const frequencies: number[] = [
			16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.5, 29.14, 30.87,
			32.70, 34.65, 36.71, 38.89, 41.20, 43.65, 46.25, 49.00, 51.91, 55, 58.27, 61.74,
			65.41, 69.30, 73.42, 77.78, 82.41, 87.31, 92.50, 98.00, 103.8, 110, 116.5, 123.5,
			130.8, 138.6, 146.8, 155.6, 164.8, 174.6, 185, 196, 207.7, 220, 233.1, 246.9,
			261.6, 277.2, 293.7, 311.1, 329.6, 349.2, 370, 392, 415.3, 440, 466.2, 493.9,
			523.3, 554.4, 587.3, 622.3, 659.3, 698.5, 740, 784, 830.6, 880, 932.3, 987.8,
			1047, 1109, 1175, 1245, 1319, 1397, 1480, 1568, 1661, 1760, 1865, 1976,
			2093, 2217, 2349, 2489, 2637, 2794, 2960, 3136, 3322, 3520, 3729, 3951,
			4186, 4435, 4699, 4978, 5274, 5588, 5920, 6272, 6645, 7040, 7459, 7902,
			8372, 8870, 9397, 9956, 10548, 11175, 11840, 12544, 13290, 14080, 14917, 15804
		];

		const ms: number = (60 / tempo) * 1000;
		const eighthNoteLen: number = 250;

		// 重置狀態
		this._songLines = [];
		this._songLineIndex = 0;

		// 將樂曲轉換為播放序列
		for (let i = 0; i < tune.length; i++) {
			const freq: number = frequencies[tune[i][0]];
			const noteLength: number = (eighthNoteLen * ms * tune[i][1]) / 1000 / 500;
			this._songLines.push([freq, noteLength]);
		}

		// 開始播放
		this._isPlaying = true;
		this._consumeLine(this);

		// 啟用停止按鈕
		const stopButton: HTMLButtonElement = document.getElementById('stopButton') as HTMLButtonElement;
		if (stopButton)
			stopButton.disabled = false;
		const playButton: HTMLButtonElement = document.getElementById('playButton') as HTMLButtonElement;
		if (playButton)
			playButton.disabled = false;
	}

	/**
	 * 停止播放
	 */
	stop(): void {
		this._isPlaying = false; // 停止播放
		const stopButton: HTMLButtonElement = document.getElementById('stopButton') as HTMLButtonElement;
		if (stopButton)
			stopButton.disabled = true;
	}

	/**
	 * 逐行播放樂曲
	 * @param This PlayTune 實例
	 */
	private _consumeLine(This: PlayTune): void {
		// 如果停止播放或樂曲結束
		if (!This._isPlaying || This._songLineIndex >= This._songLines.length) {
			This._isPlaying = false;
			const stopButton: HTMLButtonElement = document.getElementById('stopButton') as HTMLButtonElement;
			if (stopButton)
				stopButton.disabled = true;
			const playButton: HTMLButtonElement = document.getElementById('playButton') as HTMLButtonElement;
			if (playButton)
				playButton.disabled = false;
			return;
		}

		// 播放當前音符
		const songLine = This._songLines[This._songLineIndex];
		This._playFreq(songLine[0], songLine[1]);

		// 播放下一個音符
		This._songLineIndex++;
		setTimeout(() => { This._consumeLine(This); }, songLine[1] * 1000);
	}

}

// Base 64 encoding function, for browsers that do not support btoa()
// by Tyler Akins (http://rumkin.com), available in the public domain
if (!window.btoa) {
	const btoa = (input: string): string => {
		const keyStr: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

		let output: string = "";
		let chr1: number, chr2: number, chr3: number;
		let enc1: number, enc2: number, enc3: number, enc4: number;
		let i: number = 0;

		do {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}

			output = output + keyStr.charAt(enc1) + keyStr.charAt(enc2) +
				keyStr.charAt(enc3) + keyStr.charAt(enc4);
		} while (i < input.length);

		return output;
	};

	// 將自定義的 btoa 函數掛載到全局對象上
	(window as any).btoa = btoa;
}

/**
 * 將數據打包為二進制格式
 * @param format 格式字符串
 * @param value 數值
 * @returns 打包後的字符串
 */
function pack(fmt: string, ...args: (string | number)[]): string {
	let output: string = '';

	let argi: number = 0;
	for (let i = 0; i < fmt.length; i++) {
		const c: string = fmt.charAt(i);
		const arg: any = args[argi];
		argi++;
		let strA = "";

		switch (c) {
			case "a":
				strA = typeof args[argi] === 'string' ? (args[argi] as string) : String(args[argi]);
				output += strA.charAt(0) + "\0";
				break;
			case "A":
				strA = typeof args[argi] === 'string' ? (args[argi] as string) : String(args[argi]);
				output += strA.charAt(0) + " ";
				break;
			case "C":
			case "c":
				output += String.fromCharCode(arg);
				break;
			case "n":
				output += String.fromCharCode((arg >> 8) & 255, arg & 255);
				break;
			case "v":
				output += String.fromCharCode(arg & 255, (arg >> 8) & 255);
				break;
			case "N":
				output += String.fromCharCode((arg >> 24) & 255, (arg >> 16) & 255, (arg >> 8) & 255, arg & 255);
				break;
			case "V":
				output += String.fromCharCode(arg & 255, (arg >> 8) & 255, (arg >> 16) & 255, (arg >> 24) & 255);
				break;
			case "x":
				argi--; // 不消耗參數
				output += "\0";
				break;
			default:
				throw new Error(`Unknown pack format character '${c}'`);
		}
	}

	return output;
}