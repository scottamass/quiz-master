// Server-side session-code generation. Same unambiguous alphabet as the
// client (no 0/O, 1/I) so codes are easy to read aloud and type.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 6

export function generateCode() {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return code
}
