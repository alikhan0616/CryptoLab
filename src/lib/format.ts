import { bytesToBase64, bytesToBinary, bytesToHex } from './encoding'

export type OutFormat = 'hex' | 'base64' | 'binary'
export const OUT_FORMATS: { value: OutFormat; label: string }[] = [
  { value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }, { value: 'binary', label: 'Binary' },
]
export const formatBytes = (b: Uint8Array, f: OutFormat) => (f === 'hex' ? bytesToHex(b) : f === 'base64' ? bytesToBase64(b) : bytesToBinary(b))

/** Save text or bytes as a file in the user's Downloads. */
export function downloadFile(name: string, data: string | Uint8Array, type = 'application/octet-stream') {
  const blob = new Blob([data as BlobPart], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
