import { useCallback } from 'react';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

export default function App() {
  const handleSelect = useCallback(() => {
    window.dispatchEvent(new Event('selected-changed'));
  }, []);

  const handleDeselect = useCallback(() => {
    window.dispatchEvent(new Event('selected-changed'));
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        flex: 1,
        borderRight: '2px solid #ddd',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <LeftPanel onSelect={handleSelect} />
      </div>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <RightPanel onDeselect={handleDeselect} />
      </div>
    </div>
  );
}
