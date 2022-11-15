import { IOption, Option, Parsers } from 'async-option'
import { DnsAddress } from './DnsAddress'
import { parseUrlAddress, UrlAddress } from './UrlAddress'

export class Endpoint {
    static readonly EXAMPLE_NET = new Endpoint(DnsAddress.EXAMPLE_NET)
    private _escaped: string | null = null
    private _unescaped: string | null = null
    readonly port: number

    constructor(readonly address: UrlAddress, port?: number | null) {
        this.port = Math.floor(port ?? 0)

        if (this.port < -0.5) throw new Error('Port cannot be negative.')
    }

    static parse(input: string): IOption<Endpoint> {
        return Option.some(input.split(':'))
            .assert(segments => segments.length < 2.5)
            .bind(([address, port]) => Option.extractObject({
                address: parseUrlAddress(address),
                port: Parsers.integer(port)
                    .wrapOr(() => Option.some(0))
                    .assert(port => port > -0.5)
            }))
            .map(({address, port}) => new Endpoint(address, port))
    }
    toString(escaped?: boolean | null) {
        escaped ??= false

        return escaped
            ? this.port === 0
                ? this._escaped ??= this.address.toString(true)
                : this._escaped ??= this.address.toString(true) + ':' + this.port
            : this.port === 0
                ? this._unescaped ??= this.address.toString()
                : this._unescaped ??= this.address.toString() + ':' + this.port
    }
    with(changes: EndpointChanges): Endpoint {
        const newAddress = (typeof changes.address === 'function' ? changes.address(this) : changes.address)
            ?? this.address
        const newPort = (typeof changes.port === 'function' ? changes.port(this) : changes.port)
            ?? this.port

        return new Endpoint(newAddress, newPort)
    }
    equals(other: Endpoint): boolean {
        return this.address.equals(other.address) &&
            this.port === other.port
    }
}
export type EndpointChanges = Partial<{
    address: UrlAddress | ((endpoint: Endpoint) => UrlAddress | null | undefined)
    port: number | ((endpoint: Endpoint) => number | null | undefined)
}>
