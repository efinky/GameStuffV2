// @ts-strict
// @ts-check

import { Rect } from "./rect.js"

export class Vector2d {
  /**
   * @param { number } x
   * @param { number } y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /** @param {number} scalar */
  static fromScalar(scalar) {
    return new Vector2d(scalar, scalar);
  }

  static zero() {
    return new Vector2d(0, 0);
  }

  /** @return {[number, number]} */
  arr() {
    return [this.x, this.y];
  }

  /** @param { Rect } rect */
  clamp(rect) {
    const vect = new Vector2d(this.x, this.y)
    if (vect.x < rect.tl.x) {
      vect.x = rect.tl.x;
    }
    else if (vect.x >= rect.br.x) {
      vect.x = rect.br.x;
    }
    if (vect.y < rect.tl.y) {
      vect.y = rect.tl.y;
    }
    else if (vect.y >= rect.br.y) {
      vect.y = rect.br.y;
    }
    return vect;
  }
  /**
  @param { Rect } rect
  */
  insideOf(rect) {
    if (this.x < rect.tl.x) {
      return false;
    } else if (this.x >= rect.br.x) {
      return false;
    }
    if (this.y < rect.tl.y) {
      return false
    } else if (this.y >= rect.br.y) {
      return false;
    }
    return true;
  }
  /**
   * @param {number[][]} map
   */
  mapLookup(map) {
    return map[Math.floor(this.y)][Math.floor(this.x)];
  }
  /**
  @param { Vector2d } other
  */
  add(other) {
    return new Vector2d(this.x + other.x, this.y + other.y);
  };
  /**
  @param { Vector2d } other
  */
  sub(other) {
    return new Vector2d(this.x - other.x, this.y - other.y);
  };
  /**
  @param { Vector2d } other
  */
  mul(other) {
    return new Vector2d(this.x * other.x, this.y * other.y);
  };
  /**
  @param { Vector2d } other
  */
  div(other) {
    return new Vector2d(this.x / other.x, this.y / other.y);
  };
  /**
  @param { Vector2d } other
  */
  fmod(other) {
    return new Vector2d(this.x % other.x, this.y % other.y);
  };
  neg() {
    return new Vector2d(-this.x, -this.y);
  };

  floor() {
    return new Vector2d(Math.floor(this.x), Math.floor(this.y));
  };
  round() {
    return new Vector2d(Math.round(this.x), Math.round(this.y));
  };
  ceil() {
    return new Vector2d(Math.ceil(this.x), Math.ceil(this.y));
  };

  /**
  @param { Vector2d } other
  */
  equal(other) {
    if (other === null) {
      return false;
    }
    return (this.x + 0.005 > other.x && this.x - 0.005 < other.x) && (this.y + 0.005 > other.y && this.y - 0.005 < other.y);
  };
  /**
  @param { Vector2d } other
  */
  greater(other) {
    return (this.x > other.x) && (this.y > other.y);
  };
  /**
  @param { Vector2d } other
  */
  less(other) {
    return (this.x < other.x) && (this.y < other.y);
  };
  /**
  @param { Vector2d } other
  */
  greaterOrEqual(other) {
    return (this.x >= other.x) && (this.y >= other.y);
  };
  /**
  @param { Vector2d } other
  */
  lessOrEqual(other) {
    return (this.x <= other.x) && (this.y <= other.y);
  };

  /**
  @param { number } scalar
  */
  scale(scalar) {
    return new Vector2d(this.x * scalar, this.y * scalar);
  };
  /**
  @param { (a: number, b: number) => number } f
  @param { Vector2d } other
  */
  each(f, other) {
    return new Vector2d(f(this.x, other.x), f(this.y, other.y));
  };
  /**
  @param { Vector2d } other
  */
  min(other) {
    return this.each(Math.min, other);
  };
  /**
  @param { Vector2d } other
  */
  max(other) {
    return this.each(Math.max, other);
  };
  /**
   * @template T
   * @param {(a: number, b: number) => T } f
   * @returns T
   */
  reduce(f) {
    return f(this.x, this.y);
  };
  sum() {
    return this.x + this.y;
  };
  /**
  @param { Vector2d } other
  */
  dot(other) {
    return (this.x * other.x) + (this.y * other.y);
  };
  magnitude() {
    return Math.sqrt(this.dot(this));
  };

  perpendicular() {
    return new Vector2d(-this.y, this.x);
  };

  normalize() {
    let m = this.magnitude();
    if (m === 0) { return new Vector2d(0, 0); }
    else { return new Vector2d(this.x / m, this.y / m); }
  };

  /**
   * @param {number} dist
   */
  clipTo(dist) {
    let mag = this.magnitude();
    if (mag > dist) {
      return this.scale(dist / mag);
    } else {
      return this
    }
  };

  abs() {
    return new Vector2d(Math.abs(this.x), Math.abs(this.y));
  };

  maxElem() {
    if (this.y > this.x) {
      return this.y;
    } else {
      return this.x;
    }
  }

  closestCardinal() {
    let absVec = this.abs();
    if (absVec.x >= absVec.y) {
      return new Vector2d(this.x / absVec.x, 0);
    } else {
      return new Vector2d(0, this.y / absVec.y);
    }
  }

  /** @param { Vector2d } other */
  distance(other) {
    return this.sub(other).magnitude();
  };
  /** @param { Vector2d } other */
  directionTo(other) {
    return other.sub(this).normalize();
  };
  /**
  @param { Vector2d } to
  @param { (x: Vector2d) => void } f
  */
  eachGridPoint(to, f) {
    let diff = to.sub(this);
    for (let x = 0; x < diff.x; x++) {
      for (let y = 0; y < diff.y; y++) {
        let point = this.add(new Vector2d(x, y));
        f(point);
      }
    }
  };
  /**
   * @template T
   * @param {{key: Vector2d, value: T}[]} vectorDict
   */
  lookupByDir(vectorDict) {
    let vectorDictClone = [...vectorDict];
    let obj = this;

    vectorDictClone.sort(function (a, b) {
      let thisN = obj.normalize();
      let aN = a.key.normalize();
      let bN = b.key.normalize();
      return thisN.dot(bN) - thisN.dot(aN);
    });
    return vectorDictClone[0].value;
  };

}