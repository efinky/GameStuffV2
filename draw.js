
/** @typedef {import("./worldState.js").Assets} Assets */

import { drawCharacterHealthBars } from "./drawAttack.js";
import { Player } from "./player.js";
import { Rect } from "./rect.js";
import { Vector2d } from "./vector2d.js";
import { WorldState } from "./worldState.js";

  //haha I am in your codes!

  //TODO only draw map in viewportOrigin_w
  //add mountains
  //get a better person/add animation as well.
  /**
   *
   * @param {Assets} assets
   * @param {WorldState} worldState
   * @param {string} localClientId

   */
  export function draw(assets, worldState, localClientId) {
    let canvas = document.getElementById("canvas");
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }
    let ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    let tileSize = assets.mapCurrent.tileSize();

    let mapSize = assets.mapCurrent.size().mul(tileSize);
    let canvasSize = new Vector2d(canvas.width, canvas.height);
    let mapRect = new Rect(new Vector2d(0, 0), mapSize.sub(canvasSize));

    let player = worldState.players[localClientId];

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

    let speed = assets.mapCurrent.getTileSpeed(
      player.characterPos_w,
      0
    );
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

    assets.mapCurrent.draw(ctx, viewportOrigin_w, canvasSize);

    // draw item images from state
    for (const linearCoord of Object.keys(worldState.items).map(Number)) {
      const item = worldState.items[linearCoord];
      const tileCoord = assets.mapCurrent.tileCoordFromLinearCoord(linearCoord);
      let itemImage = assets.itemImages[item.tileNumber];
      assets.mapCurrent.drawTile(
        item.tileNumber,
        ctx,
        tileCoord,
        viewportOrigin_w
      );
    }
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
        let playerImageId = assets.playerSet.getPlayerImageId(
          character.class,
          character.direction,
          character.step
        );
        assets.playerSet.draw(
          playerImageId,
          ctx,
          character.characterPos_w.sub(viewportOrigin_w)
        );
      } else {
        let monsterImageId = assets.monsterSet.getPlayerImageId(
          character.class,
          character.direction,
          character.step
        );
        assets.monsterSet.draw(
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
