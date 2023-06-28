/**
 * @template S, V
 * @param {S} state
 * @param {(state: S) => V} view
 * @param {Node | null} rootNode
 * @param {(node: Node, vdom: V, time: number) => Node} render
 */
export function mini(state, view, rootNode, render) {
  if (!rootNode) {
    throw new Error("No root element");
  }
  let node = rootNode;
  let busy = false;
  /** @param {(state: S) => void} f */
  const dispatch = (f) => {
    f(state);
    if (!busy) {
      busy = true;
      requestAnimationFrame((time) => {
        // The render may replace the root node
        node = render(node, view(state), time);
        busy = false;
      });
    }
    return state;
  };
  /** @param {(event: Event, state: S) => void} f */
  const eventHandler = (f) => {
    return (/** @type {Event} */ event) => {
      dispatch((state) => {
        f(event, state);
      });
    };
  };

  dispatch((state) => {});
  return { dispatch, eventHandler };
}
