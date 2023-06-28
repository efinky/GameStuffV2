import { Identity } from "./identity.js";
import { assert, assertEq, describe, it } from "../../test/test-helpers.js";

describe("Identity Tests", function () {
  it("Can verify challenge", async function () {
    const id = await Identity.generate();

    const publicId = await id.publicId();
    // Can I just sign my own public key? (nope)

    const { challenge, verify } = publicId.challenge();

    const { signature } = await id.signChallenge(challenge);

    const valid = await verify(signature);
    assert(valid, "Expected signature to be valid");
  });
});
