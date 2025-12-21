import { AbcTune, NoteElement } from "./abc_tune";

// A very basic map for pitch index to letter name. Does not handle key signatures.
const pitchMap: { [key: number]: string } = {
    0: 'C', 1: 'D', 2: 'E', 3: 'F', 4: 'G', 5: 'A', 6: 'B',
    7: 'c', 8: 'd', 9: 'e', 10: 'f', 11: 'g', 12: 'a', 13: 'b'
};

function noteToString(note: NoteElement): string {
    if (note.rest) {
        // TODO: Handle different rest types if needed. 'z' is a whole measure rest in some contexts.
        // For now, just 'z' + duration.
        return 'z' + (note.duration ? note.duration * 8 : ''); // Assuming default length is 1/8
    }

    if (!note.pitches || note.pitches.length === 0) {
        return '';
    }

    let result = '';
    const pitch = note.pitches[0]; // Simple approach: use the first pitch for a chord

    // Accidental
    if (pitch.accidental) {
        switch (pitch.accidental) {
            case 'sharp': result += '^'; break;
            case 'flat': result += '_'; break;
            case 'natural': result += '='; break;
            case 'dblsharp': result += '^^'; break;
            case 'dblflat': result += '__'; break;
        }
    }
    
    // Pitch letter and octave
    let pitchName = pitchMap[pitch.pitch % 14] || '';
    const octave = Math.floor(pitch.pitch / 7);
    if (octave > 1) {
        pitchName = pitchName.toLowerCase();
        for(let i=1; i < octave; i++) pitchName += "'";
    } else if (octave < 1) {
         for(let i=0; i > octave; i--) pitchName += ",";
    }


    result += pitchName;

    // Duration
    // This is a very simplified duration logic.
    // The default note length (L:) is assumed to be 1/8.
    const durationRatio = note.duration / 0.125;
    if (durationRatio !== 1) {
        if (durationRatio % 1 === 0) {
            result += durationRatio; // e.g., C2, C4
        } else if (durationRatio === 0.5) {
            result += '/'; // or /2
        } else {
            // More complex fractions like 3/2, etc. are not handled yet.
            result += `*${durationRatio}`;
        }
    }

    return result;
}

export function tuneToABC(tune: AbcTune): string {
    if (!tune) return "";

    let abcString = "";

    // Headers
    if (tune.metaText.title) abcString += `T: ${tune.metaText.title}\n`;
    if (tune.metaText.composer) abcString += `C: ${tune.metaText.composer}\n`;
    // A very basic key signature representation
    if (tune.lines[0]?.staff[0]?.key) {
         // This is complex. For now, let's just assume C major.
         abcString += `K: C\n`;
    }
     if (tune.lines[0]?.staff[0]?.meter) {
        const meter = tune.lines[0].staff[0].meter;
        if(meter.type === 'common_time') {
            abcString += `M: C\n`;
        } else if (meter.type === 'cut_time') {
            abcString += `M: C|\n`;
        } else if (meter.value && meter.value.length > 0) {
            abcString += `M: ${meter.value[0].num}/${meter.value[0].den}\n`;
        }
    }


    // Body
    for (const line of tune.lines) {
        if (line.staff) {
            // Simple approach: only handle the first voice of the first staff
            const voice = line.staff[0]?.voices[0];
            if (voice) {
                let lineStr = "";
                for (const elem of voice) {
                    if (elem.el_type === 'note') {
                        lineStr += noteToString(elem) + ' ';
                    } else if (elem.el_type === 'bar') {
                        // Basic bar line representation
                        lineStr += '| ';
                    }
                }
                abcString += lineStr.trim() + '\n';
            }
        }
    }

    return abcString;
}
