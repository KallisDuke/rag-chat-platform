import { randomBytes } from "node:crypto";

// Unambiguous alphabet (no 0/O/1/l/I) so emailed passwords are easy to type.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export const generatePassword = (length = 14): string => {
  let password = "";

  for (const byte of randomBytes(length)) {
    password += ALPHABET.charAt(byte % ALPHABET.length);
  }

  return password;
};
