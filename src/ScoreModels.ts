import { types, Instance, getParent, resolveIdentifier } from "mobx-state-tree";

// --- Helper Functions ---

const NOTE_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const SCALE_OFFSETS = [0, 2, 4, 5, 7, 9, 11]; // C Major intervals

/**
 * 將 MIDI 音高轉換為 ABC 字串
 * @param midi MIDI 數值 (60 = Middle C)
 * @param accidental 升降記號狀態
 */
function getABCPitch(midi: number, accidental: string): string {
    let baseMidi = midi;
    let accStr = "";

    // 根據 accidental 調整 baseMidi 以找到對應的白鍵
    if (accidental === "sharp") {
        baseMidi -= 1;
        accStr = "^";
    } else if (accidental === "flat") {
        baseMidi += 1;
        accStr = "_";
    } else if (accidental === "natural") {
        accStr = "=";
    } else if (accidental === "dbl_sharp") {
        baseMidi -= 2;
        accStr = "^^";
    } else if (accidental === "dbl_flat") {
        baseMidi += 2;
        accStr = "__";
    }

    // 計算八度與音名
    // MIDI 60 (C4) 在 ABC 中是 "C"
    // MIDI 72 (C5) 在 ABC 中是 "c"
    const octave = Math.floor(baseMidi / 12) - 1;
    const chroma = baseMidi % 12;

    // 尋找對應的音名索引 (0=C, 1=D, ...)
    let stepIndex = SCALE_OFFSETS.indexOf(chroma);
    
    // 如果找不到 (例如是黑鍵但 accidental 為 none)，預設當作升號處理
    if (stepIndex === -1) {
        stepIndex = SCALE_OFFSETS.indexOf(chroma - 1);
        if (stepIndex === -1) stepIndex = 0; 
        if (accStr === "") accStr = "^"; 
    }

    const stepName = NOTE_NAMES[stepIndex];
    let out = stepName;

    // 處理八度
    if (octave >= 5) {
        out = out.toLowerCase();
        for (let i = 5; i < octave; i++) out += "'";
    } else if (octave < 4) {
        for (let i = 4; i > octave; i--) out += ",";
    }

    return accStr + out;
}

/**
 * 將數值時值轉換為 ABC 字串 (基於 L:1/4)
 */
function getABCDuration(duration: number): string {
    if (duration === 1) return "";
    if (duration === 0.5) return "/";
    if (duration === 0.25) return "/4";
    if (duration === 0.125) return "/8";
    if (duration === 1.5) return "3/2";
    if (duration === 0.75) return "3/4";
    if (duration === 2) return "2";
    if (duration === 3) return "3";
    if (duration === 4) return "4";
    
    // 處理其他分數
    return duration.toString();
}

// --- MST Models ---

const LyricModel = types.model("Lyric", {
    syllable: types.optional(types.string, ""),
    divider: types.optional(types.enumeration([" ", "-", "_"]), " "),
});

const ChordModel = types.model("Chord", {
    name: types.string,
    position: types.optional(types.enumeration(["default", "above", "below"]), "above"),
});

export const NoteModel = types
    .model("Note", {
        id: types.identifier,
        el_type: types.literal("note"),
        pitch: types.number, 
        duration: types.number, 
        accidental: types.optional(types.enumeration("NoteAccidental", ["none", "dbl_flat", "flat", "natural", "sharp", "dbl_sharp"]), "none"),
        startTie: types.optional(types.boolean, false),
        endTie: types.optional(types.boolean, false),
        startSlur: types.optional(types.number, 0), 
        endSlur: types.optional(types.number, 0),
        lyrics: types.optional(types.array(LyricModel), []),
        chord: types.maybe(ChordModel),
    })
    .views(self => ({
        get asABC(): string {
            let str = "";
            
            // 1. Slur Start
            if (self.startSlur > 0) str += "(";
            
            // 2. Chord (Annotation)
            if (self.chord) {
                str += `"${self.chord.name}"`;
            }

            // 3. Pitch & Accidental
            str += getABCPitch(self.pitch, self.accidental);

            // 4. Duration
            str += getABCDuration(self.duration);

            // 5. Tie
            if (self.startTie) str += "-";

            // 6. Slur End
            if (self.endSlur > 0) str += ")";

            return str;
        },
        get lyricString(): string {
            if (self.lyrics.length > 0) {
                // 簡單處理：只取第一個音節，並加上分隔符
                const l = self.lyrics[0];
                return (l.syllable || "") + (l.divider === " " ? " " : l.divider);
            }
            return ""; // 如果沒有歌詞，可能需要回傳 "*" 或 " " 來佔位，視需求而定
        }
    }))
    .actions(self => ({
        setPitch(newPitch: number) { self.pitch = newPitch; },
        setDuration(newDur: number) { self.duration = newDur; },
        delete() { getParent(self, 2).removeElement(self); }
    }));

export const RestModel = types
    .model("Rest", {
        id: types.identifier,
        el_type: types.literal("rest"),
        duration: types.number,
    })
    .views(self => ({
        get asABC(): string {
            return "z" + getABCDuration(self.duration);
        },
        get lyricString(): string {
            return ""; // 休止符通常沒有歌詞
        }
    }))
    .actions(self => ({
        delete() { getParent(self, 2).removeElement(self); }
    }));

