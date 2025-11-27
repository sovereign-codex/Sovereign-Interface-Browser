import React, { FormEvent, useState } from 'react';

interface Props {
  placeholder?: string;
  disabled?: boolean;
  onSubmit: (value: string) => void | Promise<void>;
}

export const Omnibar: React.FC<Props> = ({ placeholder, disabled, onSubmit }) => {
  const [value, setValue] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!value.trim()) return;
    await onSubmit(value);
    setValue('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          flex: 1,
          padding: '12px',
          borderRadius: 8,
          border: '1px solid #1f2833',
          background: '#0c1220',
          color: '#e8f1ff'
        }}
      />
      <button
        type="submit"
        disabled={disabled}
        style={{
          padding: '12px 18px',
          background: '#45a29e',
          color: '#0b0c10',
          border: 'none',
          borderRadius: 8,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        Send
      </button>
    </form>
  );
};
