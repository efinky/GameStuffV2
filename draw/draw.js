/** @typedef {import("../game-state/worldState.js").Assets} Assets */

import { drawCharacterHealthBars } from "./drawAttack.js";
import { Player } from "../game-state/player.js";
import { Rect } from "../lib/vector2d/rect.js";
import { Vector2d } from "../lib/vector2d/vector2d.js";
import { WorldState } from "../game-state/worldState.js";

//haha I am in your codes!

//TODO only draw map in viewportOrigin_w
//add mountains
//get a better person/add animation as well.
/**
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {WorldState} worldState
   * @param {string} localClientId

   */
export function draw(ctx, worldState, localClientId) {
  let tileSize = worldState.map.tileSize();

  let mapSize = worldState.map.size().mul(tileSize);
  let canvasSize = new Vector2d(ctx.canvas.width, ctx.canvas.height);
  let mapRect = new Rect(new Vector2d(0, 0), mapSize.sub(canvasSize));

  let player = worldState.players[localClientId];
  if (!player) {
    return;
  }

  // Top left corner of the viewable area, in world coordinates
  //console.log(player)
  let viewportOrigin_w = player.characterPos_w
    .sub(canvasSize.scale(0.5))
    .clamp(mapRect);

  //convert rect and vector2djs to classes.

  //make map tile class that contains tiles, speed and such (or terrain type)
  //let maptileSize = new Vector2d(map[0].length, map.length);
  /*Vector2d.fromScalar(0).eachGridPoint(maptileSize, (p) => {
            ctx.drawImage(document.getElementById(imageArray[p.mapLookup(map)]), ...p.scale(32).sub(viewportOrigin_w).arr());
        });*/

  let speed = worldState.map.getTileSpeed(player.characterPos_w, 0);
  // Draw Person
  //ctx.drawImage(playerImage, ...player.characterPos_w.sub(viewportOrigin_w).arr());

  //left arrow
  let mySpeed = speed; ///currentSpeed(player.characterPos_w, speed);
  let myVelocity = new Vector2d(0, 0);
  // if (keystate[37]) {
  //   myVelocity = myVelocity.add(new Vector2d(-1, 0));
  // }
  // //right arrow
  // if (keystate[39]) {
  //   myVelocity = myVelocity.add(new Vector2d(1, 0));
  // }
  // //up arrow
  // if (keystate[38]) {
  //   myVelocity = myVelocity.add(new Vector2d(0, -1));
  // }
  // //down arrow
  // if (keystate[40]) {
  //   myVelocity = myVelocity.add(new Vector2d(0, 1));
  // }

  const characters = worldState.characters();

  // characters.sort((a, b) => {
  //   return a.characterPos_w.y - b.characterPos_w.y;
  // });

  worldState.map.draw(ctx, viewportOrigin_w, canvasSize);

  // draw item images from state
  drawItems(ctx, worldState, viewportOrigin_w);

  for (let clientId in worldState.otherPlayersMonsters) {
    if (clientId === localClientId) {
      continue;
    }
    const otherPlayersMonsters = worldState.otherPlayersMonsters[clientId];

    for (const monster of otherPlayersMonsters) {
      const OMposition = monster.characterPos_w;
      // draw green square around position
      console.log("draw monsters: ", OMposition);
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.rect(
        ...OMposition.sub(viewportOrigin_w).arr(),
        tileSize.x,
        tileSize.y
      );
      ctx.stroke();
    }
  }

  for (const character of characters) {
    if (character instanceof Player) {
      let playerImageId = worldState.playerSet.getPlayerImageId(
        character.class,
        character.direction,
        character.step
      );
      worldState.playerSet.draw(
        playerImageId,
        ctx,
        character.characterPos_w.sub(viewportOrigin_w)
      );
    } else {
      let monsterImageId = worldState.monsterSet.getPlayerImageId(
        character.class,
        character.direction,
        character.step
      );
      worldState.monsterSet.draw(
        monsterImageId,
        ctx,
        character.characterPos_w.sub(viewportOrigin_w)
      );
      //draw monster path:
      if (character.path) {
        ctx.strokeStyle = "red";
        ctx.beginPath();
        ctx.moveTo(...character.characterPos_w.sub(viewportOrigin_w).arr());
        for (const p of character.path) {
          ctx.lineTo(...p.sub(viewportOrigin_w).arr());
        }
        ctx.stroke();
      }
      // draw cicle at character position
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.arc(
        ...character.characterPos_w.sub(viewportOrigin_w).arr(),
        5,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    }
  }

  // draw player debug path
  /*if (worldState.player.debugPath && worldState.player.debugPath.path) {
      ctx.strokeStyle = "red";
      ctx.beginPath();
      ctx.moveTo(
        ...worldState.player.characterPos_w.sub(viewportOrigin_w).arr()
      );
      for (const p of worldState.player.debugPath.path) {
        ctx.lineTo(...p.sub(viewportOrigin_w).arr());
      }
      ctx.stroke();
    }*/

  drawCharacterHealthBars(characters, viewportOrigin_w, ctx);

  // worldState.time += dt;

  // window.requestAnimationFrame(draw);
}


/**
  * 
  * @param {CanvasRenderingContext2D} ctx 
  * @param {WorldState} worldState 
  * @param {Vector2d} viewportOrigin_w 
  */
function drawItems(ctx, worldState, viewportOrigin_w) {
  for (const {pos, id} of worldState.itemsOnGround) {
    const item = worldState.items[id];
    worldState.map.drawTile(
      item.tileNumber,
      ctx,
      pos,
      viewportOrigin_w
    );
  }
}