export const BarElement = types.union(NoteModel, RestModel);

export const BarModel = types
    .model("Bar", {
        id: types.identifier,
        el_type: types.literal("bar"),
        type: types.optional(types.enumeration("BarType", ["bar_thin", "bar_thin_thick", "bar_left_repeat", "bar_right_repeat", "bar_dbl_repeat"]), "bar_thin"),
        elements: types.array(BarElement),
    })
    .views(self => ({
        get asABC(): string {
            const elementsABC = self.elements.map(el => el.asABC).join(" ");
            let barLine = "|";
            switch (self.type) {
                case "bar_thin_thick": barLine = "|]"; break;
                case "bar_left_repeat": barLine = "|:"; break;
                case "bar_right_repeat": barLine = ":|"; break;
                case "bar_dbl_repeat": barLine = ":|:"; break;
                default: barLine = "|";
            }
            return elementsABC + " " + barLine;
        },
        get lyricsLine(): string {
            // 收集小節內所有音符的歌詞
            return self.elements.map(el => el.lyricString).join(" ").trim();
        },
        get totalDuration() {
            return self.elements.reduce((sum, el) => sum + el.duration, 0);
        },
        get isValid() {
            // 這裡可以實作拍號檢查邏輯
            return true; 
        }
    }))
    .actions(self => ({
        addElement(element: Instance<typeof BarElement>) { self.elements.push(element); },
        removeElement(element: Instance<typeof BarElement>) { self.elements.remove(element); },
        delete() { getParent(self, 2).removeBar(self); }
    }));

export const StaffModel = types
    .model("Staff", {
        id: types.identifier,
        clef: types.optional(types.string, "treble"),
        key: types.optional(types.string, "C"),
        meter: types.optional(types.string, "4/4"),
        bars: types.array(BarModel),
    })
    .views(self => ({
        get asABCString(): string {
            // 1. Staff Header
            let header = `V:${self.id} clef=${self.clef}\n`;
            header += `K:${self.key}\n`;
            header += `M:${self.meter}\n`;
            
            // 2. Music Line
            // 將所有小節的 ABC 串接起來
            // 為了可讀性，每 4 個小節換行一次 (可選)
            let music = "";
            let lyrics = "";
            
            self.bars.forEach((bar, index) => {
                music += bar.asABC + " ";
                lyrics += bar.lyricsLine + " ";
                
                if ((index + 1) % 4 === 0) {
                    music += "\n";
                    // 如果這行有歌詞，則加入 w: 行
                    if (lyrics.trim().length > 0) {
                        music += `w: ${lyrics.trim()}\n`;
                        lyrics = "";
                    }
                }
            });

            // 處理剩餘的歌詞
            if (lyrics.trim().length > 0) {
                music += `\nw: ${lyrics.trim()}`;
            }

            return header + music;
        }
    }))
    .actions(self => ({
        addBar(bar: Instance<typeof BarModel>) { self.bars.push(bar); },
        removeBar(bar: Instance<typeof BarModel>) { self.bars.remove(bar); }
    }));

export const TuneModel = types
    .model("Tune", {
        title: types.optional(types.string, "Untitled"),
        staves: types.array(StaffModel),
        selectedElementId: types.maybe(types.string),
    })
    .views(self => ({
        get asABCString(): string {
            const header = `X:1\nT:${self.title}\nL:1/4\n`; // 全域預設 L:1/4
            const body = self.staves.map(staff => staff.asABCString).join("\n");
            return header + body;
        },
    }))
    .actions(self => ({
        setSelectedElement(id: string | null) { self.selectedElementId = id || undefined; },
        setTitle(title: string) { self.title = title; }
        addNoteToSelectedBar(pitch: number, duration: number) {
            let targetBar: IBar | null = null;

            if (self.selectedElementId) {
                // 透過 ID 找到 MST 模型實例
                const element = resolveIdentifier(BarElement, self, self.selectedElementId);
                if (element) {
                    // getParent(element, 2) 會是 BarModel 的實例
                    // (getParent(element, 1) 是 elements 陣列)
                    targetBar = getParent(element, 2);
                }
            }

            // 如果沒有選取任何音符，或找不到對應的小節，則預設使用第一個譜表的最後一個小節
            if (!targetBar) {
                if (self.staves.length > 0 && self.staves[0].bars.length > 0) {
                    const firstStaff = self.staves[0];
                    targetBar = firstStaff.bars[firstStaff.bars.length - 1];
                }
            }

            if (targetBar) {
                const newNote = NoteModel.create({
                    id: `note-${Date.now()}-${Math.random()}`,
                    el_type: 'note',
                    pitch: pitch,    // 例如: 72 (C5)
                    duration: duration, // 例如: 1 (代表一個四分音符，因為 L:1/4)
                });
                targetBar.addElement(newNote);
            }
        }
    }));

export type ITune = Instance<typeof TuneModel>;
export type IStaff = Instance<typeof StaffModel>;
export type IBar = Instance<typeof BarModel>;
export type INote = Instance<typeof NoteModel>;