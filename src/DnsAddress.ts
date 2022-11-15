import { IOption, Option } from 'async-option'
import { toASCII, toUnicode } from 'punycode'
import { UrlAddressBase, UrlAddressType } from './UrlAddressBase'

export class DnsAddress extends UrlAddressBase<string> {
    static readonly EXAMPLE_NET = new DnsAddress(['example', 'net'])
    private _escaped: string | null = null
    private _unescaped: string | null = null
    get type(): UrlAddressType {
        return 'dns'
    }

    constructor(chunks: readonly string[]) {
        super(chunks.map(toUnicode))
        this._unescaped ??= this.chunks.reduce((accumulator, chunk) => accumulator + '.' + chunk)
    }

    static parse(input: string): IOption<DnsAddress> {
        return Option.some(input.endsWith('.') ? input.slice(0, input.length - 1) : input)
            .map(input => input.split('.'))
            .map(chunks => new DnsAddress(chunks))
    }
    protected create(chunks: readonly string[]): DnsAddress {
        return new DnsAddress(chunks)
    }
    toString(escaped?: boolean | null, appendSeparator?: boolean | null): string {
        appendSeparator ??= false
        const output = escaped
            ? this._escaped ??= this.chunks
                .map(toASCII)
                .reduce((accumulator, chunk) => accumulator + '.' + chunk)
            : this._unescaped

        return appendSeparator ? output + '.' : output
    }
}
