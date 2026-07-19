import './proto'; // 👈 確保路徑正確，如果是同層就寫 ./prototype
import './string_extension';   // 🎯 加上這一行！確保執行期載入字串擴充
import { sprintf } from './sprintf'; // 🎯 引入你的 sprintf 檔案
import { AbcTuneBook } from './abc_tunebook';
import { AbcParse } from './abc_parse';
import { AbcParserLint } from './abc_parser_lint';
import { PlayEmbedded } from './play_embedded';
import { abcParser, processAbc } from './application';
import { ABCEditor } from './abc_editor';
import { AbcSpacing } from './abc_write';
import './jsonschema-b4.js';
import './Maestro_500.js';


if (typeof window !== 'undefined') {
	(window as any).sprintf = sprintf; // 🎯 執行期掛載到全域物件上
	(window as any).AbcSpacing = AbcSpacing;
	//(window as any).JSONSchema = JSONSchema;

	(window as any).ABCEditor = ABCEditor;
	(window as any).AbcTuneBook = AbcTuneBook;
	(window as any).AbcParse = AbcParse;
	(window as any).AbcParserLint = AbcParserLint;
	(window as any).PlayEmbedded = PlayEmbedded;
	if (typeof abcParser !== 'undefined') (window as any).abcParser = abcParser;
	if (typeof processAbc !== 'undefined') (window as any).processAbc = processAbc;
}
