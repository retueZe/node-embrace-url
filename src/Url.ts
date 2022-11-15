import { IOption, IResult, Option, Result } from 'async-option'
import { Endpoint } from './Endpoint'
import { UrlAddress } from './UrlAddress'
import { UrlPath } from './UrlPath'
import { UrlQuery, UrlQueryData, UrlQueryParser } from './UrlQuery'
import { UrlUserInfo } from './UrlUserInfo'

export class Url {
    static readonly PATTERN = /^(?<protocol>[^:]+)(?<protocolPostfix>:\/\/|:)(?:(?<userInfo>[^@]*)@)?(?<endpoint>[^/?#]+)?(?<path>\/[^?#]*)?(?:\?(?<query>[^#]*))?(?:#(?<fragment>.*))?$/
    static readonly PROTOCOL_PATTERN = /^[a-z][a-z\d+-.]*$/i
    static readonly DEFAULT_PROTOCOL = 'http'
    static readonly DEFAULT_PROTOCOL_INFO: Readonly<UrlProtocolInfo> = {
        'http': true,
        'https': true,
        'tel': false,
        'file': true
    }
    private _escaped: string | null = null
    private _unescaped: string | null = null
    readonly protocol: string
    readonly canHaveAuthority: boolean
    readonly userInfo: UrlUserInfo
    readonly endpoint: Endpoint | null
    readonly path: UrlPath | null
    readonly query: UrlQuery
    readonly fragment: string
    get userName(): string {
        return this.userInfo.name
    }
    get password(): string {
        return this.userInfo.password
    }
    get address(): UrlAddress {
        return this.endpoint.address
    }
    get port(): number {
        return this.endpoint.port
    }
    get isHttpCompilant(): boolean {
        return (this.protocol === 'http' || this.protocol === 'https') &&
            this.endpoint !== null
    }

    constructor(components?: Readonly<UrlComponents> | null) {
        this.protocol = components?.protocol ?? Url.DEFAULT_PROTOCOL
        this.canHaveAuthority = components?.canHaveAuthority ?? true
        this.userInfo = components?.userInfo ?? UrlUserInfo.EMPTY
        this.endpoint = components.endpoint ?? null
        this.path = components?.path ?? null
        this.query = components?.query ?? UrlQuery.EMPTY
        this.fragment = decodeURIComponent(components?.fragment ?? '')

        if (!Url.PROTOCOL_PATTERN.test(this.protocol)) throw new Error('Invalid protocol.')
    }

    static parse(input: string, options?: UrlParseOptions): IResult<Url, UrlParseFailureReason> {
        const protocolInfo = options?.protocolInfo ?? Url.DEFAULT_PROTOCOL_INFO
        const defaultProtocolInfo = typeof options?.defaultProtocolInfo === 'undefined'
            ? true
            : options.defaultProtocolInfo
        const queryParser = options?.queryParser ?? UrlQuery.parse

        return Result.success<string, UrlParseFailureReason>(input)
            .bind(input => Option.option(Url.PATTERN.exec(input) ?? undefined)
                .toResult<UrlParseFailureReason>(() => 'invalid-url')
                .map(match => match.groups)
                .bind(groups => Option.some(groups.protocol)
                    .assert(protocol => Url.PROTOCOL_PATTERN.test(protocol))
                    .toResult<UrlParseFailureReason>(() => 'invalid-protocol')
                    .zip(protocol => Option.option(protocolInfo[protocol])
                        .wrapOr(() => Option.option(defaultProtocolInfo ?? undefined))
                        .assert(info => (groups.protocolPostfix === '://') === info)
                        .toResult(() => 'not-supported-protocol'))
                    .bind(([protocol, canHaveAuthority]) => Result.extractObject<UrlComponents, UrlParseFailureReason>({
                        protocol: Result.success(protocol),
                        canHaveAuthority: Result.success(canHaveAuthority),
                        userInfo: Option.option(groups.userInfo)
                            .map(userInfo => UrlUserInfo.parse(userInfo)
                                .toResult<UrlParseFailureReason>(() => 'invalid-user-info'))
                            .or(() => Result.success<UrlUserInfo, UrlParseFailureReason>(UrlUserInfo.EMPTY))
                            .assert(info => Option.some<UrlParseFailureReason>('unexpected-authority')
                                .assert(() => !info.isEmpty && !canHaveAuthority)),
                        endpoint: Option.option(groups.endpoint)
                            .map(endpoint => Endpoint.parse(endpoint)
                                .toResult<UrlParseFailureReason>(() => 'invalid-endpoint'))
                            .or(() => Result.success<Endpoint, UrlParseFailureReason>(null))
                            .assert(endpoint => Option.some<UrlParseFailureReason>('unexpected-authority')
                                .assert(() => endpoint !== null && !canHaveAuthority)),
                        path: Option.option(groups.path)
                            .map(path => UrlPath.parse(path)
                                .toResult<UrlParseFailureReason>(() => 'invalid-path'))
                            .or(() => Result.success<UrlPath>(null)),
                        query: Option.option(groups.query)
                            .map(query => this._parseQuery(query, queryParser)
                                .toResult<UrlParseFailureReason>(() => 'invalid-query'))
                            .or(() => Result.success(UrlQuery.EMPTY)),
                        fragment: Result.success(groups.fragment ?? '')
                    })))
                .map(components => new Url(components)))
                .onSuccess(url => url._unescaped = input)
    }
    private static _parseQuery(input: string, parser: UrlQueryParser): IOption<UrlQuery> {
        const parseResult = parser(input)
        const option = 'value' in parseResult && 'hasValue' in parseResult
            ? (parseResult as IOption<UrlQueryData>)
            : Option.option(parseResult)

        return option.map(result => result instanceof UrlQuery
            ? result
            : new UrlQuery(result))
    }
    toString(escaped?: boolean | null): string {
        escaped ??= false
        const protocolPostfix = this.canHaveAuthority
            ? '://'
            : ':'

        return escaped
            ? this._escaped ??= [
                this.protocol,
                protocolPostfix,
                this.userInfo.toString(true, true),
                this.endpoint?.toString(true) ?? '',
                this.path?.toString(true) ?? '',
                this.query.toString(true, !this.query.isEmpty),
                (this.fragment.length === 0 ? '' : '#' + encodeURIComponent(this.fragment))
            ].join('')
            : this._unescaped ??= [
                this.protocol,
                protocolPostfix,
                this.userInfo.toString(false, true),
                this.endpoint?.toString() ?? '',
                this.path?.toString() ?? '',
                this.query.toString(false, !this.query.isEmpty),
                (this.fragment.length === 0 ? '' : '#' + this.fragment)
            ].join('')
    }
    with(changes: UrlChanges): Url {
        const components: UrlComponents = {}

        for (const key in changes) {
            components[key] = (typeof changes[key] === 'function' ? changes[key](this) : changes[key])

            if (components[key] === null &&
                key !== 'endpoint' &&
                key !== 'path')
                components[key] = this[key]
        }

        return new Url(components)
    }
    equals(other: Url): boolean {
        return this.protocol === other.protocol &&
            this.canHaveAuthority === other.canHaveAuthority &&
            this.userInfo.equals(other.userInfo) &&
            (this.endpoint === null
                ? other.endpoint === null
                : this.endpoint.equals(other.endpoint)) &&
            (this.path === null
                ? other.path === null
                : this.path.equals(other.path)) &&
            this.query.equals(other.query) &&
            this.fragment === other.fragment
    }
}
export type UrlComponents = Partial<{
    protocol: string
    canHaveAuthority: boolean
    userInfo: UrlUserInfo
    endpoint: Endpoint | null
    path: UrlPath | null
    query: UrlQuery
    fragment: string
}>
export type UrlParseOptions = Partial<{
    protocolInfo: Readonly<UrlProtocolInfo>
    defaultProtocolInfo: boolean | null
    queryParser: UrlQueryParser
}>
export type UrlProtocolInfo = Record<string, boolean>
export type UrlParseFailureReason =
    | 'invalid-url'
    | 'invalid-protocol'
    | 'not-supported-protocol'
    | 'invalid-user-info'
    | 'invalid-endpoint'
    | 'unexpected-authority'
    | 'port-out-of-range'
    | 'invalid-path'
    | 'invalid-query'
export type UrlChanges = {
    [K in keyof UrlComponents]: UrlComponents[K] | ((url: Url) => UrlComponents[K] | null | undefined)
}
