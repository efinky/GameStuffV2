
export function Rect(tl, br) {
    this.tl = tl;
    this.br = br;
}

Rect.create = function(a, b) {
  return new Rect(a.min(b), a.max(b));
};

Rect.prototype.overlaps = function (other) {
  return this.br.greaterOrEqual(other.tl) && this.tl.less(other.br);
};

Rect.prototype.enlarge = function (other) {
  return new Rect(this.tl.sub(Vector2d.fromScalar(other)),
                  this.br.add(Vector2d.fromScalar(other)))
}

Rect.prototype.outerCorners = function () {
  return new Rect(this.tl.floor(), this.br.ceil());
};
Rect.prototype.innerCorners = function () {
  return new Rect(this.tl.ceil(), this.br.floor());
};
Rect.prototype.eachGridPoint = function(f) {
  this.tl.eachGridPoint(f, this.br);
};
Rect.prototype.map = function(f) {
  return new Rect(f(this.tl), f(this.br));
};

Rect.prototype.width = function() {
  return Math.abs(this.tl.x - this.br.x);
};

Rect.prototype.height = function() {
  return Math.abs(this.tl.y - this.br.y);
};

Rect.prototype.center = function() {
  return this.tl.add(this.br).scale(0.5);
}
