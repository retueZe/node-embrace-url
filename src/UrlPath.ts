import { IOption, Iteration, Option } from 'async-option'

export class UrlPath {
    static readonly EMPTY = new UrlPath([])
    private _escaped: string | null = null
    private _unescaped: string | null = null
    get isEmpty(): boolean {
        return this.segments.length === 0
    }

    constructor(readonly segments: readonly string[]) {}

    static parse(input: string): IOption<UrlPath> {
        return Option.some(input)
            .assert(input => input.startsWith('/'))
            .map(input => input.endsWith('/') && !input.endsWith('//')
                ? input.slice(0, input.length - 1)
                : input)
            .bind(input => Option.some(input.split('/'))
                .map(segments => segments.slice(1, segments.length - (input.endsWith('//') ? 1 : 0)))
                .map(segments => new UrlPath(segments))
                .onSome(path => path._unescaped = input))
    }
    toString(escaped?: boolean | null, forceAppendedSeparator?: boolean | null): string {
        escaped ??= false
        forceAppendedSeparator ??= false

        if (escaped && this._escaped === null) {
            this._escaped = (this.segments.length == 0 ? [''] : this.segments)
                .map(segment => '/' + encodeURIComponent(segment))
                .reduce((accumulator, segment) => accumulator + segment)

            if (this.segments[this.segments.length - 1].length === 0)
                this._escaped += '/'
        } else if (!escaped && this._unescaped === null) {
            this._unescaped ??= (this.segments.length == 0 ? [''] : this.segments)
                .map(segment => '/' + segment)
                .reduce((accumulator, segment) => accumulator + segment)

            if (this.segments[this.segments.length - 1].length === 0)
                this._unescaped += '/'
        }

        const output = escaped ? this._escaped : this._unescaped

        return forceAppendedSeparator && this.segments[this.segments.length - 1].length !== 0
            ? output + '/'
            : output
    }
    with(callback: (segments: string[]) => void): UrlPath {
        const newSegments = [...this.segments]
        callback(newSegments)

        return new UrlPath(newSegments)
    }
    append(path: UrlPath): UrlPath {
        return this.with(segments => segments.push(...path.segments))
    }
    prepend(path: UrlPath): UrlPath {
        return path.append(this)
    }
    remove(start: number, end?: number | null): UrlPath {
        start = Math.floor(start)
        end = Math.floor(end ?? this.segments.length)

        return this.with(segments => segments.splice(start, end - start))
    }
    equals(other: UrlPath): boolean {
        if (this.segments.length != other.segments.length) return false

        for (let i = 0; i < this.segments.length; i++)
            if (this.segments[i] != other.segments[i])
                return false

        return true
    }
    startsWith(path: UrlPath): boolean {
        if (path.segments.length > this.segments.length) return false

        for (let i = 0; i < path.segments.length; i++)
            if (this.segments[i] != path.segments[i])
                return false

        return true
    }
    endsWith(path: UrlPath): boolean {
        if (path.segments.length > this.segments.length) return false

        for (let i = 0; i < path.segments.length; i++)
            if (this.segments[this.segments.length - path.segments.length + i] != path.segments[i])
                return false

        return true
    }
    match(path: UrlPath, parameterNameExtracter?: ((segment: string) => IOption<string>)): UrlPathMatchResult {
        return Option.EMPTY
            .assert(() => path.segments.length === this.segments.length)
            .map(() => parameterNameExtracter ??= segment => Option.some(segment)
                .assert(segment => segment.startsWith('[') && segment.endsWith(']'))
                .map(segment => segment.slice(1, segment.length - 1)))
            .bind(parameterNameExtracter => Iteration.map<string, [string, string] | null>(this.segments,
                (segment, i) => parameterNameExtracter(segment)
                    .map<[string, string]>(parameterName => [parameterName, path.segments[i]])
                    .wrapOr(() => Option.EMPTY
                        .assert(() => path.segments[i] === segment)
                        .map(() => null))))
            .map(entries => {
                var result: Record<string, string> = {}

                for (const entry of entries)
                    if (entry !== null)
                        result[entry[0]] = entry[1]

                return result
            })
    }
}
export type UrlPathMatchResult = IOption<Record<string, string>>
