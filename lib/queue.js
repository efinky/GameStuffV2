// @ts-check
/**
 * An asynchronous queue. Pushes are synchronous, but pops are asynchronous and
 * will wait until a new element is available if the queue is empty.
 * @example
 * let q = Queue.new();
 * q.push(5);
 * q.pop().await;
 * // returns 5
 * @template T The type of elements in the queue. Type must not contain undefined.
 */
export class Queue {
  constructor() {
    /**
     * The queue of elements. This builds up if there are more `push()`s than
     * there are `pop()`s.
     * @type { (T)[] }
     */
    this.queue = [];
    /**
     * A queue of waiters. This builds up if there are more `pop()`s than
     * `push()`s.
     * @type { ((value: T ) => void)[] } */
    this.waiters = [];
  }
  /**
   * Push an element onto the queue, synchronously.
   * @param {T} element
   * @memberof Queue
   */
  push(element) {
    const waiter = this.waiters.pop();
    if (waiter === undefined) {
      this.queue.push(element);
    } else {
      waiter(element);
    }
  }

  /**
   * Synchronously drain the queue, calling `f` on each element.
   * @param {(value: T) => void} f
   */
  drain(f) {
    let element = this.queue.pop();
    while (element !== undefined) {
      f(element)
      element = this.queue.pop();
    }
  }

  /**
   * Returns an element from the queue. If the queue is empty, will wait
   * asynchronously for an element to be pushed onto the queue. If there were
   * multiple calls to `recv()` while the queue was empty, they will be resolve
   * in the order that the calls occurred.
   * @returns { Promise<T> }
   * @memberof Queue
   */
  async recv() {
    let element = this.queue.pop();
    if (element === undefined) {
      return new Promise((/** @type {((value: T ) => void)} */ resolve) => {
        this.waiters.push(resolve);
      });
    } else {
      return element;
    }
  }
}
