// @ts-strict
// @ts-check

/**
 * @template T
 */
export class Vector2d {
  /**
   * @param { T } x
   * @param { T } y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static fromScalar = function (scalar) {
    return new Vector2d(scalar, scalar);
  }

  arr() {
    return [this.x, this.y];
  }

  /**
   * @param { Rect<T> } rect
   */
  clamp(rect) {
    const vect = new this.constructor(this.x, this.y)
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
  mapLookup(map) {
    return map[Math.floor(this.y)][Math.floor(this.x)];
  }
  add(other) {
    return new this.constructor(this.x + other.x, this.y + other.y);
  };
  sub(other) {
    return new this.constructor(this.x - other.x, this.y - other.y);
  };
  mul(other) {
    return new this.constructor(this.x * other.x, this.y * other.y);
  };
  div(other) {
    return new this.constructor(this.x / other.x, this.y / other.y);
  };
  fmod(other) {
    return new this.constructor(this.x % other.x, this.y % other.y);
  };
  mod(other) {
    return new this.constructor(mod(this.x, other.x), mod(this.y, other.y));
  };
  neg() {
    return new this.constructor(-this.x, -this.y);
  };

  floor() {
    return new this.constructor(Math.floor(this.x), Math.floor(this.y));
  };
  round() {
    return new this.constructor(Math.round(this.x), Math.round(this.y));
  };
  ceil() {
    return new this.constructor(Math.ceil(this.x), Math.ceil(this.y));
  };

  equal(other) {
    if (other === null) {
      return false;
    }
    return (this.x + 0.005 > other.x && this.x - 0.005 < other.x) && (this.y + 0.005 > other.y && this.y - 0.005 < other.y);
  };
  greater(other) {
    return (this.x > other.x) && (this.y > other.y);
  };
  less(other) {
    return (this.x < other.x) && (this.y < other.y);
  };
  greaterOrEqual(other) {
    return (this.x >= other.x) && (this.y >= other.y);
  };
  lessOrEqual(other) {
    return (this.x <= other.x) && (this.y <= other.y);
  };

  scale(scalar) {
    return new this.constructor(this.x * scalar, this.y * scalar);
  };
  each(f, other) {
    return new this.constructor(f(this.x, other.x), f(this.y, other.y));
  };
  min(other) {
    return new this.each(Math.min, other);
  };
  max(other) {
    return new this.each(Math.max, other);
  };
  reduce(f) {
    return f(this.x, this.y);
  };
  sum() {
    return this.x + this.y;
  };
  dot(other) {
    return (this.x * other.x) + (this.y * other.y);
  };
  magnitude() {
    return Math.sqrt(this.dot(this));
  };

  perpendicular() {
    return new this.constructor(-this.y, this.x);
  };

  normalize() {
    var m = this.magnitude();
    if (m === 0) { return new this.constructor(0, 0); }
    else { return new this.constructor(this.x / m, this.y / m); }
  };

  clipTo(dist) {
    var mag = this.magnitude();
    if (mag > dist) {
      return this.scale(dist / mag);
    } else {
      return this
    }
  };

  abs() {
    return new this.constructor(Math.abs(this.x), Math.abs(this.y));
  };

  maxElem() {
    if (this.y > this.x) {
      return this.y;
    } else {
      return this.x;
    }
  }

  closestCardinal() {
    var absVec = this.abs();
    if (absVec.x >= absVec.y) {
      return new this.constructor(this.x / absVec.x, 0);
    } else {
      return new this.constructor(0, this.y / absVec.y);
    }
  }

  distance(other) {
    return this.sub(other).magnitude();
  };
  directionTo(other) {
    return other.sub(this).normalize();
  };
  eachGridPoint(to, f) {
    var diff = to.sub(this);
    for (var x = 0; x < diff.x; x++) {
      for (var y = 0; y < diff.y; y++) {
        var point = this.add(new this.constructor(x, y));
        f(point);
      }
    }
  };
  lookupByDir(vectorDict) {
    var vectorDictClone = vectorDict.slice(0);
    var obj = this;
    vectorDictClone.sort(function (a, b) {
      var thisN = obj.normalize();
      var aN = a.key.normalize();
      var bN = b.key.normalize();
      return thisN.dot(bN) - thisN.dot(aN);
    });
    return vectorDictClone[0].value;
  };

}