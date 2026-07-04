import React from 'react';
import { getApiBase } from '../../lib/resume-api';

export default function BasicsForm({ basics = {}, theme = {}, onChange, onThemeChange }) {
  const handleChange = (key, value) => {
    onChange({ ...basics, [key]: value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${getApiBase()}/api/resumes/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.url) {
        handleChange('image', data.url);
      }
    } catch (err) {
      console.error('Failed to upload image:', err);
    }
  };

  const {
    profileImageSize = 96,
    profileImageShape = 'circle',
    profileImageBorderWidth = 2,
    profileImageBorderColor = '#ffffff'
  } = theme;

  return (
    <div className="space-y-4">
      {/* Profile Photo */}
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Profile Photo</label>
        <div className="flex items-center gap-4 bg-zinc-800/40 border border-zinc-800 rounded p-3">
          {basics.image ? (
            <img src={basics.image} className="w-14 h-14 rounded-lg object-cover border border-zinc-700" alt="avatar" />
          ) : (
            <div className="w-14 h-14 rounded-lg border border-dashed border-zinc-700 flex items-center justify-center text-xs text-muted-foreground bg-zinc-800/20">No photo</div>
          )}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="text-xs text-muted-foreground file:mr-4 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-foreground hover:file:bg-zinc-700 cursor-pointer"
            />
            {basics.image && (
              <button
                onClick={() => handleChange('image', '')}
                className="text-[10px] text-rose-400 hover:underline mt-1.5 block font-semibold bg-transparent border-0"
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        {basics.image && onThemeChange && (
          <div className="mt-3 p-3 bg-zinc-800/20 border border-zinc-800/60 rounded-lg space-y-3">
            <div className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Photo Style Settings</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Shape</label>
                <select
                  value={profileImageShape}
                  onChange={(e) => onThemeChange({ ...theme, profileImageShape: e.target.value })}
                  className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  <option value="circle">Circle</option>
                  <option value="rounded-square">Rounded Corners</option>
                  <option value="square">Sharp Square</option>
                  <option value="squircle">Squircle</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-muted-foreground block">Size ({profileImageSize}px)</label>
                </div>
                <input
                  type="range"
                  min="50"
                  max="180"
                  step="2"
                  value={profileImageSize}
                  onChange={(e) => onThemeChange({ ...theme, profileImageSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-zinc-800/40">
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Border Width ({profileImageBorderWidth}px)</label>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={profileImageBorderWidth}
                  onChange={(e) => onThemeChange({ ...theme, profileImageBorderWidth: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground block mb-1">Border Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={profileImageBorderColor}
                    onChange={(e) => onThemeChange({ ...theme, profileImageBorderColor: e.target.value })}
                    className="size-6 rounded border border-zinc-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-[10px] font-mono uppercase">{profileImageBorderColor}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Full Name</label>
          <input
            type="text"
            value={basics.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-zinc-700"
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Professional Title</label>
          <input
            type="text"
            value={basics.label || ''}
            onChange={(e) => handleChange('label', e.target.value)}
            className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-zinc-700"
            placeholder="Lead Developer"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Email Address</label>
          <input
            type="email"
            value={basics.email || ''}
            onChange={(e) => handleChange('email', e.target.value)}
            className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-zinc-700"
            placeholder="jane@email.com"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Phone Number</label>
          <input
            type="text"
            value={basics.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-zinc-700"
            placeholder="+1-555-0100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Website URL</label>
          <input
            type="text"
            value={basics.url || ''}
            onChange={(e) => handleChange('url', e.target.value)}
            className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-zinc-700"
            placeholder="linkedin.com/in/jane"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Location</label>
          <input
            type="text"
            value={basics.location || ''}
            onChange={(e) => handleChange('location', e.target.value)}
            className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-zinc-700"
            placeholder="San Francisco, CA"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground block mb-1">Professional Summary</label>
        <textarea
          value={basics.summary || ''}
          onChange={(e) => handleChange('summary', e.target.value)}
          rows={4}
          className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-zinc-700 resize-y"
          placeholder="Brief overview of your accomplishments and professional expertise..."
        />
      </div>
    </div>
  );
}
