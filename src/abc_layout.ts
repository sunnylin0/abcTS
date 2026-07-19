//    abc_layout.js: Creates a data structure suitable for printing a line of abc
//    Copyright (C) 2010 Gregory Dyke (gregdyke at gmail dot com)
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


import {
	ABCAbsoluteElement, ABCRelativeElement, ABCVoiceElement, ABCStaffGroupElement
	, ABCTieElem, ABCTripletElem, ABCBeamElem, ABCEndingElem
} from "./abc_graphelements"

export function getDuration(elem: ABCElement): number {
	let d = 0;
	if (elem) {
		if (elem.duration)
			d = elem.duration;
		else if (elem.pitches && elem.pitches[0])
			d = elem.pitches[0].duration;
	}
	return d;
}

export function getDurlog(duration: number): number {
	return Math.floor(Math.log(duration) / Math.log(2));
}

// ABCLayout 類別定義
export class ABCLayout {
	glyphs: ABCGlyphs;
	y: number;
	isBagpipes: boolean;
	chartable: any;
	staffgroup: ABCStaffGroupElement;
	staff: ABCVoiceElement;
	stemdir: string;
	slurs: ABCTieElem[];
	ties: ABCTieElem[];
	slursbyvoice: any;
	tiesbyvoice: any;
	endingsbyvoice: any;
	s: number; // 目前樂譜行號
	v: number; // 當前聲部號
	voice: ABCVoiceElement;
	abcline: NoteElement[];
	pos: number;
	partstartelem: ABCEndingElem;
	startlimitelem;
	roomtaken: number;
	accidentalshiftx: number;
	triplet: ABCTripletElem;

	constructor(glyphs: ABCGlyphs, bagpipes: boolean) {
		this.glyphs = glyphs;
		this.isBagpipes = bagpipes;
		this.chartable = {
			rest: { 0: "rests.whole", 1: "rests.half", 2: "rests.quarter", 3: "rests.8th", 4: "rests.16th", 5: "rests.32nd", 6: "rests.64th", 7: "rests.128th" },
			note: { "-1": "noteheads.dbl", 0: "noteheads.whole", 1: "noteheads.half", 2: "noteheads.quarter", 3: "noteheads.quarter", 4: "noteheads.quarter", 5: "noteheads.quarter", 6: "noteheads.quarter" },
			uflags: { 3: "flags.u8th", 4: "flags.u16th", 5: "flags.u32nd", 6: "flags.u64th" },
			dflags: { 3: "flags.d8th", 4: "flags.d16th", 5: "flags.d32nd", 6: "flags.d64th" }
		};
		this.slurs = [];
		this.ties = [];
		this.slursbyvoice = {};
		this.tiesbyvoice = {};
		this.endingsbyvoice = {};
		this.s = 0; // current staff number
		this.v = 0; // current voice number on current staff
	}

	getCurrentVoiceId(): string {
		return "s" + this.s + "v" + this.v;
	}

	pushCrossLineElems(): void {
		this.slursbyvoice[this.getCurrentVoiceId()] = this.slurs;
		this.tiesbyvoice[this.getCurrentVoiceId()] = this.ties;
		this.endingsbyvoice[this.getCurrentVoiceId()] = this.partstartelem;
	}

	popCrossLineElems(): void {
		this.slurs = this.slursbyvoice[this.getCurrentVoiceId()] || {};
		this.ties = this.tiesbyvoice[this.getCurrentVoiceId()] || [];
		this.partstartelem = this.endingsbyvoice[this.getCurrentVoiceId()];
	}

	getElem(): NoteElement {
		if (this.abcline.length <= this.pos)
			return null;
		return this.abcline[this.pos];
	}

	getNextElem(): NoteElement {
		if (this.abcline.length <= this.pos + 1)
			return null;
		return this.abcline[this.pos + 1];
	}

