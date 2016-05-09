import jsonStringify from 'json-stringify-safe';
import _padStart from 'lodash.padstart';
import arrayFrom from 'array-from';

function parseNumber(arg) {
  const invalid = 0;
  if (arg == null) {
    return invalid;
  }

  const number = Number(arg);
  const float = parseFloat(arg);
  if (isNaN(number) === false) {
    return number;
  } else if (isNaN(float) === false) {
    return float;
  }
  return invalid;
}
function parseString(arg) {
  const invalid = '';
  if (arg == null) {
    return invalid;
  }
  return jsonStringify(arg);
}
function parseBoolean(arg) {
  const invalid = false;
  if (arg == null) {
    return invalid;
  }
  if (arg === 'true') {
    return true;
  }
  if (arg === 'false') {
    return false;
  }
  if (parseNumber(arg) >= 1) {
    return true;
  }
  return Boolean(arg);
}

function toArray(arg) {
  return arg instanceof Array ? arg : [arg];
}

/**
* @module enforce
* @param {any} value - a target value
* @param {object} schema - a enforce define
* @returns {any} enforcedValue
*/
const enforce = (value, schema = {}) => {
  let actual = value;
  if (schema.default != null) {
    if (value == null) {
      return schema.default;
    }
  }

  switch (schema.type) {
    case 'number':
      actual = typeof actual === 'number' ? actual : parseNumber(actual);
      if (schema.min) {
        actual = actual < schema.min ? schema.min : actual;
      }
      if (schema.max) {
        actual = actual > schema.max ? schema.max : actual;
      }
      break;

    case 'boolean':
      actual = typeof actual === 'boolean' ? actual : parseBoolean(actual);
      break;

    case 'string':
    default:
      actual = typeof actual === 'string' ? actual : parseString(actual);
      if (schema.min) {
        actual = _padStart(actual, schema.min);
      }
      if (schema.max) {
        actual = arrayFrom(actual).slice(0, schema.max).join('');
      }
      break;
  }

  if (schema.valid) {
    const valid = toArray(schema.valid);
    const insensitiveValid = valid.map((val) => val.toLowerCase ? val.toLowerCase() : val);
    const insensitiveValue = value && value.toLowerCase ? value.toLowerCase() : value;
    const index = insensitiveValid.indexOf(insensitiveValue);
    if (index > -1) {
      return valid[index];
    }
    return valid[0];
  }
  return actual;
};

/**
* @module enforceObject
* @param {object} values - a target values
* @param {object} schemas - a enforce defines
* @returns {any} enforcedValues
*/
const enforceObject = (values, schemas = {}) => {
  const actualObject = {};
  Object.keys(schemas).forEach(key => {
    const actual = enforce(values[key], schemas[key]);
    if (values[key] != null && actual != null || schemas[key].default) {
      actualObject[key] = actual;
    }
  });
  return actualObject;
};

export default { enforce, enforceObject };
