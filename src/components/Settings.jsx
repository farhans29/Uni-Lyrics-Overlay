import React, { useState, useRef, useEffect } from 'react';

function Settings({ theme, setTheme, transparency, setTransparency, pinned, setPinned, onSave, onClose }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleOverlayClick = (e) => {
    if (e.target.className === 'settings-overlay') {
      onClose();
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    { value: 'dark', label: 'Dark', icon: '◑' },
    { value: 'light', label: 'Light', icon: '◐' },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className={`settings-modal ${theme === 'light' ? 'light-settings' : ''}`}>
        <h2>Settings</h2>
        
        <div className="settings-group">
          <label>Theme</label>
          <div className="custom-dropdown" ref={dropdownRef}>
            <button 
              type="button"
              className="dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="dropdown-icon">{currentTheme.icon}</span>
              <span className="dropdown-label">{currentTheme.label}</span>
              <svg 
                className={`dropdown-chevron ${isDropdownOpen ? 'open' : ''}`}
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`dropdown-item ${theme === t.value ? 'active' : ''}`}
                    onClick={() => { setTheme(t.value); setIsDropdownOpen(false); }}
                  >
                    <span className="dropdown-icon">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="settings-group">
          <label htmlFor="transparency-slider">Background Transparency ({transparency}%)</label>
          <input 
            type="range" 
            id="transparency-slider" 
            min="0" 
            max="100" 
            value={transparency} 
            onChange={(e) => setTransparency(Number(e.target.value))}
          />
        </div>

        <div className="settings-group">
          <label>Pinned Window</label>
          <div className="toggle-switch">
            <input 
              type="checkbox" 
              id="pinned-toggle" 
              checked={pinned} 
              onChange={(e) => setPinned(e.target.checked)}
            />
            <label htmlFor="pinned-toggle" className="toggle-label">
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-save" onClick={onSave}>Save & Close</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
