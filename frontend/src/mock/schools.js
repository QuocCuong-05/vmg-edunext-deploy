const SCHOOLS = [
  { id: 'school-1', name: 'Trường THCS Hùng Vương', ward: 'Trấn Biên' },
  { id: 'school-2', name: 'Trường THCS Lý Tự Trọng', ward: 'Long Bình' },
];

export default SCHOOLS;
export function getSchools(wardName) {
  if (!wardName) return SCHOOLS;
  return SCHOOLS.filter(s => s.ward === wardName);
}
