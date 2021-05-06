
export class Rect {
  constructor(tl, br) {
    this.tl = tl;
    this.br = br;
  }

  static create(a, b) {
    return new Rect(a.min(b), a.max(b));
  };

  overlaps(other) {
    return this.br.greaterOrEqual(other.tl) && this.tl.less(other.br);
  };

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
  eachGridPoint(f) {
    this.tl.eachGridPoint(f, this.br);
  };
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
