/**
 * A tagged template function that allows creating HTML strings with
 * interpolated values.
 *
 * @param {TemplateStringsArray} strings - The literal strings in the template.
 * @param {...any} values - The interpolated values in the template.
 * @returns {string} - The resulting HTML string.
 */
export function html([first, ...strings], ...values) {
  return values.reduce((acc, v, i) => acc + String(v) + strings[i], first);
}

/**
 * @param {HTMLElement} container - The container to render the node in.
 * @param {string} inner - The inner HTML to be rendered.
 */
export function render(container, inner) {
  container.innerHTML = inner;
  return container;
}

/**
 * Searches within a parent node for multiple elements specified by an
 * id-to-class mapping, and validates that each element exists and is an
 * instance of its corresponding class.
 *
 * @template {Record<string, typeof HTMLElement>} T A mapping of element IDs to
 *   HTMLElement subclasses.
 * @param {HTMLElement} parentNode - The parent node to search within.
 * @param {T} idToClassMap - An object mapping element IDs to their respective
 *   class constructors.
 * @returns {{ [K in keyof T]: InstanceType<T[K]> }} An object mapping element
 *   IDs to their respective HTMLElement instances.
 * @throws {Error} Throws an error if an element with the specified id is not
 *   found or does not meet the specified criteria.
 */
export function findElements(parentNode, idToClassMap) {
  const elements = /** @type {{ [K in keyof T]: InstanceType<T[K]> }} */ ({});

  for (const id in idToClassMap) {
    const element = parentNode.querySelector(`#${id}`);

    if (!element) {
      throw new Error(`No element with id '${id}' found`);
    }

    const elementConstructor = idToClassMap[id];
    if (!(element instanceof elementConstructor)) {
      throw new Error(
        `Expected element of type ${elementConstructor.name} for id '${id}', but got ${element.constructor.name}`
      );
    }

    elements[id] = /** @type {InstanceType<T[typeof id]>} */ (element);
  }

  return elements;
}
