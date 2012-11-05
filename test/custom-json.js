var customJson = require('../lib/custom-json');

suite('Builtin serializers', function() {
  var JSON = customJson.create();
  var stringify = JSON.stringify;
  var parse = JSON.parse;

  test('shallow date to json', function() {
    var obj = new Date(343434);
    stringify(obj).should.equal('"#!Date([343434])"');
  });
  
  test('shallow json to date', function() {
    parse('"#!Date([2])"').getTime().should.equal(new Date(2).getTime());
  });

  test('deep date to json', function() {
    var obj = {a: {b: {c: new Date(-343433)}}};
    stringify(obj).should.equal('{"a":{"b":{"#!c":"#!Date([-343433])"}}}');
  });
  
  test('deep json to date', function() {
    var obj = parse('{"a":{"b":{"#!c":"#!Date([-343434])"}}}');
    obj.should.eql({a: {b: {c: new Date(-343434)}}});
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

});
