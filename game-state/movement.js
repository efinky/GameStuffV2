import { Character } from "./character.js";
import { Monster } from "./monster.js";
import { Player } from "./player.js";
import { Vector2d } from "../lib/vector2d/vector2d.js";
import { WorldMap } from "./worldMap.js";
import { WorldState } from "./worldState.js";

/**
 * @param {Player} player
 * @param {Character[]} characters
 */
function playerPickTarget(player, characters) {
  let hitPoint = player.boundRect().center().add(player.lastVelocity.scale(32));
  let chars = [...characters];
  return chars
    .filter((c) => hitPoint.insideOf(c.boundRect()))
    .sort(
      (a, b) =>
        a.characterPos_w.distance(player.characterPos_w) -
        b.characterPos_w.distance(player.characterPos_w)
    )
    .shift();
}

/**
 * 
* @param {number} time 
* @param {Player} player 
 * @param {Character[]} characters 

 */
export function playerAttack(time, player, characters) {
  let target = playerPickTarget(player, characters);
  if (target) {
    let died = player.attack(time, target);
    if (died) {
      return target;
    }
  }
  return null;
}

/**
 * @param {number} dt
 * @param {WorldMap} map
 * @param {Character} myCharacter
 * @param {Character[]} characters
 * @return {{result: "collided", character: Character} | {result: "notWalkable"} | {result: "success", pos: Vector2d}}
 */
function moveCharacter(dt, map, myCharacter, characters) {
  const pos_w = myCharacter.characterPos_w;
  let velocity = myCharacter.velocity();
  const speedMultiplier = myCharacter.speedMultiplier;

  let speed = map.getTileSpeed(pos_w, 0);
  velocity = velocity.scale(speed * speedMultiplier * dt);
  //console.log("velocity, ", velocity);
  if (myCharacter instanceof Monster) {
    for (let character of characters) {
      if (myCharacter === character) {
        continue;
      }
    }
  }

  //   let newcharacterPos_w = pos_w.add(velocity.mul(map.tileSize()));

  let possiblePositions = [
    pos_w.add(velocity.mul(map.tileSize())),
    // TODO this keeps monsters from not getting stuck, but it also
    // prevents them from attacking the player properly
    // To fix this we need to have a target position as well as a velocity
    // pos_w.add(
    //   new Vector2d(velocity.magnitude() * Math.sign(velocity.x), 0).mul(
    //     map.tileSize()
    //   )
    // ),
    // pos_w.add(
    //   new Vector2d(0, velocity.magnitude() * Math.sign(velocity.y)).mul(
    //     map.tileSize()
    //   )
    // ),
  ].filter((p) => map.getTileSpeed(p, 0));

  if (possiblePositions.length == 0) {
    return { result: "notWalkable" };
  }

  let collidedCharacter = null;
  let asdf = possiblePositions
    .filter((p) => {
      for (let character of characters) {
        if (myCharacter === character) {
          continue;
        }
        if (character.collidesWith(p)) {
          collidedCharacter = character;
          return false;
        }
      }
      return true;
    })
    .shift();

  if (!asdf && collidedCharacter) {
    return { result: "collided", character: collidedCharacter };
  }

  let newcharacterPos_w = asdf;

  //the closer we get the slower we move
  //speed is only impacted when moving towards the other characters.  there is no hinderance to move away
  //when not walking get pushed back

  return { result: "success", pos: newcharacterPos_w };
}

/**
 *
 * @param {number} dt
 * @param {number} time
 * @param {Monster[]} monsters
 * @param {{ [key: string]: Player }} players
 * @param {Character[]} characters
 * @param {WorldMap} map
 * @param {WorldState} worldState
 */
