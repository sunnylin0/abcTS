// abc_jianpu_renderer.ts
// 簡譜渲染深化模組 (JianpuVoiceRenderer)
// 職責：封裝所有 Jianpu 聲部的繪製邏輯，由 ABCVoiceElement.draw() 委託呼叫。
// 對外介面只有 render()，內部細節完全隱藏。

import type { ABCVoiceElement, ABCAbsoluteElement } from './abc_graphelements';
import type { ABCPrinter } from './abc_write';
import { pitchToJianpu, decomposeDuration } from './abc_jianpu_write';

export class JianpuVoiceRenderer {

	/**
	 * 主入口 — 委託點 (Seam)。
	 * ABCVoiceElement.draw() 在偵測到 clef=jianpu 後呼叫此方法。
	 */
	render(voice: ABCVoiceElement, printer: ABCPrinter, bartop: number): void {
		if (printer.y === undefined) {
			printer.y = voice.y;
		}
		this._drawHeader(voice, printer);
		this._drawNotes(voice, printer, bartop);
		this._drawUnderlines(voice, printer);
	}

	// ── 行首標記：1=Key 與 拍號 ────────────────────────────────────────────────

	private _drawHeader(voice: ABCVoiceElement, printer: ABCPrinter): void {
		const keyRoot = (voice.jianpuKey && voice.jianpuKey.root) || 'C';
		const keyText = `1=${keyRoot}`;
		const labelY = printer.y;

		printer.paper.text(20, labelY, keyText).attr({
			'font-size': 16,
			'font-family': 'sans-serif',
			'font-weight': 'bold',
			'text-anchor': 'start',
		});

		// 尋找拍號 (Meter)
		const meterText = this._resolveMeterText(voice);
		if (meterText) {
			printer.paper.text(55, labelY, meterText).attr({
				'font-size': 16,
				'font-family': 'sans-serif',
				'font-weight': 'bold',
				'text-anchor': 'start',
			});
		}
	}

	private _resolveMeterText(voice: ABCVoiceElement): string {
		const meterChild = voice.children.find(child => {
			if (!child.abcelem) return false;
			const type = child.abcelem.el_type;
			const meterType = (child.abcelem as any).type;
			return (
				type === 'meter' ||
				meterType === 'specified' ||
				meterType === 'common_time' ||
				meterType === 'cut_time'
			);
		});
		if (!meterChild || !meterChild.abcelem) return '';
		const meterEl = meterChild.abcelem as any;
		if (meterEl.value && meterEl.value.length > 0) {
			const num = meterEl.value[0].num || '';
			const den = meterEl.value[0].den || '';
			if (num && den) return `${num}/${den}`;
		}
		if (meterEl.type === 'common_time') return '4/4';
		if (meterEl.type === 'cut_time') return '2/2';
		return '';
	}

	// ── 音符、小節線、拍號渲染 ────────────────────────────────────────────────

	private _drawNotes(voice: ABCVoiceElement, printer: ABCPrinter, bartop: number): void {
		for (let i = 0, ii = voice.children.length; i < ii; i++) {
			const child = voice.children[i];
			const type = child.abcelem ? child.abcelem.el_type : null;
			if (type === 'bar') {
				child.draw(printer, bartop);
			} else if (type === 'note') {
				child.draw(printer, bartop);
			} else if (type === 'meter') {
				child.draw(printer, bartop);
			}
		}
	}

	// ── 底線（Underlines）繪製 ────────────────────────────────────────────────

	private _drawUnderlines(voice: ABCVoiceElement, printer: ABCPrinter): void {
		const processedBeams = new Set<any>();

		for (let i = 0; i < voice.children.length; i++) {
			const child = voice.children[i];
			if (child.abcelem.el_type !== 'note') continue;

			if (child.beam) {
				if (processedBeams.has(child.beam)) continue;
				processedBeams.add(child.beam);
				this._drawUnderlineGroup(child.beam.elems, voice, printer);
			} else {
				this._drawUnderlineGroup([child], voice, printer);
			}
		}
	}

	private _getUnderlineCount(el: ABCAbsoluteElement): number {
		if (el.abcelem.el_type !== 'note') return 0;
		const pitches = (el.abcelem as any).pitches;
		if (!pitches || pitches.length === 0) {
			if (!(el.abcelem as any).rest) return 0;
		}
		const { base } = decomposeDuration(el.duration);
		if (base === 0.125) return 1;   // 八分音符
		if (base === 0.0625) return 2;  // 十六分音符
		if (base === 0.03125) return 3; // 三十二分音符
		return 0;
	}

	private _drawUnderlineGroup(elems: ABCAbsoluteElement[], voice: ABCVoiceElement, printer: ABCPrinter): void {
		for (let L = 1; L <= 3; L++) {
			let inRun = false;
			let runStart = -1;

			for (let i = 0; i < elems.length; i++) {
				const hasLayer = this._getUnderlineCount(elems[i]) >= L;
				if (hasLayer) {
					if (!inRun) { inRun = true; runStart = i; }
				} else {
					if (inRun) {
						this._drawUnderlineSegment(elems, runStart, i - 1, L, voice, printer);
						inRun = false;
					}
				}
			}
			if (inRun) {
				this._drawUnderlineSegment(elems, runStart, elems.length - 1, L, voice, printer);
			}
		}
	}

	private _drawUnderlineSegment(
		elems: ABCAbsoluteElement[],
		startIdx: number,
		endIdx: number,
		L: number,
		voice: ABCVoiceElement,
		printer: ABCPrinter,
	): void {
		const y = printer.y;
		const x1 = elems[startIdx].x - 8;
		const x2 = elems[endIdx].x + 8;

		let maxDotsBelow = 0;
		for (let i = startIdx; i <= endIdx; i++) {
			const el = elems[i];
			if ((el.abcelem as any).pitches && (el.abcelem as any).pitches.length > 0) {
				const pitches = (el.abcelem as any).pitches;
				const highest = pitches[pitches.length - 1];
				const keyRoot = (voice.jianpuKey && voice.jianpuKey.root) || 'C';
				const refOctave = voice.jianpuOctave !== undefined ? voice.jianpuOctave : 0;
				const res = pitchToJianpu(highest.pitch, keyRoot, refOctave);
				if (res.octaveDelta < 0) {
					maxDotsBelow = Math.max(maxDotsBelow, Math.abs(res.octaveDelta));
				}
			}
		}

		const lineY = y + 10 + (maxDotsBelow > 0 ? maxDotsBelow * 4 + 2 : 0) + (L - 1) * 4;
		const lineEl = printer.paper.path(`M ${x1} ${lineY} L ${x2} ${lineY}`).attr({
			stroke: '#000000',
			'stroke-width': 1.5,
		});
		printer.bindInteraction(lineEl, elems[startIdx]);
	}
}
