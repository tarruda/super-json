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
    return (typeof obj === 'object' && obj !== null) ||
      typeof obj === 'function';
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
    var i, installSerializer, parse, replacer, replaceValue,
    reviver, reviveValue, stringEscaper, stringify;
    var magic = escapeForRegExp((options && options.magic) ||
                                defaultOpts.magic);
    var initialSerializers = (options && options.serializers) ||
      defaultOpts.serializers;
    var serializers = [];
    var magicEscaper = new RegExp('([' + magic + '])', 'g');
    var magicUnescaper = new RegExp('([' + magic + '])\\1', 'g');
    var magicStartPattern = new RegExp('^([' + magic + ']+)(.+)$');
    var superJsonPattern = new RegExp('^' + magic + '(' +
                                      serializerNameFormat + ')' +
                                      '\\((\\[.*\\])\\)$');

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
      var args, constructor, match, name, i, serializer;

      if (typeof value === 'string' && 
          (match = magicStartPattern.exec(value))) {
        // Escape magic string at the start only
        return match[1].replace(magicEscaper, '$1$1') + match[2];
      } else {
        for (i = 0; i < serializers.length; i += 1) {
          serializer = serializers[i];
          constructor = serializer.constructorFunction;
          name = serializer.name;
          if (value && value.constructor === constructor) {
            args = serializer.serialize(value);
            if (!isArray(args))
              throw new Error("'serialize' function must return an array " +
                              "containing arguments for 'deserialize'");
            return magic + name + '(' + jsonStringify(args) + ')';
          }
        }
      }
    }

    replacer = function(key, value) {
      var k, setter, replacedValue, v;
      var rv = null;

      if (isReplaceable(value)) {
        if (isArray(value)) {
          rv = [];
          for (var i = 0; i < value.length; i += 1) {
            v = value[i];
            replacedValue = replaceValue(v);
            if (replacedValue === undefined) replacedValue = v;
            rv.push(replacedValue);
          }
        } else {
          rv = {};
          for (k in value) if (hasProp(value, k)) {
            v = value[k];
            replacedValue = replaceValue(v);
            if (replacedValue === undefined) replacedValue = v;
            rv[k] = replacedValue;
          }
        }
      }

      if (!rv) return value;
      return rv;
    }

    reviveValue = function(value) {
      var args, match, name, serializer;

      if (match = superJsonPattern.exec(value)) {
        name = match[1];
        args = jsonParse(match[2]);
        for (var i = 0; i < serializers.length; i += 1) {
          serializer = serializers[i];
          if (name === serializer.name)
            return serializer.deserialize.apply(serializer, args);
        }
      } else if (typeof value === 'string' &&
                 (match = magicStartPattern.exec(value))) {
        return match[1].replace(magicUnescaper, '$1') + match[2];
      }
    }

    reviver = function(key, value) {
      var k, match, revivedValue, v;

      if (typeof value == 'object') {
        for (k in value) if (hasProp(value, k)) {
          v = value[k];
          revivedValue = reviveValue(v);
          if (!revivedValue) revivedValue = v;
          value[k] = revivedValue;
        }
      }

      return value
    }

    stringify = function(obj, userReplacer, indent) {
      var rv;

      if (typeof userReplacer === 'number') 
        indent = userReplacer;

      if (!userReplacer && isReplaceable(obj))
        rv = replaceValue(obj);

      if (rv) 
        return jsonStringify(rv, null, indent);

      return jsonStringify(obj, typeof userReplacer === 'function' ?
                           userReplacer : replacer, indent);
    }

    parse = function(json, userReviver) {
      var rv;
      var parsed = jsonParse(json, typeof userReviver === 'function' ?
                            userReviver : reviver);

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
