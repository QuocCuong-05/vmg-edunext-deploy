export const PASSWORD_RULES = [
  { key: 'length', label: 'Tối thiểu 6 ký tự', test: pw => pw.length >= 6 },
  { key: 'upper', label: 'Ít nhất 1 chữ hoa (A-Z)', test: pw => /[A-Z]/.test(pw) },
  { key: 'lower', label: 'Ít nhất 1 chữ thường (a-z)', test: pw => /[a-z]/.test(pw) },
  { key: 'number', label: 'Ít nhất 1 chữ số (0-9)', test: pw => /\d/.test(pw) },
  { key: 'special', label: 'Ít nhất 1 ký tự đặc biệt (!@#...)', test: pw => /[^A-Za-z0-9]/.test(pw) },
];

export function validatePassword(pw) {
  const value = pw || '';
  const failed = PASSWORD_RULES.filter(r => !r.test(value)).map(r => r.label);
  return { ok: failed.length === 0, failed };
}
