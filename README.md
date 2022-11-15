## Description

This package provides an URL parser based on the [`async-option`](https://npmjs.com/async-option) package. The classes are immutable and caching their stringified representations.

## Examples

```javascript
Url.parse('https://usr:psw@example.net:1234/path/to/file?a=b&c=d#fragment')
    .onBoth(console.log)

// Output:
// Url {
//   _escaped: null,
//   _unescaped: null,
//   protocol: 'https',
//   canHaveAuthority: true,
//   userInfo: UrlUserInfo {
//     name: 'usr',
//     _escaped: null,
//     _unescaped: 'usr:psw',
//     password: 'psw'
//   },
//   endpoint: Endpoint {
//     address: DnsAddress {
//       chunks: [Array],
//       _escaped: null,
//       _unescaped: 'example.net'
//     },
//     _escaped: null,
//     _unescaped: null,
//     port: 1234
//   },
//   path: UrlPath {
//     segments: [ 'path', 'to', 'file' ],
//     _escaped: null,
//     _unescaped: '/path/to/file'
//   },
//   query: UrlQuery {
//     data: { a: 'b', c: 'd' },
//     _escaped: null,
//     _unescaped: 'a=b&c=d',
//     _isEmpty: null
//   },
//   fragment: 'fragment'
// }
```