	printABCLine(staffs: Staff[], y: number): ABCStaffGroupElement {
		this.y = y;
		this.staffgroup = new ABCStaffGroupElement();
		for (this.s = 0; this.s < staffs.length; this.s++) {
			this.printABCStaff(staffs[this.s]);
			if (this.s !== staffs.length - 1)
				this.y += (AbcSpacing.STAVEHEIGHT * 0.8); // staffgroups a bit closer than others
		}
		return this.staffgroup;
	}

	printABCStaff(abcstaff: Staff): void {
		let header = "";
		if (abcstaff.bracket) header += "bracket " + abcstaff.bracket + " ";
		if (abcstaff.brace) header += "brace " + abcstaff.brace + " ";

		for (this.v = 0; this.v < abcstaff.voices.length; this.v++) {
			this.voice = new ABCVoiceElement(this.y, this.v, abcstaff.voices.length);
			if (this.v === 0) {
				this.voice.barfrom = (abcstaff.connectBarLines === "start" || abcstaff.connectBarLines === "continue");
				this.voice.barto = (abcstaff.connectBarLines === "continue" || abcstaff.connectBarLines === "end");
			} else {
				this.voice.duplicate = true; // barlines and other duplicate info need not be printed
			}
			if (abcstaff.title && abcstaff.title[this.v]) this.voice.header = abcstaff.title[this.v];
			// TODO make invisible if voice is duplicate
			this.voice.addChild(this.printClef(abcstaff.clef));
			this.voice.addChild(this.printKeySignature(abcstaff.key));
			if (abcstaff.meter) this.voice.addChild(this.printTimeSignature(abcstaff.meter));
			this.printABCVoice(abcstaff.voices[this.v]);
			this.staffgroup.addVoice(this.voice);
		}
	}

	printABCVoice(abcline: NoteElement[]): void {
		this.popCrossLineElems();
		this.stemdir = (this.isBagpipes) ? "down" : null;
		this.abcline = abcline;
		if (this.partstartelem) {
			this.partstartelem = new ABCEndingElem("", null, null);
			this.voice.addOther(this.partstartelem);
		}
		for (let slur in this.slurs) {
			if (this.slurs.hasOwnProperty(slur)) {
				this.slurs[slur] = new ABCTieElem(null, null, this.slurs[slur].above);
				this.voice.addOther(this.slurs[slur]);
			}
		}
		for (let i = 0; i < this.ties.length; i++) {
			this.ties[i] = new ABCTieElem(null, null, this.ties[i].above);
			this.voice.addOther(this.ties[i]);
		}
		for (this.pos = 0; this.pos < this.abcline.length; this.pos++) {
			const abselems: ABCAbsoluteElement[] = this.printABCElement();
			for (let i = 0; i < abselems.length; i++) {
				this.voice.addChild(abselems[i]);
			}
		}
		this.pushCrossLineElems();
	};

	printABCElement(): ABCAbsoluteElement[] {
		let elemset: ABCAbsoluteElement[] = [];
		const elem = this.getElem();
		let abselem: ABCAbsoluteElement;
		switch (elem.el_type) {
			case "note":
				elemset = this.printBeam();
				break;
			case "bar":
				elemset.push(this.printBarLine(elem));
				if (this.voice.duplicate) elemset[0].invisible = true;
				break;
			case "meter":
				elemset.push(this.printTimeSignature(elem));
				if (this.voice.duplicate) elemset[0].invisible = true;
				break;
			case "clef":
				elemset.push(this.printClef(elem));
				if (this.voice.duplicate) elemset[0].invisible = true;
				break;
			case "key":
				elemset.push(this.printKeySignature(elem));
				if (this.voice.duplicate) elemset[0].invisible = true;
				break;
			case "stem":
				this.stemdir = elem.direction;
				break;
			case "part":
				abselem = new ABCAbsoluteElement(elem, 0, 0);
				abselem.addChild(new ABCRelativeElement(elem.title, 0, 0, 18, { type: "text", attributes: { "font-weight": "bold", "font-size": "16px", "font-family": "serif" } }));
				elemset[0] = abselem;
				break;
			default:
				abselem = new ABCAbsoluteElement(elem, 0, 0);
				abselem.addChild(new ABCRelativeElement("element type " + elem.el_type, 0, 0, 0, { type: "debug" }));
				elemset.push(abselem);
		}
		return elemset;
	}

