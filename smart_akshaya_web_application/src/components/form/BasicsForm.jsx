import React from 'react';

export default function BasicsForm({ basics = {}, theme = {}, onChange, onThemeChange }) {
  const handleChange = (key, value) => {
    onChange({ ...basics, [key]: value });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      handleChange('image', reader.result);
    };
    reader.readAsDataURL(file);
  };

  const {
    profileImageSize = 96,
    profileImageShape = 'circle',
    profileImageBorderWidth = 2,
    profileImageBorderColor = '#ffffff'
  } = theme;

  return (
    <div className="rb-form-stack">
      <div>
        <label className="rb-label">Profile Photo</label>
        <div className="rb-photo-box">
          {basics.image ? (
            <img src={basics.image} className="rb-photo-preview" alt="Profile" />
          ) : (
            <div className="rb-photo-placeholder">No photo</div>
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="rb-input rb-input--sm"
            />
            {basics.image && (
              <button
                type="button"
                onClick={() => handleChange('image', '')}
                className="rb-link-btn"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {basics.image && onThemeChange && (
          <div className="rb-settings-box">
            <div className="rb-settings-title">Photo Style Settings</div>

            <div className="rb-form-grid-2">
              <div>
                <label className="rb-label-sm">Shape</label>
                <select
                  value={profileImageShape}
                  onChange={(e) => onThemeChange({ ...theme, profileImageShape: e.target.value })}
                  className="rb-select rb-input--sm"
                >
                  <option value="circle">Circle</option>
                  <option value="rounded-square">Rounded Corners</option>
                  <option value="square">Sharp Square</option>
                  <option value="squircle">Squircle</option>
                </select>
              </div>
              <div>
                <label className="rb-label-sm">Size ({profileImageSize}px)</label>
                <input
                  type="range"
                  min="50"
                  max="180"
                  step="2"
                  value={profileImageSize}
                  onChange={(e) => onThemeChange({ ...theme, profileImageSize: parseInt(e.target.value) })}
                />
              </div>
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
                  onChange={(e) => onThemeChange({ ...theme, profileImageBorderWidth: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="rb-label-sm">Border Color</label>
                <div className="rb-color-row">
                  <input
                    type="color"
                    value={profileImageBorderColor}
                    onChange={(e) => onThemeChange({ ...theme, profileImageBorderColor: e.target.value })}
                  />
                  <span className="rb-color-value">{profileImageBorderColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="rb-form-grid-2">
        <div>
          <label className="rb-label">Full Name</label>
          <input
            type="text"
            value={basics.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="rb-input"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="rb-label">Professional Title</label>
          <input
            type="text"
            value={basics.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="rb-input"
            placeholder="Lead Developer"
          />
        </div>
      </div>

      <div className="rb-form-grid-2">
        <div>
          <label className="rb-label">Email Address</label>
          <input
            type="email"
            value={basics.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="rb-input"
            placeholder="jane@email.com"
          />
        </div>
        <div>
          <label className="rb-label">Phone Number</label>
          <input
            type="text"
            value={basics.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="rb-input"
            placeholder="+1-555-0100"
          />
        </div>
      </div>

      <div className="rb-form-grid-2">
        <div>
          <label className="rb-label">Website URL</label>
          <input
            type="text"
            value={basics.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            className="rb-input"
            placeholder="linkedin.com/in/jane"
          />
        </div>
        <div>
          <label className="rb-label">Location</label>
          <input
            type="text"
            value={basics.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="rb-input"
            placeholder="San Francisco, CA"
          />
        </div>
      </div>

      <div>
        <label className="rb-label">Professional Summary</label>
        <textarea
          value={basics.summary || ''}
          onChange={(e) => handleChange('summary', e.target.value)}
          rows={4}
          className="rb-textarea"
          placeholder="Brief overview of your accomplishments and professional expertise..."
        />
      </div>
    </div>
  );
}
