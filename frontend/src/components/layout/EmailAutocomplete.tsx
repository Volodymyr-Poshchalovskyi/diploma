import React, { useState, useRef, useEffect } from 'react';

interface EmailAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

const DOMAINS = ['gmail.com', 'proton.me', 'ukr.net', 'yahoo.com', 'outlook.com'];

export default function EmailAutocomplete({ value, onChange, placeholder, required, style }: EmailAutocompleteProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);

    if (val.includes('@')) {
      const [localPart, domainPart] = val.split('@');
      if (domainPart !== undefined) {
        const filteredDomains = DOMAINS.filter(d => d.startsWith(domainPart));
        if (filteredDomains.length > 0 && !(filteredDomains.length === 1 && filteredDomains[0] === domainPart)) {
          setSuggestions(filteredDomains.map(d => `${localPart}@${d}`));
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelect = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', marginBottom: style?.marginBottom }}>
      <input
        type="email"
        value={value}
        onChange={handleChange}
        onFocus={() => {
          if (suggestions.length > 0) setShowSuggestions(true);
        }}
        placeholder={placeholder}
        required={required}
        style={{ ...style, marginBottom: 0 }}
      />
      {showSuggestions && (
        <ul style={styles.dropdown}>
          {suggestions.map((s, i) => (
            <li
              key={i}
              style={styles.dropdownItem}
              onMouseDown={() => handleSelect(s)}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    marginTop: '4px',
    padding: '4px 0',
    listStyle: 'none',
    zIndex: 10,
    maxHeight: '150px',
    overflowY: 'auto',
  },
  dropdownItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    color: '#374151',
    transition: 'background-color 0.2s ease',
  },
};
