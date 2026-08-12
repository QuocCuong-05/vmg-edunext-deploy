const DEVICE_PATTERNS = [
  [/Android/i, 'Android'],
  [/iPhone|iPad|iPod/i, 'iOS'],
  [/Windows/i, 'Windows'],
  [/Macintosh|Mac OS/i, 'macOS'],
  [/Linux/i, 'Linux'],
];

const BROWSER_PATTERNS = [
  [/Edg\//i, 'Edge'],
  [/Chrome\//i, 'Chrome'],
  [/Firefox\//i, 'Firefox'],
  [/Safari\//i, 'Safari'],
  [/Opera|OPR\//i, 'Opera'],
];

export function parseDeviceName(userAgent) {
  const ua = userAgent || '';
  const os = DEVICE_PATTERNS.find(([re]) => re.test(ua))?.[1] || 'Unknown OS';
  const browser = BROWSER_PATTERNS.find(([re]) => re.test(ua))?.[1] || 'Browser';
  return `${browser} · ${os}`;
}
