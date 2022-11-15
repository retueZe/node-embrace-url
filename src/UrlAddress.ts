import { IOption, Option } from 'async-option'
import { DnsAddress } from './DnsAddress'
import { IpV4Address } from './IpV4Address'

export type UrlAddress = IpV4Address | DnsAddress

export function parseUrlAddress(input: string): IOption<UrlAddress> {
    return Option.any<UrlAddress>([
        IpV4Address.parse(input),
        DnsAddress.parse(input)
    ])
}
