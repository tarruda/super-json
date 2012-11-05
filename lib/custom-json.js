(function (global, exports) {
  var Date = global.Date;
  var Function = global.Function;
  var RegExp = global.RegExp;

  var create, defaultOpts, dateSerializer, escapeForRegExp, isArray,
      isReplaceable, regExpSerializer
  var hasProp = function(obj, prop) { return Object.hasOwnProperty.call(obj, prop); };
  var jsonParse = JSON.parse;
  var jsonStringify = JSON.stringify;
  var serializerNameFormat = '[a-zA-Z_$][0-9a-zA-Z_$]*';
  var serializerNamePattern = new RegExp('^' + serializerNameFormat + '$');

  isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
  }

  escapeForRegExp = function(s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  isReplaceable = function(obj) {
    return typeof obj === 'object' || typeof obj === 'function';
  }

  dateSerializer = {
    serialize: function(date) {
      return [date.getTime()];
    },
    deserialize: function(time) {
      return new Date(time);
    },
    constructorFunction: Date
  }

  regExpSerializer = {
    serialize: function(regExp) {
      var flags = '';
      if (regExp.global) flags += 'g';
      if (regExp.multiline) flags += 'm';
      if (regExp.ignoreCase) flags += 'i';
      return [regExp.source, flags];
    },
    deserialize: function(source, flags) {
      return new RegExp(source, flags);
    },
    constructorFunction: RegExp
  }

  defaultOpts = {
    magic: '#!',
    serializers: [dateSerializer, regExpSerializer]
  }

  create = function(options) {
    var i, installSerializer, parse, replacer, replaceValue, reviver,
        reviveValue, stringify;
    var magic = (options && options.magic) || defaultOpts.magic;
    var initialSerializers = (options && options.serializers) ||
      defaultOpts.serializers;
    var serializers = [];
    var valuePattern = new RegExp('^' + escapeForRegExp(magic) +
                                  '(' + serializerNameFormat + ')' +
                                  '\\((\\[.*\\])\\)$');
    var keyPattern = new RegExp('^' + escapeForRegExp(magic) + '(.+)$');

    installSerializer = function(serializer) {
      if (!serializer.name)
        serializer.name = serializer.constructorFunction.name;

      if (!serializerNamePattern.test(serializer.name))
        throw new Error("Serializers must have a 'name' property " +
                        'that is a valid javascript identifier');

      if (typeof serializer.serialize !== 'function')
        throw new Error("Serializers must have a 'serialize' function");

      if (typeof serializer.deserialize !== 'function')
        throw new Error("Serializers must have a 'deserialize' function");

      if (typeof serializer.constructorFunction !== 'function')
        throw new Error("Serializers must have a 'constructorFunction' " +
                        'property that represents the constructor of the ' +
                        'custom object to be serialized');

      serializers.push(serializer);
    }

    for (i = 0; i < initialSerializers.length; i += 1)
      installSerializer(initialSerializers[i]);

    replaceValue = function(value) {
      var args, constructor, name, i, serializer;

      for (i = 0; i < serializers.length; i += 1) {
        serializer = serializers[i];
        constructor = serializer.constructorFunction;
        name = serializer.name;
        if (constructor === value.constructor) {
          args = serializer.serialize(value);
          if (!isArray(args))
            throw new Error("'serialize' function must return an array " +
                            "containing arguments for 'deserialize'");
          return magic + name + '(' + jsonStringify(args) + ')';
        }
      }
    }

    replacer = function(key, value) {
      var k, replacedValue, v;
      var replaced = {};

      if (typeof value === 'object' && value !== null)
        for (k in value) if (hasProp(value, k)) {
          v = value[k];
          replacedValue = replaceValue(v);
          if (replacedValue)
            replaced[magic + k] = replacedValue;
          else
            replaced[k] = v;
        }

        if (Object.keys(replaced).length) return replaced;
        return value;
    }

    reviveValue = function(value) {
      var args, match, name, serializer;

      if (match = valuePattern.exec(value)) {
        name = match[1];
        args = jsonParse(match[2]);
        for (var i = 0; i < serializers.length; i += 1) {
          serializer = serializers[i];
          if (name === serializer.name)
            return serializer.deserialize.apply(serializer, args);
        }
      }
    }

    reviver = function(key, value) {
      var k, match, revivedValue, v;

      if (typeof value == 'object')
        for (k in value) if (hasProp(value, k)) {
          v = value[k];
          if ((match = keyPattern.exec(k)) && typeof v === 'string') { 
            revivedValue = reviveValue(v);
            if (revivedValue) {
              value[match[1]] = revivedValue;
              delete value[k];
            }
          }
        }

      return value
    }

    stringify = function(obj, indent, indent2) {
      var rv;

      indent = typeof indent !== 'number' ? indent2 : indent;
      if (typeof obj === 'object') rv = replaceValue(obj);
      if (rv) return jsonStringify(rv, null, indent);
      return jsonStringify(obj, replacer, indent);
    }

    parse = function(json) {
      var rv;
      var parsed = jsonParse(json, reviver);

      if (typeof parsed === 'string') rv = reviveValue(parsed);
      if (!rv) rv = parsed;
      return rv;
    }

    return {stringify: stringify, parse: parse};
  }

  exports.dateSerializer = dateSerializer;
  exports.regExpSerializer = regExpSerializer;
  exports.create = create;

}).apply(this, typeof(window) === 'undefined' ?
  [global, module.exports] : [window, window.customJson = {}]);
