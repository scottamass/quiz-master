// Session codes are 6-character codes drawn from an unambiguous alphabet
// (no 0/O, 1/I, etc.) to make them easy to read aloud and type on a phone.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export function generateSessionCode() {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}

export function normalizeSessionCode(input) {
  return (input || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LENGTH)
}

export function isValidSessionCode(code) {
  if (typeof code !== 'string' || code.length !== CODE_LENGTH) return false
  return [...code].every((ch) => ALPHABET.includes(ch))
}