	printBeam(): ABCAbsoluteElement[] {
		let abselemset: ABCAbsoluteElement[] = [];
		if (this.getElem().startBeam && !this.getElem().endBeam) {
			let beamelem: ABCBeamElem = new ABCBeamElem(this.stemdir);
			while (this.getElem()) {
				let abselem: ABCAbsoluteElement = this.printNote(this.getElem(), true);
				abselemset.push(abselem);
				beamelem.add(abselem);
				if (this.getElem().endBeam) {
					break;
				}
				this.pos++;
			}
			this.voice.addOther(beamelem);
		} else {
			abselemset.push(this.printNote(this.getElem()));
		}
		return abselemset;
	}

	sortPitch(elem: ABCElement): void {
		let sorted = false;
		let tmp;
		do {
			sorted = true;
			for (let p = 0; p < elem.pitches.length - 1; p++) {
				if (elem.pitches[p].pitch > elem.pitches[p + 1].pitch) {
					sorted = false;
					tmp = elem.pitches[p];
					elem.pitches[p] = elem.pitches[p + 1];
					elem.pitches[p + 1] = tmp;
				}
			}
		} while (!sorted);
	}

	printNote(elem: ABCElement, nostem?: boolean): ABCAbsoluteElement {
		let notehead: any = null;
		let grace: any = null;
		this.roomtaken = 0; // room needed to the left of the note
		let dotshiftx = 0;
		let c = "";
		let flag: any = null;
		let p, i, pp;
		let width, p1, p2, dx;
		let duration = getDuration(elem);
		let durlog = Math.floor(Math.log(duration) / Math.log(2));
		let dot = 0;
		for (let tot = Math.pow(2, durlog), inc = tot / 2; tot < duration; dot++, tot += inc, inc /= 2);

		let abselem: ABCAbsoluteElement = new ABCAbsoluteElement(elem, duration, 1);

		if (elem.rest) {
			switch (elem.rest.type) {
				case "rest":
					c = this.chartable["rest"][-durlog];
					elem.averagepitch = 7;
					elem.minpitch = 7;
					elem.maxpitch = 7;
					break; // TODO rests in bars is now broken
				case "invisible":
				case "spacer":
					c = "";
			}
			notehead = this.printNoteHead(abselem, c, { verticalPos: 7 }, null, 0, -this.roomtaken, null, dot, 0, 1);
			if (notehead) abselem.addHead(notehead);
			this.roomtaken += this.accidentalshiftx;
		} else {
			this.sortPitch(elem);

			// determine averagepitch, minpitch, maxpitch and stem direction
			let sum = 0;
			for (p = 0, pp = elem.pitches.length; p < pp; p++) {
				sum += elem.pitches[p].verticalPos;
			}
			elem.averagepitch = sum / elem.pitches.length;
			elem.minpitch = elem.pitches[0].verticalPos;
			elem.maxpitch = elem.pitches[elem.pitches.length - 1].verticalPos;
			let dir = (elem.averagepitch >= 6) ? "down" : "up";
			if (this.stemdir) dir = this.stemdir;

			// determine elements of chords which should be shifted
			for (p = (dir === "down") ? elem.pitches.length - 2 : 1; (dir === "down") ? p >= 0 : p < elem.pitches.length; p = (dir === "down") ? p - 1 : p + 1) {
				const prev = elem.pitches[(dir === "down") ? p + 1 : p - 1];
				const curr = elem.pitches[p];
				const delta = (dir === "down") ? prev.pitch - curr.pitch : curr.pitch - prev.pitch;
				if (delta <= 1 && !prev.printer_shift) {
					curr.printer_shift = (delta) ? "different" : "same";
					if (dir == "down") {
						this.roomtaken = this.glyphs.getSymbolWidth(this.chartable["note"][-durlog]) + 2;
					} else {
						dotshiftx = this.glyphs.getSymbolWidth(this.chartable["note"][-durlog]) + 2;
					}
				}
			}

			for (p = 0; p < elem.pitches.length; p++) {
				if (!nostem) {
					if ((dir === "down" && p !== 0) || (dir === "up" && p != pp - 1)) { // not the stemmed elem of the chord
						flag = null;
					} else {
						flag = this.chartable[(dir == "down") ? "dflags" : "uflags"][-durlog];
					}
					c = this.chartable["note"][-durlog];
				} else {
					c = "noteheads.quarter";
				}

				if ((dir == "down" && p == pp - 1) || (dir == "up" && p == 0)) { // place to put slurs if not already on pitches
					if (elem.startSlur) {
						elem.pitches[p].startSlur = elem.startSlur;
					}

					if (elem.endSlur) {
						elem.pitches[p].endSlur = elem.endSlur;
					}
				}

				notehead = this.printNoteHead(abselem, c, elem.pitches[p], dir, 0, -this.roomtaken, flag, dot, dotshiftx, 1);
				if (notehead) abselem.addHead(notehead);
				this.roomtaken += this.accidentalshiftx;
			}

			// draw stem from the furthest note to a pitch above/below the stemmed note
			if (!nostem && durlog <= -1) {
				p1 = (dir === "down") ? elem.minpitch - 7 : elem.minpitch + 1 / 3;
				p2 = (dir === "down") ? elem.maxpitch - 1 / 3 : elem.maxpitch + 7;
				dx = (dir === "down") ? 0 : abselem.heads[0].w;
				width = (dir === "down") ? 1 : -1;
				abselem.addExtra(new ABCRelativeElement(null, dx, 0, p1, { "type": "stem", "pitch2": p2, linewidth: width }));
			}
		}

		if (elem.lyric !== undefined) {
			let lyricStr = "";
			elem.lyric.forEach(function (ly) {
				lyricStr += ly.syllable + ly.divider + "\n";
			});
			abselem.addChild(new ABCRelativeElement(lyricStr, 0, 0, 0, { type: "debugLow" }));
		}

		if (elem.gracenotes !== undefined) {
			const gracescale = 3 / 5;
			let gracebeam: ABCBeamElem = null;
			if (elem.gracenotes.length > 1) {
				gracebeam = new ABCBeamElem("grace", this.isBagpipes);
			}

			let graceoffsets: number[] = [];
			for (i = elem.gracenotes.length - 1; i >= 0; i--) { // figure out where to place each gracenote
				this.roomtaken += 10;
				graceoffsets[i] = this.roomtaken;
				if (elem.gracenotes[i].accidental) {
					this.roomtaken += 7;
				}
			}

			for (i = 0; i < elem.gracenotes.length; i++) {
				let gracepitch = elem.gracenotes[i].verticalPos;

				flag = (gracebeam) ? null : this.chartable["uflags"][(this.isBagpipes) ? 5 : 3];
				grace = this.printNoteHead(abselem, "noteheads.quarter", elem.gracenotes[i], "up", -graceoffsets[i], -graceoffsets[i], flag, 0, 0, gracescale);
				abselem.addExtra(grace);

				if (gracebeam) { // give the beam the necessary info
					let pseudoabselem: ABCBeamElem = {
						heads: [grace],
						abcelem: { averagepitch: gracepitch, minpitch: gracepitch, maxpitch: gracepitch },
						duration: (this.isBagpipes) ? 1 / 32 : 1 / 16
					};
					gracebeam.add(pseudoabselem);
				} else { // draw the stem
					p1 = gracepitch + 1 / 3 * gracescale;
					p2 = gracepitch + 7 * gracescale;
					dx = grace.dx + grace.w;
					width = -0.6;
					abselem.addExtra(new ABCRelativeElement(null, dx, 0, p1, { "type": "stem", "pitch2": p2, linewidth: width }));
				}

				if (i == 0 && !this.isBagpipes) this.voice.addOther(new ABCTieElem(grace, notehead, false, true));
			}

			if (gracebeam) {
				this.voice.addOther(gracebeam);
			}
		}

		if (elem.decoration) {
			this.printDecoration(elem.decoration, elem.maxpitch, (notehead) ? notehead.w : 0, abselem, this.roomtaken);
		}

		if (elem.barNumber) {
			abselem.addChild(new ABCRelativeElement(elem.barNumber, -10, 0, 0, { type: "debug" }));
		}

		// ledger lines
		for (i = elem.maxpitch; i > 11; i--) {
			if (i % 2 === 0 && !elem.rest) {
				abselem.addChild(new ABCRelativeElement(null, -2, this.glyphs.getSymbolWidth(c) + 4, i, { type: "ledger" }));
			}
		}

		for (i = elem.minpitch; i < 1; i++) {
			if (i % 2 === 0 && !elem.rest) {
				abselem.addChild(new ABCRelativeElement(null, -2, this.glyphs.getSymbolWidth(c) + 4, i, { type: "ledger" }));
			}
		}

		if (elem.chord !== undefined) { //16 -> high E.
			abselem.addChild(new ABCRelativeElement(elem.chord.name, 0, 0, (elem.chord.position == "below") ? -3 : 16, { type: "text" }));
		}

		if (elem.startTriplet) {
			this.triplet = new ABCTripletElem(elem.startTriplet, notehead, null, true);
			this.voice.addOther(this.triplet);
		}

		if (elem.endTriplet) {
			this.triplet.anchor2 = notehead;
			this.triplet = null;
		}

		return abselem;
	}

