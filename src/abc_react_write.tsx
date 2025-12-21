import React, { useState, useEffect, useMemo, useContext, createContext, useReducer } from 'react';
import { AbcTune } from './abc_tune';
import { AbcTuneBook } from './abc_tunebook';
import { AbcParse } from './abc_parse';
import { ABCLayout } from './abc_layout';
import { ABCGlyphs } from './abc_glyphs';
import { ABCStaffGroupElement, ABCVoiceElement, ABCAbsoluteElement, ABCRelativeElement } from './abc_graphelements';
import { AbcSpacing } from './abc_write';
import { tuneToABC } from "./abc_writer_to_string";
import { deepCopy } from '../../types/deepclone';

// --- Reducer and Store ---

function tuneReducer(state: AbcTune, action: { type: string; payload: any }): AbcTune {
    if (!state) return null;
    switch (action.type) {
        case 'DELETE_NOTE': {
            const { startChar, endChar } = action.payload;
            
            const newTune = deepCopy(state);

            for (const line of newTune.lines) {
                if (line.staff) {
                    for (const staff of line.staff) {
                        for (const voice of staff.voices) {
                            const index = voice.findIndex(el => el.startChar === startChar && el.endChar === endChar);
                            if (index !== -1) {
                                voice.splice(index, 1);
                                return newTune;
                            }
                        }
                    }
                }
            }
            return newTune;
        }
        case 'RESET_TUNE': {
            return action.payload;
        }
        default:
            return state;
    }
}


interface TuneContextType {
    tune: AbcTune | null;
    dispatch: React.Dispatch<{ type: string; payload: any }>;
}

const TuneContext = createContext<TuneContextType>({
    tune: null,
    dispatch: () => null,
});

const TuneProvider: React.FC<{ abc: string, params: any, onAbcChange?: (abc: string) => void, children: React.ReactNode }> = ({ abc, params, onAbcChange, children }) => {
    const [initialTune, setInitialTune] = useState<AbcTune | null>(null);
    const isInitialMount = React.useRef(true);

    useEffect(() => {
        if (!abc) return;
        const tunebook = new AbcTuneBook(abc);
        const abcParser = new AbcParse();
        abcParser.parse(tunebook.tunes[0].abc);
        const parsedTune = abcParser.getTune();
        setInitialTune(parsedTune);
    }, [abc]);

    const [tune, dispatch] = useReducer(tuneReducer, initialTune);
    
    useEffect(() => {
        if(initialTune) {
            dispatch({ type: 'RESET_TUNE', payload: initialTune });
        }
    }, [initialTune]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
        if (tune && onAbcChange) {
            const newAbc = tuneToABC(tune);
            onAbcChange(newAbc);
        }
    }, [tune, onAbcChange]);


    return (
        <TuneContext.Provider value={{ tune, dispatch }}>
            {children}
        </TuneContext.Provider>
    );
};



// --- Helper Functions ---

const getTransformedPath = (glyphData: {d: ([string, ...number[]])[]}, x: number, y: number): string => {
    if (!glyphData || !glyphData.d) return "";
    const newPath = JSON.parse(JSON.stringify(glyphData.d));
    newPath[0][1] += x;
    newPath[0][2] += y;
    return newPath.map((cmd: any[]) => cmd.join(' ')).join(' ');
};

// --- Rendering Components ---

const RelativeElement: React.FC<{ element: ABCRelativeElement; parentX: number; staffY: number; printer: any, dispatch: any }> = ({ element, parentX, staffY, printer, dispatch }) => {
    const { c, dx, pitch, type, w, pitch2, linewidth, scalex, parent } = element;
    const x = parentX + dx;
    const y = printer.calcY(staffY, pitch);

    const handleDelete = (e) => {
        e.stopPropagation();
        if (parent && parent.abcelem) {
            dispatch({
                type: 'DELETE_NOTE',
                payload: { startChar: parent.abcelem.startChar, endChar: parent.abcelem.endChar }
            });
        }
    };

    switch (type) {
        case 'symbol': {
            if (!c) return null;
            const glyph = printer.glyphs.getGlyph(c);
            if (!glyph) return null;
            const yCorr = printer.glyphs.getYCorr(c);
            const finalY = printer.calcY(staffY, pitch + yCorr);
            const pathData = getTransformedPath(glyph, x, finalY);
            const isNoteHead = c.includes('notehead');
            return <path d={pathData} transform={`scale(${scalex})`} transformOrigin={`${x} ${finalY}`} fill="#000" stroke="none" onClick={isNoteHead ? handleDelete : undefined} cursor={isNoteHead ? 'pointer' : 'default'} />;
        }
        case 'stem': {
            const y2 = printer.calcY(staffY, pitch2);
            return <path d={`M ${x} ${y} L ${x} ${y2} L ${x + linewidth} ${y2} L ${x + linewidth} ${y} z`} fill="#000" stroke="none" />;
        }
        case 'ledger': {
             const ledgerY = printer.calcY(staffY, pitch);
             return <path d={`M ${x} ${ledgerY} L ${x + w} ${ledgerY} L ${x + w} ${ledgerY + 0.5} L ${x} ${ledgerY + 0.5} z`} fill="#000" stroke="none" />;
        }
        case 'bar': {
            const barY1 = printer.calcY(staffY, pitch);
            const barY2 = printer.calcY(staffY, pitch2);
            return <path d={`M ${x} ${barY1} L ${x} ${barY2} L ${x + linewidth} ${barY2} L ${x + linewidth} ${barY1} z`} fill="#000" stroke="none" />;
        }
        case 'text':
             return <text x={x} y={y} textAnchor="middle" fontSize="12">{c}</text>
        
        default:
            return <text x={x} y={y} fontSize="10" fill="red">{`Unknown Rel: ${type}`}</text>;
    }
};

