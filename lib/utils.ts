import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'

/** Generates a random 8-character alphanumeric password (avoids ambiguous chars). */
export function generatePassword(length = 8): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += PASSWORD_CHARS.charAt(Math.floor(Math.random() * PASSWORD_CHARS.length))
  }
  return result
}
