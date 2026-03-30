export async function sha256(data: Uint8Array): Promise<string> {
  const dataBuffer = new Uint8Array(data.byteLength)
  dataBuffer.set(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}