	printNoteHead(abselem: ABCAbsoluteElement, c: string, pitchelem: any, dir: string, headx: number, extrax: number, flag: string, dot: number, dotshiftx: number, scale: number): ABCRelativeElement {
		// TODO scale the dot as well
		let pitch = pitchelem.verticalPos;
		let notehead: any;
		let i;
		this.accidentalshiftx = 0;
		if (c === undefined)
			abselem.addChild(new ABCRelativeElement("pitch is undefined", 0, 0, 0, { type: "debug" }));
		else if (c === "") {
			notehead = new ABCRelativeElement(null, 0, 0, pitch);
		} else {
			let shiftheadx = headx;
			if (pitchelem.printer_shift) {
				let adjust = (pitchelem.printer_shift == "same") ? 1 : 0;
				shiftheadx = (dir == "down") ? -this.glyphs.getSymbolWidth(c) * scale + adjust : this.glyphs.getSymbolWidth(c) * scale - adjust;
			}
			notehead = new ABCRelativeElement(c, shiftheadx, this.glyphs.getSymbolWidth(c) * scale, pitch, { scalex: scale, scaley: scale });
			if (flag) {
				let pos: number = pitch + ((dir == "down") ? -7 : 7) * scale;
				let xdelta: number = (dir == "down") ? headx : headx + notehead.w - 0.6;
				abselem.addRight(new ABCRelativeElement(flag, xdelta, this.glyphs.getSymbolWidth(flag) * scale, pos, { scalex: scale, scaley: scale }));
			}
			for (; dot > 0; dot--) {
				var dotadjusty: number = (1 - pitch % 2); //TODO don't adjust when above or below stave?
				abselem.addRight(new ABCRelativeElement("dots.dot", notehead.w + dotshiftx - 2 + 5 * dot, this.glyphs.getSymbolWidth("dots.dot"), pitch + dotadjusty));
			}
		}

		if (pitchelem.accidental) {
			let symb: string;
			switch (pitchelem.accidental) {
				case "quartersharp":
					symb = "accidentals.halfsharp";
					break;
				case "dblsharp":
					symb = "accidentals.dblsharp";
					break;
				case "sharp":
					symb = "accidentals.sharp";
					break;
				case "quarterflat":
					symb = "accidentals.halfflat";
					break;
				case "flat":
					symb = "accidentals.flat";
					break;
				case "dblflat":
					symb = "accidentals.dblflat";
					break;
				case "natural":
					symb = "accidentals.nat";
			}
			this.accidentalshiftx = (this.glyphs.getSymbolWidth(symb) * scale + 2);
			abselem.addExtra(new ABCRelativeElement(symb, extrax - this.accidentalshiftx, this.glyphs.getSymbolWidth(symb), pitch, { scalex: scale, scaley: scale }));
		}

		if (pitchelem.endTie) {
			if (this.ties[0]) {
				this.ties[0].anchor2 = notehead;
				this.ties = this.ties.slice(1, this.ties.length);
			}
		}

		if (pitchelem.startTie) {
			let tie: ABCTieElem = new ABCTieElem(notehead, null, (dir == "down"));
			this.ties[this.ties.length] = tie;
			this.voice.addOther(tie);
		}

		if (pitchelem.endSlur) {
			for (i = 0; i < pitchelem.endSlur.length; i++) {
				let slurid = pitchelem.endSlur[i];
				let slur;
				if (this.slurs[slurid]) {
					slur = this.slurs[slurid].anchor2 = notehead;
					delete this.slurs[slurid];
				} else {
					slur = new ABCTieElem(null, notehead, (dir == "down"));
					this.voice.addOther(slur);
				}
				if (this.startlimitelem) {
					slur.startlimitelem = this.startlimitelem;
				}
			}
		}

		if (pitchelem.startSlur) {
			for (i = 0; i < pitchelem.startSlur.length; i++) {
				let slurid = pitchelem.startSlur[i];
				let slur: ABCTieElem = new ABCTieElem(notehead, null, (dir == "down"));
				this.slurs[slurid] = slur;
				this.voice.addOther(slur);
			}
		}
		return notehead;
	}

