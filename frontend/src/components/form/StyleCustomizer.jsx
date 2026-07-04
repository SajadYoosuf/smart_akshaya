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
    <div className="space-y-6">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Theme Colors</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Primary Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                  className="size-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Secondary Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                  className="size-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-800/40">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Font Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  className="size-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono">{textColor}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Background Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  className="size-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono">{backgroundColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Typography</h4>
        <label className="text-xs text-muted-foreground block mb-1">Font Family</label>
        <select
          value={fontFamily}
          onChange={(e) => onChange({ ...theme, fontFamily: e.target.value })}
          className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none"
        >
          <option value="Inter">Sans-Serif (Inter)</option>
          <option value="Montserrat">Modern CV (Montserrat)</option>
          <option value="Georgia">Serif (Georgia)</option>
          <option value="Monospace">Monospace (JetBrains)</option>
        </select>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Profile Photo Style</h4>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs text-muted-foreground block">Size ({profileImageSize}px)</label>
            </div>
            <input
              type="range"
              min="50"
              max="180"
              step="2"
              value={profileImageSize}
              onChange={(e) => onChange({ ...theme, profileImageSize: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">Shape</label>
            <select
              value={profileImageShape}
              onChange={(e) => onChange({ ...theme, profileImageShape: e.target.value })}
              className="w-full bg-[#2a2b2d] border border-zinc-800 rounded px-3 py-1.5 text-sm text-foreground focus:outline-none"
            >
              <option value="circle">Circle</option>
              <option value="rounded-square">Rounded Corners</option>
              <option value="square">Sharp Square</option>
              <option value="squircle">Squircle</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Border Width ({profileImageBorderWidth}px)</label>
              <input
                type="range"
                min="0"
                max="8"
                step="1"
                value={profileImageBorderWidth}
                onChange={(e) => onChange({ ...theme, profileImageBorderWidth: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Border Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={profileImageBorderColor}
                  onChange={(e) => handleColorChange('profileImageBorderColor', e.target.value)}
                  className="size-8 rounded border border-zinc-700 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono uppercase">{profileImageBorderColor}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Section Visibility</h4>
        <div className="space-y-2">
          {Object.keys(sectionVisibility).map((sec) => (
            <label key={sec} className="flex items-center justify-between p-2 rounded bg-zinc-800/40 border border-zinc-800 text-xs font-medium cursor-pointer">
              <span className="capitalize">{sec}</span>
              <input
                type="checkbox"
                checked={!!sectionVisibility[sec]}
                onChange={() => handleVisibilityToggle(sec)}
                className="rounded border-zinc-700 bg-zinc-800 text-sky-400 size-4 focus:ring-sky-400"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
