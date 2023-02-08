import { Character } from "./character.js";
import { Monster } from "./monster.js";
import { Player } from "./player.js";
import { Vector2d } from "./vector2d.js";
import { Map } from "./map.js";


/**
* @param {Player} player 
 * @param {Character[]} characters
 */
function playerPickTarget(player, characters) {
    let hitPoint = player.boundRect().center().add(player.lastVelocity.scale(32));
    let chars = [...characters];
    return chars.filter((c) =>
        hitPoint.insideOf(c.boundRect())
    ).sort((a, b) => a.characterPos_w.distance(player.characterPos_w) - b.characterPos_w.distance(player.characterPos_w)).shift()
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
        let died = player.attack(time, target)
        if (died) {
            return target;
        }
    }
    return null;
}






/**
* @param {number} dt
* @param {Map} map
* @param {Character} myCharacter
* @param {Character[]} characters
* @return {{result: "collided", character: Character} | {result: "notWalkable"} | {result: "success", pos: Vector2d}}
*/
function moveCharacter(dt, map, myCharacter, characters) {
    const pos_w = myCharacter.characterPos_w;
    let velocity = myCharacter.velocity();
    const speedMultiplier = myCharacter.speedMultiplier;

    let speed = map.getTileSpeed(pos_w, 0);
    velocity = velocity.scale(speed * speedMultiplier * dt)

    if (myCharacter instanceof Monster) {
        for (let character of characters) {
            if (myCharacter === character) {
                continue;
            }

            if (character instanceof Monster) {
                let otherCenter = character.boundRect().center();
                let ourCenter = myCharacter.boundRect().center();
                let distance = ourCenter.distance(otherCenter);
                if (distance < 64) {
                    let forceDir = ourCenter.sub(otherCenter).normalize();
                    let force = 15.0 / (distance * distance);
                    let forceVec = forceDir.scale(force * dt).mul(map.tileSize());
                    velocity = velocity.add(forceVec);
                }
            }
        }
    }

    let newcharacterPos_w = pos_w.add(velocity.mul(map.tileSize()));

    for (let character of characters) {
        if (myCharacter === character) {
            continue;
        }
        if (character.collidesWith(newcharacterPos_w)) {
            return { result: "collided", character };
        }
    }


    //the closer we get the slower we move
    //speed is only impacted when moving towards the other characters.  there is no hinderance to move away
    //when not walking get pushed back 

    if (!map.getTileSpeed(newcharacterPos_w, 0)) {
        return { result: "notWalkable" };
    }
    return { result: "success", pos: newcharacterPos_w };
}

/**
 * 
 * @param {number} dt 
 * @param {number} time
 * @param {Monster[]} monsters 
 * @param {Player} player 
 * @param {Character[]} characters
 * @param {Map} map 
 */
export function moveMonsters(dt, time, monsters, player, characters, map) {
    for (const monster of monsters) {
        monster.timeToMove(player.characterPos_w);
        const moveResult = moveCharacter(dt, map, monster, characters);
        //console.log(moveResult);
        if (moveResult.result === "success") {
            monster.updatePosition(moveResult.pos)
        } else if (moveResult.result === "collided") {
            if (moveResult.character instanceof Player) {
                // ATTACK!
                let died = monster.attack(time, moveResult.character);
                if (died)
                    console.log("DEAD!");
                
            }
        }
    }
}

/**
 * 
 * @param {number} dt 
 * @param {Player} player 
 * @param {Vector2d} myVelocity 
 * @param {Character[]} characters
 * @param {Map} map 
 */
export function movePlayer(dt, player, myVelocity, characters, map) {
    player.updateDirection(myVelocity);
    // if (player.velocity().magnitude() != 0.0) {
        const moveResult = moveCharacter(dt, map, player, characters);
        if (moveResult.result === "success") {
            player.updatePosition(moveResult.pos)
        }
    // }
}