	printDecoration(decoration: string[], pitch: number, width: number, abselem: ABCAbsoluteElement, roomtaken?: number): void {
		let dec: any;
		let unknowndecs: string[] = [];
		let yslot: number = (pitch > 9) ? pitch + 3 : 12;
		let ypos: number;
		let i;
		roomtaken = roomtaken || 0;
		(pitch === 5) && (yslot = 14); // avoid upstem of the A

		for (i = 0; i < decoration.length; i++) { // treat staccato first (may need to shift other markers) //TODO, same with tenuto?
			if (decoration[i] === "staccato") {
				ypos = ((this.stemdir === "down" || pitch >= 6) && this.stemdir !== "up") ? pitch + 2 : pitch - 2;
				(pitch === 4) && ypos--; // don't place on a stave line
				((pitch === 6) || (pitch === 8)) && ypos++;
				(pitch > 9) && yslot++; // take up some room of those that are above
				let deltax: number = width / 2;
				if (this.glyphs.getSymbolAlign("scripts.staccato") !== "center") {
					deltax -= (this.glyphs.getSymbolWidth(dec) / 2);
				}
				abselem.addChild(new ABCRelativeElement("scripts.staccato", deltax, this.glyphs.getSymbolWidth("scripts.staccato"), ypos));
			}
			if (decoration[i] === "slide" && abselem.heads[0]) {
				ypos = abselem.heads[0].pitch;
				const blank1: ABCRelativeElement = new ABCRelativeElement("", -roomtaken - 15, 0, ypos - 1);
				const blank2: ABCRelativeElement = new ABCRelativeElement("", -roomtaken - 5, 0, ypos + 1);
				abselem.addChild(blank1);
				abselem.addChild(blank2);
				this.voice.addOther(new ABCTieElem(blank1, blank2, false));
			}
		}

		for (i = 0; i < decoration.length; i++) {
			switch (decoration[i]) {
				case "trill": dec = "scripts.trill"; break;
				case "roll": dec = "scripts.roll"; break;
				case "marcato": dec = "scripts.umarcato"; break;
				case "marcato2": dec = "scriopts.dmarcato"; break; //other marcato
				case "turn": dec = "scripts.turn"; break;
				case "uppermordent": dec = "scripts.prall"; break;
				case "mordent":
				case "lowermordent": dec = "scripts.mordent"; break;
				case "staccato":
				case "slide": continue;
				case "downbow": dec = "scripts.downbow"; break;
				case "upbow": dec = "scripts.upbow"; break;
				case "fermata": dec = "scripts.ufermata"; break;
				case "invertedfermata": dec = "scripts.dfermata"; break;
				case "breath": dec = ","; break;
				case "accent": dec = "scripts.sforzato"; break;
				case "tenuto": dec = "scripts.tenuto"; break;
				case "coda": dec = "scripts.coda"; break;
				case "segno": dec = "scripts.segno"; break;
				case "p":
				case "mp":
				case "ppp":
				case "pppp":
				case "f":
				case "ff":
				case "fff":
				case "ffff":
				case "sfz":
				case "mf": dec = decoration[i]; break;
				default:
					unknowndecs.push(decoration[i]);
					continue;
			}
			ypos = yslot;
			yslot += 3;
			let deltax = width / 2;
			if (this.glyphs.getSymbolAlign(dec) !== "center") {
				deltax -= (this.glyphs.getSymbolWidth(dec) / 2);
			}
			abselem.addChild(new ABCRelativeElement(dec, deltax, this.glyphs.getSymbolWidth(dec), ypos));
		}
		if (unknowndecs.length > 0) abselem.addChild(new ABCRelativeElement(unknowndecs.join(','), 0, 0, 0, { type: "debug" }));
	}

