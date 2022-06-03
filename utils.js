
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
