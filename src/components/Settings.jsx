import React from 'react';

function Settings({ theme, setTheme, transparency, setTransparency, onSave, onClose }) {
  const handleOverlayClick = (e) => {
    // Close modal if user clicks on the overlay but not inside the modal body
    if (e.target.className === 'settings-overlay') {
      onClose();
    }
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className={`settings-modal ${theme === 'light' ? 'light-settings' : ''}`}>
        <h2>Settings</h2>
        
        <div className="settings-group">
          <label htmlFor="theme-select">Theme</label>
          <select 
            id="theme-select" 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
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

        <div className="settings-actions">
          <button className="btn-save" onClick={onSave}>Save & Close</button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
