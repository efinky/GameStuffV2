import { Vector2d } from "./vector2d.js";

/**
 * @template V
 */
class VectorMap {
  constructor() {
    this.map = new Map();
  }

  /**
   * @param {Vector2d} key
   * @return {V}
   */
  get(key) {
    return this.map.get(key.x)?.get(key.y);
  }

  /**
   * @param {Vector2d} key
   * @param {V} value
   */
  set(key, value) {
    if (!this.map.has(key.x)) {
      this.map.set(key.x, new Map());
    }
    this.map.get(key.x).set(key.y, value);
  }
}


/**
  * @param {VectorMap<Vector2d>} came_from
  * @param {Vector2d} current
  * @returns {Vector2d[]}
  */
function reconstruct_path(came_from, current) {
  const total_path = [current];
  while (true) {
    let previous = came_from.get(current);
    if (!previous) {
      break;
    }
    current = previous;
    total_path.push(current);
  }
  return total_path.reverse();
}


/**
 * @param {Vector2d} start
 * @param {Vector2d} goal
 * @param {(coord: Vector2d) => {cost: number, coord: Vector2d}[]} neighbors
 * @param {(start: Vector2d, goal: Vector2d) => number} heuristic
 * @returns {Vector2d[]}
 */
export function aStar(start, goal, neighbors, heuristic = (s, g) => s.distance(g), max_iterations = 200) {
  console.log("aStar", start, goal);
  /** @type {VectorMap<Vector2d>} */
  const came_from = new VectorMap();
  /** @type {VectorMap<number>} */
  const g_score = new VectorMap();
  /** @type {VectorMap<number>} */
  const f_score = new VectorMap();
  /** @type {Vector2d[]} */
  const open_set = [start];
  /** @type {Vector2d[]} */
  const closed_set = [];

  let iterations = 0;

  g_score.set(start, 0);
  f_score.set(start, heuristic(start, goal));



  while (open_set.length > 0) {
    let current = open_set[0];
    for (const node of open_set) {
      if (f_score.get(node) < f_score.get(current)) {
        current = node;
      }
    }

    if (current.equal(goal)) {
      return reconstruct_path(came_from, current);
    }

    open_set.splice(open_set.findIndex((s) => s.equal(current)), 1);
    closed_set.push(current);

    for (const {cost, coord: neighbor} of neighbors(current)) {
      if (closed_set.find((v) => v.equal(neighbor))) {
        continue;
      }

      const tentative_g_score = g_score.get(current) + cost;
      if (!open_set.find((v) => v.equal(neighbor))) {
        open_set.push(neighbor);
      } else if (tentative_g_score >= g_score.get(neighbor)) {
        continue;
      }

      came_from.set(neighbor, current);
      g_score.set(neighbor, tentative_g_score);
      f_score.set(neighbor, g_score.get(neighbor) + heuristic(neighbor, goal));
    }

    if (iterations > max_iterations) {
      break;
    }
    iterations++;
  }

  console.log("aStar failed", open_set, closed_set);

  return [];
}
