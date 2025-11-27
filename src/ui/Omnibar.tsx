import React, { FormEvent, useMemo, useState } from 'react';
import { executeCommand } from '../core/commands/executor';
import { CommandContext, CommandHandlerResult } from '../core/commands/types';
import { useSovereignTheme } from '../sib/ui/SovereignTheme';

interface Props {
  placeholder?: string;
  disabled?: boolean;
  context: CommandContext;
}

export const Omnibar: React.FC<Props> = ({ placeholder, disabled, context }) => {
  const { theme } = useSovereignTheme();
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [result, setResult] = useState<CommandHandlerResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setIsExecuting(true);
    const commandResult = await executeCommand(trimmed, context);
    setResult(commandResult);
    setHistory((prev) => [trimmed, ...prev].slice(0, 50));
    setHistoryIndex(null);
    setIsExecuting(false);
    setValue('');
  };

  const handleHistoryNav = (direction: 'up' | 'down'): void => {
    setHistoryIndex((current) => {
      if (history.length === 0) return null;
      if (current === null) {
        const nextValue = direction === 'up' ? history[0] : '';
        setValue(nextValue ?? '');
        return direction === 'up' ? 0 : null;
      }
      const nextIndex = direction === 'up' ? Math.min(current + 1, history.length - 1) : current - 1;
      const nextValue = nextIndex >= 0 ? history[nextIndex] : '';
      setValue(nextValue ?? '');
      return nextIndex >= 0 ? nextIndex : null;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      handleHistoryNav('up');
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      handleHistoryNav('down');
    } else if (event.key === 'Escape') {
      setValue('');
      setHistoryIndex(null);
    }
  };

  const statusChipStyle = useMemo<React.CSSProperties>(() => {
    const bg = result?.status === 'ok' ? theme.accentSoft : 'rgba(255, 107, 107, 0.15)';
    const color = result?.status === 'ok' ? theme.accent : '#ff6b6b';
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 10px',
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
    };
  }, [result?.status, theme.accent, theme.accentSoft]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isExecuting}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: 8,
            border: `1px solid ${theme.accentSoft}`,
            background: theme.panel,
            color: theme.text,
            boxShadow: '0 10px 35px rgba(0,0,0,0.35)',
            outline: 'none',
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          disabled={disabled || isExecuting}
          style={{
            padding: '12px 18px',
            background: theme.accent,
            color: '#0b0c10',
            border: 'none',
            borderRadius: 8,
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            minWidth: 96,
          }}
        >
          {isExecuting ? 'Working…' : 'Run'}
        </button>
      </form>
      <div style={{ minHeight: 36 }}>
        {isExecuting && <div style={{ color: theme.textSoft, fontSize: 12 }}>Executing command…</div>}
        {!isExecuting && result && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: theme.panel,
              borderRadius: 10,
              padding: '8px 12px',
              border: `1px solid ${theme.accentSoft}`,
            }}
          >
            <span style={statusChipStyle}>{result.status === 'ok' ? 'OK' : 'Error'}</span>
            <span style={{ color: theme.textSoft, fontSize: 13 }}>{result.message ?? 'Command completed.'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
