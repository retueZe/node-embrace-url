import { IOption, Option } from 'async-option'

export class UrlUserInfo {
    static readonly EMPTY = new UrlUserInfo('')
    private _escaped: string | null = null
    private _unescaped: string | null = null
    readonly password: string
    get isEmpty(): boolean {
        return this.name.length === 0 && this.password.length === 0
    }

    constructor(readonly name: string, password?: string | null) {
        this.password = password ?? ''
    }

    static parse(input: string): IOption<UrlUserInfo> {
        return Option.some(input)
            .map(input => input.endsWith('@') ? input.slice(0, input.length - 1) : input)
            .bind(input => Option.some(input.indexOf(':'))
                .map<[string, string]>(index => index === -1
                    ? [input, '']
                    : [input.slice(0, index), input.slice(index + 1)])
                .map(([name, password]) => new UrlUserInfo(name, password))
                .onSome(info => info._unescaped = input))
    }
    toString(escaped?: boolean | null, appendSeparator?: boolean | null): string {
        escaped ??= false
        appendSeparator ??= false
        const output = escaped
            ? this._escaped ??= this.password.length === 0
                ? encodeURIComponent(this.name)
                : `${encodeURIComponent(this.name)}:${encodeURIComponent(this.password)}`
            : this._unescaped ??= this.password.length === 0
                ? this.name
                : `${this.name}:${this.password}`

        return appendSeparator && output.length !== 0 ? output + '@' : output
    }
    with(changes: UrlUserInfoChanges): UrlUserInfo {
        const name = (typeof changes.name === 'function'
            ? changes.name(this)
            : changes.name) ?? ''
        const password = (typeof changes.password === 'function'
            ? changes.password(this)
            : changes.password) ?? ''

        return new UrlUserInfo(name, password)
    }
    equals(other: UrlUserInfo): boolean {
        return this.name === other.name &&
            this.password === other.password
    }
}
export type UrlUserInfoChanges = Partial<{
    name: string | ((info: UrlUserInfo) => string | null | undefined)
    password: string | ((info: UrlUserInfo) => string | null | undefined)
}>
