import { Identity } from "../lib/networking/identity.js";
import { NetworkedGame } from "../lib/networking/networked-game.js";
//import { loadAudioAssets } from "../tank/assets.js";
import { WorldState } from "../game-state/worldState.js";
import { transitionError, transitionPlaying } from "./ui-state.js";

let initialWorldState = {
    map: "BasicMap.json",
    monsterSet: "Monsters.json",
    playerSet: "Player.json",
}

export async function singlePlayerGame() {
  const gameState = await WorldState.init(initialWorldState);

  try {
    const { networkedGame } = await NetworkedGame.singlePlayerGame(gameState);

    return transitionPlaying("", networkedGame, gameState);
  } catch (err) {
    console.error(err);
    return transitionError(`Error starting host: ${err}`);
  }
}

export async function hostGame() {
  const gameState = await WorldState.init(initialWorldState);

  try {
    const { networkedGame, token } = await NetworkedGame.hostGame(gameState);

    return transitionPlaying(token, networkedGame, gameState);
  } catch (err) {
    console.error(err);
    return transitionError(`Error starting host: ${err}`);
  }
}

/** @param {string} joinToken */
export async function joinGame(joinToken) {
  // We need to do this ahead of time so that the audio is allowed by the browser.
  // Safari is especially strict about not allowing audio to play unless it is
  // initiated by a user action. Pre-loading audio assets seems to be enough to
  // satisfy it.
  // loadAudioAssets();

  try {

    // If we have an existing identity, use it. This allows us to leave and rejoin
    // the game as the same player (in this case keeping our score)
    let existingIdentity = undefined;
    const storedIdentity = localStorage.getItem("identity");
    if (storedIdentity) {
      try {
        existingIdentity = await Identity.import(JSON.parse(storedIdentity));
      } catch (err) {
        console.error("Error using existing identity:", err);
        localStorage.removeItem("identity");
      }
    }

    // If identity was undefined we'll get a new one back
    const { networkedGame, identity, gameState } = await NetworkedGame.joinGame(
      joinToken,
      WorldState.deserialize,
      existingIdentity
    );
    // Save the identity so we can use it next time
    localStorage.setItem("identity", JSON.stringify(await identity.export()));

    return transitionPlaying(joinToken, networkedGame, gameState);
  } catch (err) {
    console.error(err);
    return transitionError(`Error joining game: ${err}`);
  }
}
