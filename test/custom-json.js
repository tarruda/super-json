var customJson = require('../lib/custom-json');

suite('Builtin serializers', function() {
  var superJSON = customJson.create();
  var stringify = superJSON.stringify;
  var parse = superJSON.parse;

  test('shallow date to json', function() {
    var obj = new Date(343434);
    stringify(obj).should.equal('"#!Date([343434])"');
  });
  
  test('shallow json to date', function() {
    parse('"#!Date([2])"').getTime().should.equal(new Date(2).getTime());
  });

  test('deep date to json', function() {
    var obj = {a: {b: {c: new Date(-343433)}}};
    stringify(obj).should.equal('{"a":{"b":{"c":"#!Date([-343433])"}}}');
  });
  
  test('deep json to date', function() {
    var obj = parse('{"a":{"b":{"c":"#!Date([-343434])"}}}');
    obj.should.eql({a: {b: {c: new Date(-343434)}}});
  });

  test('it is not possible to insert the special string manually', function() {
    var obj = {a: {b: {c: '#!Date([-343434])'}}};
    var stringified = stringify(obj);
    stringified.should.equal('{"a":{"b":{"c":"##!!Date([-343434])"}}}');
    parse(stringified).should.eql(obj);
  });

  test('regexp with flags to json', function() {
    stringify(/abc\d/ig).should.eql('"#!RegExp([\\"abc\\\\\\\\d\\",\\"gi\\"])"');
  });

  test('json to regexp with flags', function() {
    var r = parse('"#!RegExp([\\"abc\\\\\\\\d\\",\\"gmi\\"])"');
    r.multiline.should.be.ok;
    r.global.should.be.ok;
    r.ignoreCase.should.be.ok;
  });

  test('regexp to json', function() {
    stringify(/abc\d/).should.eql('"#!RegExp([\\"abc\\\\\\\\d\\",\\"\\"])"');
  });

  test('json to regexp', function() {
    var r = parse('"#!RegExp([\\"abc\\\\\\\\d\\",\\"\\"])"');
    r.multiline.should.not.be.ok;
    r.global.should.not.be.ok;
    r.ignoreCase.should.not.be.ok;
  });

  test("complex object with indentation", function() {
    var obj = {
      someStr: 'Str',
      someBool: true,
      someNumber: 5,
      someArray: [
        1,
        null,
        'ssas',
        new Date(1),
        /abc/, {
          anotherArray: [new Date(2)],
          value: /someregex/i
        }
      ],
      someNull: null
    }
    var expected = 
      '{\n' +
      '  "someStr": "Str",\n' +
      '  "someBool": true,\n' +
      '  "someNumber": 5,\n' +
      '  "someArray": [\n' +
      '    1,\n' +
      '    null,\n' +
      '    "ssas",\n' +
      '    "#!Date([1])",\n' +
      '    "#!RegExp([\\"abc\\",\\"\\"])",\n' +
      '    {\n' + 
      '      "anotherArray": [\n' +
      '        "#!Date([2])"\n' +
      '      ],\n' +
      '      "value": "#!RegExp([\\"someregex\\",\\"i\\"])"\n' +
      '    }\n' +
      '  ],\n' +
      '  "someNull": null\n' +
      '}';
    var actual = stringify(obj, 2);
    actual.should.equal(expected);
    parse(actual).should.eql(obj);
  });


});
