
/**
 * @template T
 * @typedef {| {
 *       name: string;
 *       toJSON?: (a: any, context?: T) => any;
 *       fromJSON: (a: any, context?: T) => any;
 *     }
 *   | {
 *       prototype: any;
 *       name: string;
 *       toJSON?: (a: any, context?: T) => any;
 *       fromJSON?: undefined;
 *     }} SerializableClass
 */


/** @template T */
export class Serializer {
  /**
   * Creates an instance of Serializer.
   *
   * @memberof Serializer
   * @param {SerializableClass<T>[]} registeredClasses Default is
   *   `registeredClasses`
   */
  constructor(registeredClasses) {
    this.registeredClasses = registeredClasses.concat([
      {
        name: Map.name,
        toJSON: (m) => [...m.entries()],
        fromJSON: (entries) => new Map(entries),
      },
      {
        name: Set.name,
        toJSON: (m) => [...m.values()],
        fromJSON: (values) => new Set(values),
      },
    ]);
  }
  /** @param {SerializableClass<T>} c */
  registerClass(c) {
    this.registeredClasses.push(c);
  }
  /**
   * @param {any} obj
   * @param {T | undefined} [context=undefined] Default is `undefined`
   * @returns {string}
   */
  stringify(obj, context = undefined) {
    /**
     * @param {string} key
     * @param {any} value
     */
    const replacer = (key, value) => {
      if (typeof value === "function") {
        throw Error("Cannot serialize a function");
      }
      if (
        !(value instanceof Object) ||
        value.constructor.name === "Object" ||
        value.constructor.name === "Array"
      ) {
        // if this is a value that JSON.parse/stringify can just handle, then leave
        // unchanged
        return value;
      }

      let registeredClass = this.registeredClasses.find(
        (e) => e.name === value.constructor.name
      );
      if (!registeredClass) {
        throw Error(`Unknown class name: ${value.constructor.name}`);
      }
      if (registeredClass.toJSON) {
        // if we have specified a specific toJSON function, use that
        return {
          __class__: value.constructor.name,
          __data__: registeredClass.toJSON(value, context),
        };
      } else if (value.toJSON) {
        // otherwise if the class itself has a `toJSON` method, then use that
        return { __class__: value.constructor.name, __data__: value.toJSON() };
      } else {
        // otherwise just take note of the constructor name, and hope this works
        return { __class__: value.constructor.name, __data__: { ...value } };
      }
    };
    return JSON.stringify(obj, replacer);
  }

  /**
   * @param {string} str
   * @param {T | undefined} [context=undefined] Default is `undefined`
   */
  parse(str, context) {
    /**
     * @param {string} key
     * @param {any} value
     */
    const reviver = (key, value) => {
      if (!value?.__class__) {
        // if this isn't a special value, then leave it unchanged
        return value;
      }
      let registeredClass = this.registeredClasses.find(
        (e) => e.name === value.__class__
      );
      if (!registeredClass) {
        // If it _is_ a special value, but it's not registered, error.
        throw Error(`Unknown class name: ${value.constructor.name}`);
      }
      if (registeredClass.fromJSON) {
        // if we have a custom `fromJSON` use that,
        return registeredClass.fromJSON(value.__data__, context);
      } else {
        return Object.setPrototypeOf(value.__data__, registeredClass.prototype);
      }
    };
    return JSON.parse(str, reviver);
  }
}