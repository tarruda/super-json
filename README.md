## super-json

  Library that provides JSON serialization of javascript objects not supported natively
 by JSON such as Dates, RegExps, Functions or any other user-defined class instance.

#### Installation

```sh
npm install super-json
```

#### Usage

```js
// Nodejs
> var superJson = require('super-json');

// Browser
> var superJson = window.superJson;

> var myJson = superJson.create({
...  magic: '#!',
...  serializers: [
...    superJson.dateSerializer,
...    superJson.regExpSerializer,
...    superJson.functionSerializer
...  ]
...});

// or just
> var myJson = superJson.create(); // The above options are defaults.

> myJson.stringify({birth: new Date(0), someRegex: /abc/gi}); 
'{"birth":"#!Date[0]","someRegex":"#!RegExp[\\"abc\\",\\"gi\\"]"}'

> myJson.parse(myJson.stringify({birth: new Date(0), someRegex: /abc/gi})) 
{ birth: Wed Dec 31 1969 21:00:00 GMT-0300 (BRT),
  someRegex: /abc/gi }
``` 

  It is possible to use 'myJson' as a drop-in replacement for the global JSON
object, but if the replacer/reviver arguments are used the custom serialization
will not work.

#### Implementation

  This is implemented using the 
<a href="https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/stringify">replacer</a>/<a href="https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/JSON/parse">reviver</a>
arguments, and serializes custom types to a string that looks like this:
{magic}{serializer name}{json array containing constructor arguments}. The
magic string is escaped when serializing strings, so user input doesn't need
to be validated.

#### Customize serialization

  Just pass an object that looks like this(example from the date serializer):

```js
dateSerializer = {
  serialize: function(date) {
    return [date.getTime()];
  },
  deserialize: function(time) {
    return new Date(time);
  },
  isInstance: function(obj) {
    return obj instanceof Date;
  },
  name: 'Date'
}
```
