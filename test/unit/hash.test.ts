import { describe, expect, it } from 'vitest'
import { sha256 } from '../../src/lib/hash'

describe('sha256', () => {
  it('hashes known input vector', async () => {
    const input = new TextEncoder().encode('abc')
    const digest = await sha256(input)
    expect(digest).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})
