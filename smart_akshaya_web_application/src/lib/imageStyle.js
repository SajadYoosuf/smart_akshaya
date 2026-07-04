/**
 * Computes custom inline styles for profile images based on the theme customizer.
 * Falls back to template-specific defaults if options are not customized.
 * 
 * @param {Object} theme - The theme configuration object.
 * @param {Object} defaults - Template-specific defaults (size, shape, borderWidth, borderColor).
 */
export function getProfileImageStyle(theme = {}, defaults = {}) {
  const size = theme.profileImageSize !== undefined ? theme.profileImageSize : (defaults.size || 96);
  const shape = theme.profileImageShape || defaults.shape || 'circle';
  const borderWidth = theme.profileImageBorderWidth !== undefined ? theme.profileImageBorderWidth : (defaults.borderWidth !== undefined ? defaults.borderWidth : 2);
  const borderColor = theme.profileImageBorderColor || defaults.borderColor || '#ffffff';

  let borderRadius = '50%';
  if (shape === 'rounded-square') {
    borderRadius = '12px';
  } else if (shape === 'square') {
    borderRadius = '0px';
  } else if (shape === 'squircle') {
    borderRadius = '24px';
  }

  return {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: borderRadius,
    borderWidth: `${borderWidth}px`,
    borderStyle: borderWidth > 0 ? 'solid' : 'none',
    borderColor: borderColor,
    objectFit: 'cover'
  };
}
