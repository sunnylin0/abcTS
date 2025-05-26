// abc_plugin.ts: Find everything which looks like abc and convert it

// Copyright (C) Gregory Dyke (gregdyke at gmail dot com)
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version  of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

// requires: abcjs, raphael

interface ABCPluginOptions {
	show_midi: boolean;
	hide_abc: boolean;
	render_before: boolean;
	midi_options: {};
	parse_options: {};
	render_options: {};
	render_classname: string;
	text_classname: string;
	auto_render_threshold: number;
	show_text: string;
	hide_text: string;
}

class ABCPlugin {
	show_midi: boolean;
	hide_abc: boolean;
	render_before: boolean;
	midi_options: {};
	parse_options: {};
	render_options: {};
	render_classname: string;
	text_classname: string;
	auto_render_threshold: number;
	show_text: string;
	hide_text: string;
	errors: string;
	auto_render: boolean;

	constructor(options: Partial<ABCPluginOptions> = {}) {
		this.show_midi = options.show_midi ?? true;
		this.hide_abc = options.hide_abc ?? false;
		this.render_before = options.render_before ?? false;
		this.midi_options = options.midi_options ?? {};
		this.parse_options = options.parse_options ?? {};
		this.render_options = options.render_options ?? {};
		this.render_classname = options.render_classname ?? "abcrendered";
		this.text_classname = options.text_classname ?? "abctext";
		this.auto_render_threshold = options.auto_render_threshold ?? 20;
		this.show_text = options.show_text ?? "show score for: ";
		this.hide_text = options.hide_text ?? "hide score for: ";
		this.errors = "";
		this.auto_render = false;
	}

	start(rootElement: HTMLElement) {
		this.errors = "";
		const elems = this.getABCContainingElements(rootElement);
		const self = this;
		const divs = elems.map(elem => self.convertToDivs(elem));
		this.auto_render = divs.length <= this.auto_render_threshold;
		divs.forEach(elem => self.render(elem, elem.getAttribute("data-abctext")));
	}

	getABCContainingElements(elem: HTMLElement): HTMLElement[] {
		const results: HTMLElement[] = [];
		let includeself = false;
		const self = this;

		function recurse(node: Node): void {
			if (node.nodeType === Node.TEXT_NODE && !includeself) {
				if (node.nodeValue.match(/^\s*X:/m)) {
					results.push(elem);
					includeself = true;
				}
			} else if (node.nodeType === Node.ELEMENT_NODE) {
				recurse(node);
			}
		}

		recurse(elem);
		return results;
	}

	convertToDivs(elem: HTMLElement): HTMLElement {
		const self = this;
		const contents = elem.childNodes;
		let abctext = "";
		let abcdiv: HTMLElement | null = null;
		let inabc = false;
		let brcount = 0;

		function recurse(node: HTMLElement): void {
			if (node.nodeType === Node.TEXT_NODE && node.nodeValue.trim() !== "") {
				brcount = 0;
				const text = node.nodeValue;
				if (text.match(/^\s*X:/m)) {
					inabc = true;
					abctext = "";
					abcdiv = document.createElement("div");
					abcdiv.className = self.text_classname;
					elem.insertBefore(abcdiv, node);
					if (self.hide_abc) {
						abcdiv.style.display = "none";
					}
				}
				if (inabc) {
					abctext += text.replace(/\n$/, "").replace(/^\n/, "");
					abcdiv.appendChild(node);
				}
			} else if (inabc && node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR" && brcount === 0) {
				abctext += "\n";
				abcdiv.appendChild(node);
				brcount++;
			} else if (inabc) { // second BR or whitespace text node
				inabc = false;
				brcount = 0;
				abcdiv.setAttribute("data-abctext", abctext);
			}
		}

		Array.from(contents).forEach(node => recurse(node));
		if (inabc) {
			abcdiv.setAttribute("data-abctext", abctext);
		}
		return abcdiv!;
	}

	render(contextnode: HTMLElement, abcstring: string) {
		let abcdiv = document.createElement("div");
		abcdiv.className = this.render_classname;
		if (this.render_before) {
			contextnode.parentNode!.insertBefore(abcdiv, contextnode);
		} else {
			contextnode.parentNode!.insertBefore(abcdiv, contextnode.nextSibling);
		}

		try {
			const tunebook = new AbcTuneBook(abcstring);
			const abcParser = new AbcParse();
			abcParser.parse(tunebook.tunes[0].abc);
			const tune = abcParser.getTune();

			const doPrint = () => {
				try {
					const paper = Raphael(abcdiv, 800, 400);
					const printer = new ABCPrinter(paper, this.render_options);
					printer.printABC(tune);
				} catch (ex) { // f*** internet explorer doesn't like innerHTML in weird situations
					abcdiv.remove();
					abcdiv = document.createElement("div");
					abcdiv.className = this.render_classname;
					if (this.render_before) {
						contextnode.parentNode!.insertBefore(abcdiv, contextnode);
					} else {
						contextnode.parentNode!.insertBefore(abcdiv, contextnode.nextSibling);
					}

					const paper = Raphael(abcdiv, 800, 4000);
					const printer = new ABCPrinter(paper);
					printer.printABC(tune);
				}

				if (ABCMidiWriter && this.show_midi) {
					const midiwriter = new ABCMidiWriter(abcdiv, this.midi_options);
					midiwriter.writeABC(tune);
				}
			};

			const showtext = `< a class='abcshow' href = '#' > ${this.show_text}${tune.metaText.title || "untitled"} </a>`;

			if (this.auto_render) {
				doPrint();
			} else {
				const showspan = document.createElement("span");
				showspan.innerHTML = showtext;
				showspan.addEventListener("click", () => {
					doPrint();
					showspan.remove();
					return false;
				});
				abcdiv.parentNode!.insertBefore(showspan, abcdiv);
			}

		} catch (e) {
			this.errors += e;
		}
	}
}

// Usage Example
document.addEventListener("DOMContentLoaded", () => {
	const abcPlugin = new ABCPlugin();
	abcPlugin.start(document.body);
});

// Note: The following classes and functions (AbcTuneBook, AbcParse, ABCPrinter, ABCMidiWriter)
// need to be implemented separately as they are not part of the standard libraries.
