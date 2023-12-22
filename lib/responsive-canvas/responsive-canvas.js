
/**
 * @typedef {CustomEvent<{
 *   time: number;
 *   canvas: HTMLCanvasElement;
 *   context: CanvasRenderingContext2D;
 * }>} OnFrameEvent
 */

export class ResponsiveCanvasElement extends HTMLElement {
  constructor() {
    super();
    this.handle = undefined;
    this.canvas = document.createElement("canvas");
    this.resizeObserver = new ResizeObserver((_entries) => {
      this.canvas.width = this.clientWidth;
      this.canvas.height = this.clientHeight;
    });

    this.attachShadow({ mode: "open" }).appendChild(this.canvas);
  }

  /**
   * @param {number} time
   * @returns {OnFrameEvent}
   */
  frameEvent(time) {
    const canvas = this.canvas;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("no context");
    }

    return new CustomEvent("frame", {
      detail: { time, canvas, context },
    });
  }

  /** @param {(frameEvent: OnFrameEvent) => void} callback */
  onFrame(callback) {
    this.addEventListener("frame", (event) => {
      callback(/** @type {OnFrameEvent} */ (event));
    });
  }

  connectedCallback() {
    this.tabIndex = 0;
    this.focus();
    // fixes performance issue on safari
    this.style.outline = "none";
    this.canvas.style.display = "block";
    this.resizeObserver.observe(this);

    /** @param {number} time */
    const render = (time) => {
      this.dispatchEvent(this.frameEvent(time));
      this.handle = requestAnimationFrame(render);
    };
    this.handle = requestAnimationFrame(render);
  }

  disconnectedCallback() {
    this.resizeObserver.disconnect();
    if (this.handle) {
      cancelAnimationFrame(this.handle);
    }
  }
}

customElements.define("responsive-canvas", ResponsiveCanvasElement);
