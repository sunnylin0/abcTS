# 重構解析函式之 Tuple 回傳值為具名強型別物件

本計畫旨在優化 `abcTS` 專案中解析器相關函式的回傳型別。目前這些函式回傳如 `[number, string, boolean]` 等無屬性名稱的元組 (tuple)，在程式碼中透過索引值（如 `ret[0]`, `ret[1]`）存取，缺乏型別安全且不易閱讀與維護。我們將設計具名屬性的專屬介面，並同步重構所有相關呼叫處。

同時，**我們將在所有新定義的介面、屬性與函式上，寫上清晰、詳盡的 TSDoc/JSDoc 註解**，以利後續開發者理解。

## 待重構函式與新介面設計

我們將在 `src/all.d.ts` 新增並定義以下強型別介面，用以取代舊有的元組，並包含對應屬性註解：

### 1. 括號子字串解析結果 (`BrackettedSubstringResult`)
- **模組**: [abc_tokenizer.ts](file:///c:/github/abcMain/abcTS/src/abc_tokenizer.ts)
- **介面**:
  ```typescript
  /**
   * 括號內子字串解析結果
   */
  export interface BrackettedSubstringResult {
      /** 消耗的字元長度（包含開閉括號） */
      len: number;
      /** 括號內提取出的實際字串內容 */
      token: string;
      /** 是否成功尋找到閉合括號 */
      closed: boolean;
  }
  ```

### 2. 和弦解析結果 (`ChordParseResult`)
- **模組**: [abc_parse.ts](file:///c:/github/abcMain/abcTS/src/abc_parse.ts)
- **介面**:
  ```typescript
  /**
   * 和弦與標註符號解析結果
   */
  export interface ChordParseResult {
      /** 消耗的字元長度 */
      len: number;
      /** 和弦或標註的字串名稱 */
      name: string;
      /** 繪製位置：'above' (上方)、'below' (下方)、'left' (左側)、'right' (右側) 或 'default' */
      position?: Chord['position'];
  }
  ```

### 3. 裝飾音/記號解析結果 (`AccentParseResult`)
- **模組**: [abc_parse.ts](file:///c:/github/abcMain/abcTS/src/abc_parse.ts)
- **介面**:
  ```typescript
  /**
   * 音符裝飾記號解析結果
   */
  export interface AccentParseResult {
      /** 消耗的字元長度 */
      len: number;
      /** 裝飾記號識別名稱（例如 'staccato', 'fermata' 等），若為 line break (驚嘆號) 則為 null */
      accent: string | null;
  }
  ```

### 4. 空白 spacer 解析結果 (`SpacerParseResult`)
- **模組**: [abc_parse.ts](file:///c:/github/abcMain/abcTS/src/abc_parse.ts)
- **介面**:
  ```typescript
  /**
   * 空白分隔符解析結果
   */
  export interface SpacerParseResult {
      /** 消耗的空白字元長度 */
      len: number;
  }
  ```

### 5. 小節線與 Ending 解析結果 (`BarParseResult`)
- **模組**: [abc_parse.ts](file:///c:/github/abcMain/abcTS/src/abc_parse.ts)
- **介面**:
  ```typescript
  /**
   * 小節線解析結果
   */
  export interface BarParseResult {
      /** 消耗的字元長度 */
      len: number;
      /** 小節線類型，對應 BarType 內部字串（例如 'bar_thin' 等） */
      barType: string;
      /** 反覆記號的結尾字串（例如 '1'、'2'、'1-3' 等），若無則為 undefined */
      ending?: string;
  }
  ```

### 6. 折分節奏符號解析結果 (`BrokenRhythmResult`)
- **模組**: [abc_parse.ts](file:///c:/github/abcMain/abcTS/src/abc_parse.ts)
- **介面**:
  ```typescript
  /**
   * 折分節奏符號 (如 >, <) 解析結果
   */
  export interface BrokenRhythmResult {
      /** 消耗的字元長度 */
      len: number;
      /** 當前音符時值應乘上的倍數 */
      factor1: number;
      /** 下一個音符時值應乘上的倍數 */
      factor2: number;
  }
  ```

### 7. 裝飾性裝飾音符解析結果 (`GraceParseResult`)
- **模組**: [abc_parse.ts](file:///c:/github/abcMain/abcTS/src/abc_parse.ts)
- **介面**:
  ```typescript
  /**
   * 裝飾音 (Grace Note) 解析結果
   */
  export interface GraceParseResult {
      /** 消耗的字元長度 */
      len: number;
      /** 解析出的裝飾音音符陣列 */
      notes: NOTES_Element[];
  }
  ```

### 8. 行內 Inline 標頭解析結果 (`InlineHeaderResult`)
- **模組**: [abc_parse_header.ts](file:///c:/github/abcMain/abcTS/src/abc_parse_header.ts)
- **介面**:
  ```typescript
  /**
   * 行內 Inline 標頭欄位 (如 [K:C]) 解析結果
   */
  export interface InlineHeaderResult {
      /** 消耗的字元長度 */
      len: number;
      /** 標頭類型英文字母 (如 'K', 'M', 'Q' 等) */
      headerLetter?: string;
      /** 標頭的內容字串 */
      content?: string;
  }
  ```

### 9. 樂譜 Body 標頭解析結果 (`BodyHeaderResult`)
- **模組**: [abc_parse_header.ts](file:///c:/github/abcMain/abcTS/src/abc_parse_header.ts)
- **介面**:
  ```typescript
  /**
   * 行首與 Body 標頭欄位 (如 K:C) 解析結果
   */
  export interface BodyHeaderResult {
      /** 消耗的字元長度 */
      len: number;
      /** 標頭類型英文字母 (如 'K', 'M', 'Q' 等) */
      headerLetter?: string;
      /** 標頭的內容字串 */
      content?: string;
  }
  ```

---

## 影響檔案與修改點

### [MODIFY] [all.d.ts](file:///c:/github/abcMain/abcTS/src/all.d.ts)
- 於 `all.d.ts` 內新增上述所有帶註解的介面定義。

### [MODIFY] [abc_tokenizer.ts](file:///c:/github/abcMain/abcTS/src/abc_tokenizer.ts)
- 修改 `getBrackettedSubstring` 回傳型別與實作，回傳 `BrackettedSubstringResult` 物件，並加上 TSDoc 註解。

### [MODIFY] [abc_parse.ts](file:///c:/github/abcMain/abcTS/src/abc_parse.ts)
- 更新對 `getBrackettedSubstring` 的四個呼叫點，改用 `.len`, `.token`, `.closed`。
- 修改 `letter_to_chord`、`letter_to_accent`、`letter_to_spacer`、`letter_to_bar`、`getBrokenRhythm`、`letter_to_grace` 函式定義、回傳值及所有呼叫處的屬性存取邏輯，並於函式本身加上對應註解。

### [MODIFY] [abc_parse_header.ts](file:///c:/github/abcMain/abcTS/src/abc_parse_header.ts)
- 修改 `letter_to_inline_header` 與 `letter_to_body_header` 的函式回傳值及內部回傳語法，並於函式本身加上對應註解。

---

## 驗證計畫

### 自動化測試
- 執行 `pnpm run build` 進行靜態 TypeScript 編譯與 UMD 打包，確保無型別錯誤。
- 執行傳統五線譜測試 `node test.js`，確保 100% 綠燈無退化。
- 執行簡譜測試 `node test-jianpu-01.js` 到 `test-jianpu-07.js`。
- 執行 `node test/compare_ast.js` 做語法樹比對，確保語義解析 100% 與舊版行為一致。
