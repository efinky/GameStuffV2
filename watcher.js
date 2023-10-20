
/**
 * @template S, V
 */
export class Watcher {
  /**
    * @param {function(S):V} get
    * @param {function(V, V):void} onChange
  */
  constructor(get, onChange) {
    this.get = get;
    this.onChange = onChange;
  }

  /**
    * @param {V} previous
    * @param {V} next
   */
  check(previous, next) {
    if ((previous !== next) || JSON.stringify(previous) !== JSON.stringify(next)) {
      this.onChange(previous, next )
    }
  }
}