import { Vector2d } from "./vector2d.js"

export class Rect {
  /**
  @param {Vector2d} tl
  @param {Vector2d} br
  */
  constructor(tl, br) {
    this.tl = tl;
    this.br = br;
  }

  /**
  @param {Vector2d} a
  @param {Vector2d} b
  */
  static create(a, b) {
    return new Rect(a.min(b), a.max(b));
  };

  /** @param {Rect} other */
  overlaps(other) {
    return this.br.greaterOrEqual(other.tl) && this.tl.less(other.br);
  };

  /** @param {number} other */
  enlarge(other) {
    return new Rect(this.tl.sub(Vector2d.fromScalar(other)),
      this.br.add(Vector2d.fromScalar(other)))
  }

  outerCorners() {
    return new Rect(this.tl.floor(), this.br.ceil());
  };
  innerCorners() {
    return new Rect(this.tl.ceil(), this.br.floor());
  };
  /** @param { (x: Vector2d) => void } f */
  eachGridPoint(f) {
    this.tl.eachGridPoint(this.br, f);
  };
  /** @param { (x: Vector2d) => Vector2d } f */
  map(f) {
    return new Rect(f(this.tl), f(this.br));
  };

  width() {
    return Math.abs(this.tl.x - this.br.x);
  };

  height() {
    return Math.abs(this.tl.y - this.br.y);
  };

  center() {
    return this.tl.add(this.br).scale(0.5);
  }


}
