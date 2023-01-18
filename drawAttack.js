import { Character } from "./character.js";
import { Vector2d } from "./vector2d.js";

/**
 * @param {Vector2d} viewportOrigin_w
 * @param {Character[]} characters
 * @param {CanvasRenderingContext2D} ctx
 */
export function drawCharacterHealthBars(characters, viewportOrigin_w, ctx) {
  for (const character of characters) {
      const {x, y} = character.characterPos_w.sub(viewportOrigin_w);
      const healthPercent = character.healthPercent();
      if (healthPercent != 1.0){
          const w = healthPercent * 32;
          ctx.fillStyle = "#00FF00";
          if (healthPercent < 0.7) {
              ctx.fillStyle = "#FFFF00";
          }
          if (healthPercent < 0.4) {
              ctx.fillStyle = "#FF0000";
          }
          ctx.fillRect(x, y-3, w, 2);
      }
  }

}