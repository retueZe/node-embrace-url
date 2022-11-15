import { IOption, Option } from 'async-option'

export class UrlQuery {
    static readonly EMPTY = new UrlQuery({})
    private _escaped: string | null = null
    private _unescaped: string | null = null
    private _isEmpty: boolean | null = null
    get isEmpty(): boolean {
        return this._isEmpty ??= Object.keys(this.data).length === 0
    }

    constructor(readonly data: Readonly<UrlQueryData>) {}

    static parse(input: string): IOption<UrlQuery> {
        return Option.some(input)
            .map(input => input.startsWith('?') ? input.slice(1) : input)
            .map(input => {
                const pairs = input.split('&').map(pair => pair.split('=') as [string, string])
                const data: Record<string, string> = {}

                for (const [key, value] of pairs)
                    data[key] = value

                const query = new UrlQuery(data)
                query._unescaped = input

                return query
            })
    }
    toString(escaped?: boolean | null, prependSeparator?: boolean): string {
        escaped ??= false
        prependSeparator ??= false
        const chunks: string[] = []

        if (escaped && this._escaped === null) {
            for (const key in this.data)
                chunks.push(encodeURIComponent(key) + '=' + encodeURIComponent(this.data[key]))

            this._escaped = chunks.join('&')
        } else if (!escaped && this._unescaped === null) {
            for (const key in this.data)
                chunks.push(key + '=' + this.data[key])
            
            this._unescaped = chunks.join('&')
        }

        const output = escaped ? this._escaped : this._unescaped

        return prependSeparator ? '?' + output : output
    }
    with(callback: (data: UrlQueryData) => void): UrlQuery {
        const newData = {...this.data}
        callback(newData)

        return new UrlQuery(newData)
    }
    get(key: string): IOption<string> {
        return Option.option(this.data[key])
    }
    set(key: string, value: string): UrlQuery {
        return this.with(data => data[key] = value)
    }
    setMany(data: Readonly<UrlQueryData>): UrlQuery {
        return this.with(target => {
            for (const key in data)
                target[key] = data[key]
        })
    }
    merge(query: UrlQuery): UrlQuery {
        return this.setMany(query.data)
    }
    unset(key: string): UrlQuery {
        return this.with(data => delete data[key])
    }
    unsetMany(keys: Iterable<string>): UrlQuery {
        return this.with(data => {
            for (const key of keys)
                delete data[key]
        })
    }
    equals(other: UrlQuery): boolean {
        if (Object.keys(this.data).length !== Object.keys(other.data).length)
            return false

        for (const key in this.data)
            if (this.data[key] !== other.data[key])
                return false

        return true
    }
}
export type UrlQueryData = Record<string, string>
export type UrlQueryParser = (input: string) =>
    | IOption<UrlQuery>
    | IOption<Readonly<UrlQueryData>>
    | UrlQuery
    | Readonly<UrlQueryData>
    | null | undefined