const AbsoluteElement: React.FC<{ element: ABCAbsoluteElement; staffY: number; printer: any, dispatch:any }> = ({ element, staffY, printer, dispatch }) => {
    if (element.invisible) return null;
    return (
        <g className="abc-absolute-element">
            {element.children.map((child, index) => (
                <RelativeElement key={index} element={child} parentX={element.x} staffY={staffY} printer={printer} dispatch={dispatch} />
            ))}
        </g>
    );
};

const Voice: React.FC<{ voice: ABCVoiceElement; printer: any, dispatch: any }> = ({ voice, printer, dispatch }) => (
    <g className="abc-voice">
        {voice.children.map((element, index) => (
            <AbsoluteElement key={index} element={element} staffY={voice.y} printer={printer} dispatch={dispatch}/>
        ))}
    </g>
);

const StaffGroup: React.FC<{ staffGroup: ABCStaffGroupElement; printer: any, dispatch: any }> = ({ staffGroup, printer, dispatch }) => {
    const renderStave = (y: number, startx: number, endx: number) => {
        const pitches = [2, 4, 6, 8, 10]; // Standard 5-line staff pitches
        return pitches.map(pitch => (
            <path key={pitch} d={`M ${startx} ${printer.calcY(y, pitch)} L ${endx} ${printer.calcY(y, pitch)}`} stroke="black" strokeWidth="1" />
        ));
    };

    return (
        <g className="abc-staff-group">
            {staffGroup.staffs.map(staffY => renderStave(staffY, staffGroup.startx, staffGroup.w))}
            {staffGroup.voices.map((voice, index) => (
                <Voice key={index} voice={voice} printer={printer} dispatch={dispatch} />
            ))}
        </g>
    );
};

// --- Score Rendering Component ---

const AbcScore: React.FC<{ params: any }> = ({ params }) => {
    const { tune, dispatch } = useContext(TuneContext);
    const [staffGroups, setStaffGroups] = useState<ABCStaffGroupElement[]>([]);
    const [svgWidth, setSvgWidth] = useState(800);
    const [svgHeight, setSvgHeight] = useState(400);

    const glyphs = useMemo(() => new ABCGlyphs(), []);
    const printer = useMemo(() => createPrinter(glyphs), [glyphs]);

    useEffect(() => {
        if (!tune || !tune.lines || tune.lines.length === 0) {
            setStaffGroups([]);
            return;
        }

        const layouter = new ABCLayout(glyphs, tune.formatting.bagpipes);

        let y = 15;
        const newStaffGroups: ABCStaffGroupElement[] = [];
        let maxwidth = params.staffwidth || 700;
        maxwidth += AbcSpacing.MARGINLEFT;

        for (let i = 0; i < tune.lines.length; i++) {
            const line = tune.lines[i];
            if (line.staff) {
                const staffgroup = layouter.printABCLine(line.staff, y);
                staffgroup.layout(AbcSpacing.SPACE, printer as any);

                if (staffgroup.w > maxwidth) maxwidth = staffgroup.w;
                newStaffGroups.push(staffgroup);
                y = layouter.y;
                y += AbcSpacing.STAVEHEIGHT;
            }
        }
        
        setStaffGroups(newStaffGroups);
        setSvgWidth(maxwidth + 50);
        setSvgHeight(y + 30);

    }, [tune, params.staffwidth, glyphs, printer]);

    if (!tune || staffGroups.length === 0) {
        return <div>Loading...</div>;
    }

    return (
        <svg width={svgWidth} height={svgHeight} className="abc-notation-svg">
            <g>
                <text x={svgWidth / 2} y="20" textAnchor="middle" fontSize="20" fontFamily="serif">
                    {tune.metaText.title}
                </text>
                
                {staffGroups.map((staffGroup, index) => (
                    <StaffGroup key={index} staffGroup={staffGroup} printer={printer} dispatch={dispatch} />
                ))}
            </g>
        </svg>
    );
};

// --- Main Exported Component ---

interface AbcReactWriteProps {
    abc: string;
    params?: any;
    onAbcChange?: (abc: string) => void;
}

const createPrinter = (glyphs: ABCGlyphs) => {
    return {
        glyphs: glyphs,
        paper: { // Mock for layout phase
            text: () => ({
                getBBox: () => ({ width: 0, height: 0 }),
                remove: () => { },
            }),
        },
        calcY: (y: number, ofs: number): number => {
             return y + ((AbcSpacing.TOPNOTE - ofs) * AbcSpacing.STEP);
        }
    };
};

export const AbcReactWrite: React.FC<AbcReactWriteProps> = ({ abc, params = {}, onAbcChange }) => {
    return (
        <TuneProvider abc={abc} params={params} onAbcChange={onAbcChange}>
            <AbcScore params={params} />
        </TuneProvider>
    );
};
