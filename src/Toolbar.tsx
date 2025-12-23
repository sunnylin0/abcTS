import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { ITune } from '../models/ScoreModels';

interface ToolbarProps {
    tune: ITune;
}

/**
 * 一個包含樂譜操作按鈕的工具列元件。
 * @param tune - MobX-State-Tree 的 Tune store 實例。
 */
const Toolbar: React.FC<ToolbarProps> = observer(({ tune }) => {

    const handleAddQuarterNote = () => {
        // 呼叫在 TuneModel 中定義的 action
        // Pitch 72 是 C5 (高音譜表的第三間)
        // Duration 1 對應四分音符 (因為我們在 TuneModel 中設定了 L:1/4)
        tune.addNoteToSelectedBar(72, 1);
    };

    return (
        <div style={{ padding: '10px', borderBottom: '1px solid #ccc', marginBottom: '10px' }}>
            <button onClick={handleAddQuarterNote}>新增四分音符</button>
            {/* 未來可以加入更多按鈕，例如選擇不同時值、升降記號等 */}
        </div>
    );
});

export default Toolbar;