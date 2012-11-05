## custom-json

  Library that provides JSON serialization of objects not supported natively
 by JSON such as Dates, RegExps, or any other user-defined class instance.

#### Installation

```sh
npm install custom-json
```

#### Usage

```js
// Nodejs
> var customJson = require('custom-json');

// Browser
> var customJson = window.customJson;

> var myJson = customJson.create({
...  magic: '#!',
...  serializers: [
...    customJson.dateSerializer,
...    customJson.regExpSerializer
...  ]
...});

// or just
> var myJson = customJson.create(); // The above options are defaults.

> myJson.stringify({birth: new Date(0), someRegex: /abc/gi}); 
'{"#!birth":"#!Date([0])","#!someRegex":"#!RegExp([\\"abc\\",\\"gi\\"])"}'

> myJson.parse(myJson.stringify({birth: new Date(0), someRegex: /abc/gi})) 
{ birth: Wed Dec 31 1969 21:00:00 GMT-0300 (BRT),
  someRegex: /abc/gi }
``` 

  The 'myJson' object can be used as a drop-in replacement for the global JSON  object(but the replacer/reviver arguments for stringify/parse will be ignored).

#### Implementation

  This is implemented using the 
<a href="https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/stringify">replacer</a>/<a href="https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse">reviver</a>
arguments, and serializes custom types to a string with this format:
{magic}{serializer name}({json array containing constructor arguments}). On
nested objects, the keys are also prefixed with the magic string, so no
untrusted input validatation needs to be done prior to serialization(unless the
keys are also untrusted).
