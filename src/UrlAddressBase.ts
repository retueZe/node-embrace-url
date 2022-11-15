export abstract class UrlAddressBase<T extends UrlAddressChunk = UrlAddressChunk> {
    readonly chunks: readonly T[]
    abstract readonly type: UrlAddressType

    constructor(chunks: readonly T[]) {
        this.chunks = chunks
    }

    protected abstract create(chunks: readonly T[]): UrlAddressBase<T>
    abstract toString(escaped?: boolean | null): string
    with(callback: (chunks: T[]) => void): UrlAddressBase<T> {
        const newChunks = [...this.chunks]
        callback(newChunks)
        
        return this.create(newChunks)
    }
    equals(other: UrlAddressBase): boolean {
        if (this.chunks.length !== other.chunks.length) return false

        for (let i = 0; i < this.chunks.length; i++)
            if (this.chunks[i] !== other.chunks[i])
                return false

        return true
    }
}
export type UrlAddressType = 'ipv4' | 'dns'
export type UrlAddressChunk = number | string
