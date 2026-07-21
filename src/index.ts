import './proto'; // 👈 確保路徑正確，如果是同層就寫 ./prototype
import './string_extension';   // 🎯 加上這一行！確保執行期載入字串擴充
import './sprintf'; // 🎯 引入你的 sprintf 檔案
import { AbcTuneBook } from './abc_tunebook';
import { AbcParse } from './abc_parse';
import { AbcParserLint } from './abc_parser_lint';
import { PlayEmbedded } from './play_embedded';
import { abcParser, processAbc } from './application';
import { ABCEditor } from './abc_editor';
import { AbcSpacing, ABCPrinter } from './abc_write';
import { AbcTokenizer } from './abc_tokenizer';
import { ABCLayout } from './abc_layout';
import { Svg } from './svg';
import './jsonschema-b4.js';
import './Maestro_500.js';


if (typeof window !== 'undefined') {
	//(window as any).sprintf = sprintf; // 🎯 執行期掛載到全域物件上
	(window as any).AbcSpacing = AbcSpacing;
	(window as any).ABCPrinter = ABCPrinter;
	//(window as any).JSONSchema = JSONSchema;

	(window as any).ABCEditor = ABCEditor;
	(window as any).AbcTuneBook = AbcTuneBook;
	(window as any).AbcParse = AbcParse;
	(window as any).AbcParserLint = AbcParserLint;
	(window as any).PlayEmbedded = PlayEmbedded;
	(window as any).AbcTokenizer = AbcTokenizer;
	(window as any).ABCLayout = ABCLayout;
	(window as any).Svg = Svg;
	if (typeof abcParser !== 'undefined') (window as any).abcParser = abcParser;
	if (typeof processAbc !== 'undefined') (window as any).processAbc = processAbc;
}

// 2. 標準 ESM 匯出，相容現代 Vite / React 環境
export {
	AbcTuneBook,
	AbcParse,
	ABCPrinter,
	AbcTokenizer,
	ABCLayout,
	Svg
};