	printBarLine(elem: ABCElement): ABCAbsoluteElement {
		// bar_thin, bar_thin_thick, bar_thin_thin, bar_thick_thin, bar_right_repeat, bar_left_repeat, bar_double_repeat

		const abselem = new ABCAbsoluteElement(elem, 0, 10);
		let anchor = null; // place to attach part lines
		let dx = 0;

		const firstdots: boolean = (elem.type === "bar_right_repeat" || elem.type === "bar_dbl_repeat");
		const firstthin: boolean = (elem.type !== "bar_left_repeat" && elem.type !== "bar_thick_thin");
		const thick: boolean = (elem.type === "bar_right_repeat" || elem.type === "bar_dbl_repeat" || elem.type === "bar_left_repeat" ||
			elem.type === "bar_thin_thick" || elem.type === "bar_thick_thin");
		const secondthin: boolean = (elem.type === "bar_left_repeat" || elem.type === "bar_thick_thin" || elem.type === "bar_thin_thin" || elem.type === "bar_dbl_repeat");
		const seconddots: boolean = (elem.type === "bar_left_repeat" || elem.type === "bar_dbl_repeat");

		// limit positionning of slurs
		if (firstdots || seconddots) {
			for (let slur in this.slurs) {
				if (this.slurs.hasOwnProperty(slur)) {
					this.slurs[slur].endlimitelem = abselem;
				}
			}
			this.startlimitelem = abselem;
		}

		if (firstdots) {
			abselem.addRight(new ABCRelativeElement("dots.dot", dx, 1, 7));
			abselem.addRight(new ABCRelativeElement("dots.dot", dx, 1, 5));
			dx += 6; //2 hardcoded, twice;
		}

		if (firstthin) {
			anchor = new ABCRelativeElement(null, dx, 1, 2, { "type": "bar", "pitch2": 10, linewidth: 0.6 });
			abselem.addRight(anchor);
		}

		if (elem.decoration) {
			this.printDecoration(elem.decoration, 12, (thick) ? 3 : 1, abselem);
		}

		if (thick) {
			dx += 4; //3 hardcoded;    
			anchor = new ABCRelativeElement(null, dx, 4, 2, { "type": "bar", "pitch2": 10, scalex: 8, linewidth: 0.6 });
			abselem.addRight(anchor);
			dx += 5;
		}

		if (this.partstartelem && elem.endEnding) {
			this.partstartelem.anchor2 = anchor;
			this.partstartelem = null;
		}

		if (secondthin) {
			dx += 3; //3 hardcoded;
			anchor = new ABCRelativeElement(null, dx, 1, 2, { "type": "bar", "pitch2": 10, linewidth: 0.6 });
			abselem.addRight(anchor); // 3 is hardcoded
		}

		if (seconddots) {
			dx += 3; //3 hardcoded;
			abselem.addRight(new ABCRelativeElement("dots.dot", dx, 1, 7));
			abselem.addRight(new ABCRelativeElement("dots.dot", dx, 1, 5));
		} // 2 is hardcoded

		if (elem.startEnding) {
			this.partstartelem = new ABCEndingElem(elem.startEnding, anchor, null);
			this.voice.addOther(this.partstartelem);
		}

		return abselem;

	}

