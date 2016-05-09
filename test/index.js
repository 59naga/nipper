// dependencies
import assert from 'assert';

// target
import { enforce, enforceObject } from '../src';

// specs
describe('nipper', () => {
  describe('fixtureSchemaObject', () => {
    const fixtureSchemaObject = {
      text: {
        max: 200,
        default: 'hello',
      },
      speaker: {
        valid: ['hikari', 'haruka', 'takeru', 'santa', 'beer'],
      },
      format: {
        valid: ['ogg', 'wav', 'aac'],
      },
      emotion: {
        valid: ['happiness', 'anger', 'sadness'],
      },
      emotion_level: {
        type: 'number',
        min: 1,
        max: 4,
      },
      pitch: {
        type: 'number',
        min: 50,
        max: 200,
      },
      speed: {
        type: 'number',
        min: 50,
        max: 400,
      },
      volume: {
        type: 'number',
        min: 50,
        max: 200,
      },
    };

    it('should enforce the default only', () => {
      assert.deepStrictEqual(
        enforceObject({}, fixtureSchemaObject),
        {
          text: 'hello',
        }
      );
    });
    it('should enforce the defined schema only', () => {
      assert.deepStrictEqual(
        enforceObject({
          invalidKey: 'foo',
          text: 'bar',
          speaker: 'johndue',
          format: 'mp3',
          emotion: 'crazy',
          emotion_level: 1,
          pitch: 49,
          speed: 401,
          volume: 201,
        }, fixtureSchemaObject),
        {
          speaker: 'hikari',
          text: 'bar',
          format: 'ogg',
          emotion: 'happiness',
          emotion_level: 1,
          pitch: 50,
          speed: 400,
          volume: 200,
        },
      );
    });
  });

  describe('common properties', () => {
    describe('valid', () => {
      it('it should be used as a matching value(ignore case)', () => {
        assert(enforce('bar', { valid: ['foo', 'Bar', 'BAZ'] }) === 'Bar');
        assert(enforce('Baz', { valid: ['foo', 'Bar', 'BAZ'] }) === 'BAZ');
        assert(enforce('3', { valid: ['1', '2', '3'] }) === '3');
        assert(enforce(2, { valid: [1, 2, 3] }) === 2);
      });
      it('if no match, should use the first value', () => {
        assert(enforce(null, { valid: ['foo', 'bar', 'baz'] }) === 'foo');
        assert(enforce(undefined, { valid: ['foo', 'bar', 'baz'] }) === 'foo');
        assert(enforce({}, { valid: ['foo', 'bar', 'baz'] }) === 'foo');
        assert(enforce([], { valid: ['foo', 'bar', 'baz'] }) === 'foo');
        assert(enforce(true, { valid: ['foo', 'bar', 'baz'] }) === 'foo');
        assert(enforce(false, { valid: ['foo', 'bar', 'baz'] }) === 'foo');
      });
    });

    describe('default', () => {
      it('if null or undefined, it should use the default instead', () => {
        assert(enforce(null, { default: 1 }) === 1);
        assert(enforce(undefined, { default: 1 }) === 1);
        assert(enforce(undefined, { default: null }) === '');
      });
    });
  });

  describe('number', () => {
    it('it should be converted to non-numeric', () => {
      assert(enforce(null, { type: 'number' }) === 0);
      assert(enforce(undefined, { type: 'number' }) === 0);
      assert(enforce('foo', { type: 'number' }) === 0);
      assert(enforce({}, { type: 'number' }) === 0);
      assert(enforce([], { type: 'number' }) === 0);
      assert(enforce(false, { type: 'number' }) === 0);
      assert(enforce(true, { type: 'number' }) === 1);

      assert(enforce('1', { type: 'number' }) === 1);
      assert(enforce('1.1', { type: 'number' }) === 1.1);
      assert(enforce('100f', { type: 'number' }) === 100);
      assert(enforce('0xdeadbeef', { type: 'number' }) === 0xdeadbeef);
    });

    describe('min', () => {
      it('if less than min, it should be assign the min', () => {
        assert(enforce(0xdeadbeef, { type: 'number', min: 50 }) === 0xdeadbeef);

        assert(enforce(49, { type: 'number', min: 50 }) === 50);
        assert(enforce(1e6, { type: 'number', min: 1e7 }) === 1e7);
        assert(enforce(1, { type: 'number', min: 1.23 }) === 1.23);
      });
    });

    describe('max', () => {
      it('if greater than max, it should be assign the max', () => {
        assert(enforce(0xdeadbeef, { type: 'number', max: 50 }) === 50);

        assert(enforce(51, { type: 'number', max: 50 }) === 50);
        assert(enforce(1e8, { type: 'number', max: 1e7 }) === 1e7);
        assert(enforce(1.24, { type: 'number', max: 1.23 }) === 1.23);
      });
    });
  });

  describe('string', () => {
    it('it should be converted to non-string', () => {
      assert(enforce(null, { type: 'string' }) === '');
      assert(enforce(undefined, { type: 'string' }) === '');
      assert(enforce('foo', { type: 'string' }) === 'foo');
      assert(enforce({}, { type: 'string' }) === '{}');
      assert(enforce([], { type: 'string' }) === '[]');
      assert(enforce(false, { type: 'string' }) === 'false');
      assert(enforce(true, { type: 'string' }) === 'true');

      assert(enforce('1', { type: 'string' }) === '1');
      assert(enforce('1.1', { type: 'string' }) === '1.1');
      assert(enforce('100f', { type: 'string' }) === '100f');
      assert(enforce('0xdeadbeef', { type: 'string' }) === '0xdeadbeef');
    });

    describe('min', () => {
      it('if less than min, it should be left-padding using space', () => {
        assert(enforce('foo', { type: 'string', min: 5 }) === '  foo');
        assert(enforce('🍣', { type: 'string', min: 5 }) === '    🍣');
        assert(enforce('🍣🍣', { type: 'string', min: 2 }) === '🍣🍣');
        assert(enforce('🍣', { type: 'string', min: 1 }) === '🍣');
      });
    });

    describe('max', () => {
      it('if greater than max, it should be truncated in max', () => {
        assert(enforce('foo', { type: 'string', max: 2 }) === 'fo');
        assert(enforce('日本語', { type: 'string', max: 2 }) === '日本');
        assert(enforce('🍣', { type: 'string', max: 1 }) === '🍣');
        assert(enforce('🍣🍣', { type: 'string', max: 2 }) === '🍣🍣');
      });
    });
  });

  describe('boolean', () => {
    it('it should be converted to non-boolean', () => {
      assert(enforce(null, { type: 'boolean' }) === false);
      assert(enforce(undefined, { type: 'boolean' }) === false);
      assert(enforce('foo', { type: 'boolean' }) === true);
      assert(enforce({}, { type: 'boolean' }) === true);
      assert(enforce([], { type: 'boolean' }) === true);
      assert(enforce('false', { type: 'boolean' }) === false);
      assert(enforce('true', { type: 'boolean' }) === true);

      assert(enforce('1', { type: 'boolean' }) === true);
      assert(enforce('1.1', { type: 'boolean' }) === true);
      assert(enforce('100f', { type: 'boolean' }) === true);
      assert(enforce('0xdeadbeef', { type: 'boolean' }) === true);
    });
  });
});
