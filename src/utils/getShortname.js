import SETTINGS from '../settings';

// Reserved paths that should not be treated as association shortnames
const RESERVED_PATHS = [
  'www',
  'dashboard',
  'auth',
  'settings',
  'create-association',
  'transactions',
  'payment',
  'reset-password',
];

export function extractShortName({ pathShortName = null } = {}) {
  // Only use path-based shortname
  if (pathShortName && !RESERVED_PATHS.includes(pathShortName)) {
    return pathShortName;
  }

  // No valid shortname found
  return null;
}