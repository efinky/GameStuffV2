
/**
 * @template T
 * @param {string} url
 * @returns T
 */
export async function loadJSON(url) {
  let resp = await fetch(url);
  let json = await resp.json();
  return json;
}

/**
 * @param {string} url
 * @returns { Promise<HTMLImageElement> }
 */
export async function loadImage(url) {
  let resp = await fetch(url);
  let blob = await resp.blob();
  const imageUrl = URL.createObjectURL(blob);
  let image = new Image();
  image.src = imageUrl;
  return image;
}

/*
    function deepEq(a, b) {
      if (a === b) return true;

      if (
        typeof a !== "object" ||
        a === null ||
        typeof b !== "object" ||
        b === null
      ) {
        return false;
      }

      let keysA = Object.keys(a),
        keysB = Object.keys(b);

      if (keysA.length !== keysB.length) return false;

      for (let key of keysA) {
        if (!keysB.includes(key)) return false;

        if (typeof a[key] === "object" && typeof b[key] === "object") {
          if (!deepEq(a[key], b[key])) return false;
        } else if (a[key] !== b[key]) {
          return false;
        }
      }

      return true;
    }*/
