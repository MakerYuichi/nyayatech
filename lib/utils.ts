export const capitalize = (s: string) =>
  s ? s.replace(/\b\w/g, l => l.toUpperCase()) : ''

export const formatPhone = (s: string) =>
  s ? s.replace(/\D/g, '') : ''