	printClef(elem: ClefElement): ABCAbsoluteElement {
		let clef: string = "clefs.G";
		let pitch: number = 4;
		let abselem: ABCAbsoluteElement = new ABCAbsoluteElement(elem, 0, 10);
		switch (elem.type) {
			case "treble": break;
			case "tenor": clef = "clefs.C"; pitch = 8; break;
			case "alto": clef = "clefs.C"; pitch = 6; break;
			case "bass": clef = "clefs.F"; pitch = 8; break;
			case 'treble+8': break;
			case 'tenor+8': clef = "clefs.C"; pitch = 8; break;
			case 'bass+8': clef = "clefs.F"; pitch = 8; break;
			case 'alto+8': clef = "clefs.C"; pitch = 6; break;
			case 'treble-8': break;
			case 'tenor-8': clef = "clefs.C"; pitch = 8; break;
			case 'bass-8': clef = "clefs.F"; pitch = 8; break;
			case 'alto-8': clef = "clefs.C"; pitch = 6; break;
			default: abselem.addChild(new ABCRelativeElement("clef=" + elem.type, 0, 0, 0, { type: "debug" }));
		}
		if (elem.verticalPos) {
			pitch = elem.verticalPos;
		}

		let dx = 10;
		abselem.addRight(new ABCRelativeElement(clef, dx, this.glyphs.getSymbolWidth(clef), pitch));
		return abselem;
	}

