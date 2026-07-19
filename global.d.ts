
// 讓 TypeScript 知道全域有一個叫 AbcSpacing 的東西，型別就是該 Class 本身
// 請在入口檔案（例如 main.ts 或 index.ts）中 import 這個 Class，然後在 global.d.ts 中使用 declare var 來宣告它
declare var AbcSpacing: typeof import('./src/abc_write').AbcSpacing;

interface Window {
	JSONSchema: any; // 讓整個專案的 window 都能直接點出 JSONSchema
}
declare var sprintf: typeof import('./src/sprintf').sprintf;


// 使用模組化搭配 declare global
type AbcTune = import('./src/abc_tune').AbcTune;
type AbcSpacing = import('./src/abc_write').AbcSpacing;
type ABCPrinter = import('./src/abc_write').ABCPrinter;
type ABCGlyphs = import('./src/abc_glyphs').ABCGlyphs;
type EditArea = import('./src/abc_editor').EditArea;
type ABCEditor = import('./src/abc_editor').ABCEditor;
type ABCStaffGroupElement = import('./src/abc_graphelements').ABCStaffGroupElement;
type ABCVoiceElement = import('./src/abc_graphelements').ABCVoiceElement;
type ABCAbsoluteElement = import('./src/abc_graphelements').ABCAbsoluteElement;
type ABCRelativeElement = import('./src/abc_graphelements').ABCRelativeElement;
type ABCEndingElem = import('./src/abc_graphelements').ABCEndingElem;
type ABCTieElem = import('./src/abc_graphelements').ABCTieElem;
type ABCTripletElem = import('./src/abc_graphelements').ABCTripletElem;
type ABCBeamElem = import('./src/abc_graphelements').ABCBeamElem;
type ABCLayout = import('./src/abc_layout').ABCLayout;
type getDurlog = import('./src/abc_layout').getDurlog;
type getDuration = import('./src/abc_layout').getDuration;
type ABCMidiWriter = import('./src/abc_midiwriter').ABCMidiWriter;
type MultilineVars = import('./src/abc_parse').MultilineVars;
type AbcParse = import('./src/abc_parse').AbcParse;
type AbcParseHeader = import('./src/abc_parse_header').AbcParseHeader;
type ABCPlugin = import('./src/abc_plugin').ABCPlugin;
type AbcTokenizer = import('./src/abc_tokenizer').AbcTokenizer;
type Svg = import('./src/svg').Svg;
type PlayTune = import('./src/wav_generator').PlayTune;