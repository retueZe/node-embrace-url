import { IOption, Option, Parsers } from 'async-option'
import { UrlAddressBase, UrlAddressType } from './UrlAddressBase'

export class IpV4Address extends UrlAddressBase<number> {
    static readonly MIN_CHUNK = 0
    static readonly MAX_CHUNK = 255
    static readonly CHUNK_COUNT = 4
    static readonly ZERO = new IpV4Address([0, 0, 0, 0])
    private _stringified: string | null = null
    get type(): UrlAddressType {
        return 'ipv4'
    }

    constructor(chunks: readonly number[]) {
        super(chunks.map(Math.floor))

        if (this.chunks.length !== IpV4Address.CHUNK_COUNT) throw new Error('Invalid chunks count.')

        for (const chunk of this.chunks)
            if (chunk < IpV4Address.MIN_CHUNK - 0.5 || chunk > IpV4Address.MAX_CHUNK + 0.5)
                throw new Error('Chunk is out of range.')
    }

    static parse(input: string): IOption<IpV4Address> {
        return Option.some(input)
            .bind(input => Option.some(input.split('.'))
                .assert(chunks => chunks.length === IpV4Address.CHUNK_COUNT)
                .bind(chunks => Option.extractArray(chunks.map(Parsers.integer)))
                .assert(chunks => chunks.every(chunk =>
                    chunk > IpV4Address.MIN_CHUNK - 0.5 &&
                    chunk < IpV4Address.MAX_CHUNK + 0.5))
                .map(chunks => new IpV4Address(chunks))
                .onSome(address => address._stringified = input))
    }
    protected create(chunks: readonly number[]): IpV4Address {
        return new IpV4Address(chunks)
    }
    toString(): string {
        return this._stringified ??= this.chunks
            .map(chunk => chunk.toString())
            .reduce((accumulator, chunk) => accumulator + '.' + chunk)
    }
}