export function moveMonsters(dt, time, monsters, players, characters, map, worldState) {
  for (const monster of monsters) {
    const nearbyMonsters = monsters
      .filter((m) => m.characterPos_w.distance(monster.characterPos_w) < 32 * 3)
      .map((m) => m.characterPos_w);

    monster.ifStuck();
    for (let key in players) {
      let player = players[key];

      //if monster is 1 and a half tiles away from character
      if (monster.characterPos_w.distance(player.characterPos_w) < 30) {
        monster.path = [player.characterPos_w];
        let nextPos = monster.path[0];
        monster.myVelocity = monster.characterPos_w.directionTo(nextPos);
        // monster.myVelocity.clipTo(monster.characterPos_w.distance(nextPos)*dt/32.0)
        if (monster.characterPos_w.distance(nextPos) <= 1.0) {
          monster.path.shift();
        }
        if (monster.characterPos_w.distance(player.characterPos_w) < 20) {
          // ATTACK!
          let died = monster.attack(time, player);
          if (died) console.log("DEAD!");
        }
      } else if (monster.characterPos_w.distance(player.characterPos_w) < 300) {
        if (time > monster.pathTimer) {
          //   if (
          //     monster.path.length > 0 &&
          //     monster.path[monster.path.length - 1].distance(player.characterPos_w) >
          //       36.0
          //   ) {
          let targets = map.visitableNeighbors(
            player.characterPos_w,
            0,
            nearbyMonsters
          );
          if (targets.length > 0) {
            let target = worldState.rng.choose(targets);
            monster.path = map.findPath(
              monster.characterPos_w,
              target,
              0,
              nearbyMonsters
            );
          }
          monster.pathTimer = time + 0.1;
          // console.log("PATH: ", monster.path);
          // console.log("Distance", monster.path[monster.path.length -1].distance(player.characterPos_w));
        }

        if (monster.path.length == 0) {
          monster.path = map.findPath(
            monster.characterPos_w,
            player.characterPos_w,
            0,
            nearbyMonsters
          );
        }

        //monster.myVelocity = monster.characterPos_w.directionTo(player.characterPos_w);
        if (monster.path.length > 0) {
          let nextPos = monster.path[0];
          //nextPos.add(new Vector2d(16,16));
          monster.myVelocity = monster.characterPos_w.directionTo(nextPos);
          // monster.myVelocity.clipTo(monster.characterPos_w.distance(nextPos)*dt/32.0)
          if (monster.characterPos_w.distance(nextPos) <= 1.0) {
            monster.path.shift();
          }
        }
      } else {
        if (
          monster.characterPos_w.distance(monster.goalPosition) < 10.0 ||
          monster.path.length == 0
        ) {
          monster.goalPosition = monster.findRandomGoal(monster.characterPos_w, worldState.rng);
          monster.path = map.findPath(
            monster.characterPos_w,
            monster.goalPosition,
            0,
            nearbyMonsters
          );
        }
        if (monster.path.length > 0) {
          let nextPos = monster.path[0];
          monster.myVelocity = monster.characterPos_w.directionTo(nextPos);
          monster.myVelocity.clipTo(monster.characterPos_w.distance(nextPos));
          if (monster.characterPos_w.distance(nextPos) < 10.0) {
            monster.path.shift();
          }
        }
      }
    } //);
    // monster.timeToMove(player.characterPos_w);
    const moveResult = moveCharacter(dt, map, monster, characters);
    //console.log(moveResult);
    if (moveResult.result === "success") {
      monster.updatePosition(moveResult.pos);
    } else if (moveResult.result === "collided") {
      if (moveResult.character instanceof Player) {
        // ATTACK!
        let died = monster.attack(time, moveResult.character);
        if (died) console.log("DEAD!");
      }
    }
  }
}

/**
 *
 * @param {number} dt
 * @param {{ [key: string]: Player }} players
 * @param {Character[]} characters
 * @param {WorldMap} map
 */
export function movePlayer(dt, players, characters, map) {
  for (let player of Object.values(players)) {
    let myVelocity = Vector2d.zero();
    if (player.moveTarget) {
      // console.log("moveTarget", player.moveTarget);
      // console.log("move Direction", player.moveTarget.sub(player.characterPos_w));
      myVelocity = player.characterPos_w.directionTo(player.moveTarget); //player.moveTarget.sub(player.characterPos_w).normalize();

    }

    player.updateDirection(myVelocity);
    // if (player.velocity().magnitude() != 0.0) {
    const moveResult = moveCharacter(dt, map, player, characters);
    if (moveResult.result === "success") {
      player.updatePosition(moveResult.pos);
    }
    // }

    if (
      player.debugPath &&
      (player.debugPath.from.distance(player.characterPos_w) > 4.0 ||
        player.debugPath.path == null)
    ) {
      player.debugPath.from = player.characterPos_w;
      player.debugPath.path = map.findPath(
        player.characterPos_w,
        player.debugPath.to,
        0
      );
    }
  }
}
