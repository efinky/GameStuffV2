/**
 * @template S
 * @param {S} state
 * @param {(state: S) => void} onChange
 */
export function createStore(state, onChange) {
  let busy = false;
  /** @param {(state: S) => S | void} f */
  const dispatch = (f) => {

    state = f(state) || state;
    if (!busy) {
      busy = true;
      requestAnimationFrame((time) => {
        onChange(state);
        busy = false;
      });
    }
    return state;
  };

  dispatch((state) => {});
  return { dispatch, getState: () => state };
}
