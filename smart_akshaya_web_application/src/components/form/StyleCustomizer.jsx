import React from 'react';

export default function StyleCustomizer({ theme = {}, onChange }) {
  const {
    primaryColor = '#0f766e',
    secondaryColor = '#1e293b',
    textColor = '#1f2937',
    backgroundColor = '#ffffff',
    fontFamily = 'Inter',
    sectionVisibility = {},
    profileImageSize = 96,
    profileImageShape = 'circle',
    profileImageBorderWidth = 2,
    profileImageBorderColor = '#ffffff'
  } = theme;

  const handleColorChange = (key, value) => {
    onChange({ ...theme, [key]: value });
  };

  const handleVisibilityToggle = (section) => {
    const updatedVisibility = {
      ...sectionVisibility,
      [section]: !sectionVisibility[section]
    };
    onChange({ ...theme, sectionVisibility: updatedVisibility });
  };

  return (
    <div className="rb-form-stack">
      <div>
        <h4 className="rb-section-title">Theme Colors</h4>
        <div className="rb-form-stack">
          <div className="rb-form-grid-2">
            <div>
              <label className="rb-label-sm">Primary Color</label>
              <div className="rb-color-row">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                />
                <span className="rb-color-value">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="rb-label-sm">Secondary Color</label>
              <div className="rb-color-row">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                />
                <span className="rb-color-value">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="rb-form-grid-2">
            <div>
              <label className="rb-label-sm">Font Color</label>
              <div className="rb-color-row">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                />
                <span className="rb-color-value">{textColor}</span>
              </div>
            </div>
            <div>
              <label className="rb-label-sm">Background Color</label>
              <div className="rb-color-row">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                />
                <span className="rb-color-value">{backgroundColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="rb-section-title">Typography</h4>
        <label className="rb-label-sm">Font Family</label>
        <select
          value={fontFamily}
          onChange={(e) => onChange({ ...theme, fontFamily: e.target.value })}
          className="rb-select"
        >
          <option value="Inter">Sans-Serif (Inter)</option>
          <option value="Montserrat">Modern CV (Montserrat)</option>
          <option value="Georgia">Serif (Georgia)</option>
          <option value="Monospace">Monospace (JetBrains)</option>
        </select>
      </div>

      <div>
        <h4 className="rb-section-title">Profile Photo Style</h4>
        <div className="rb-form-stack">
          <div>
            <label className="rb-label-sm">Size ({profileImageSize}px)</label>
            <input
              type="range"
              min="50"
              max="180"
              step="2"
              value={profileImageSize}
              onChange={(e) => onChange({ ...theme, profileImageSize: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="rb-label-sm">Shape</label>
            <select
              value={profileImageShape}
              onChange={(e) => onChange({ ...theme, profileImageShape: e.target.value })}
              className="rb-select"
            >
              <option value="circle">Circle</option>
              <option value="rounded-square">Rounded Corners</option>
              <option value="square">Sharp Square</option>
              <option value="squircle">Squircle</option>
            </select>
          </div>

          <div className="rb-form-grid-2">
            <div>
              <label className="rb-label-sm">Border Width ({profileImageBorderWidth}px)</label>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={profileImageBorderWidth}
                onChange={(e) => onChange({ ...theme, profileImageBorderWidth: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="rb-label-sm">Border Color</label>
              <div className="rb-color-row">
                <input
                  type="color"
                  value={profileImageBorderColor}
                  onChange={(e) => handleColorChange('profileImageBorderColor', e.target.value)}
                />
                <span className="rb-color-value">{profileImageBorderColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="rb-section-title">Section Visibility</h4>
        <div className="rb-form-stack">
          {Object.keys(sectionVisibility).map((sec) => (
            <label key={sec} className="rb-visibility-item">
              <span style={{ textTransform: 'capitalize' }}>{sec}</span>
              <input
                type="checkbox"
                checked={!!sectionVisibility[sec]}
                onChange={() => handleVisibilityToggle(sec)}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