	printKeySignature(elem: KeySigElement): ABCAbsoluteElement {
		let abselem: ABCAbsoluteElement = new ABCAbsoluteElement(elem, 0, 10);
		let dx: number = 0;
		if (elem.accidentals) {
			for (let acc of elem.accidentals) {
				let symbol = (acc.acc === "sharp") ? "accidentals.sharp" : (acc.acc === "natural") ? "accidentals.nat" : "accidentals.flat";
				abselem.addRight(new ABCRelativeElement(symbol, dx, this.glyphs.getSymbolWidth(symbol), acc.verticalPos));
				dx += this.glyphs.getSymbolWidth(symbol) + 2;
			}
		}
		this.startlimitelem = abselem; // limit ties here
		return abselem;
	}

	printTimeSignature(elem: ABCElement): ABCAbsoluteElement {
		const abselem = new ABCAbsoluteElement(elem, 0, 20);

		if (elem.type === "specified") {
			// 處理指定拍號類型
			for (let i = 0; i < elem.value.length; i++) {
				if (i !== 0) {
					abselem.addRight(new ABCRelativeElement('+', i * 20 - 9, this.glyphs.getSymbolWidth("+"), 7));
				}
				abselem.addRight(new ABCRelativeElement(
					elem.value[i].num, i * 20,
					this.glyphs.getSymbolWidth(elem.value[i].num.charAt(0)) * elem.value[i].num.length,
					9));
				abselem.addRight(new ABCRelativeElement(
					elem.value[i].den, i * 20, this.glyphs.getSymbolWidth(elem.value[i].den.charAt(0)) * elem.value[i].den.length,
					5));
			}
		} else if (elem.type === "common_time") {
			abselem.addRight(new ABCRelativeElement(
				"timesig.common", 0, this.glyphs.getSymbolWidth("timesig.common"), 7));
		} else if (elem.type === "cut_time") {
			abselem.addRight(new ABCRelativeElement(
				"timesig.cut", 0, this.glyphs.getSymbolWidth("timesig.cut"), 7));
		}

		this.startlimitelem = abselem; // 限制連線位置
		return abselem;
	}
}