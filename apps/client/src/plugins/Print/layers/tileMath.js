/**
 * WMS tile math: splitting large WMS GetMap requests into a grid of smaller
 * tile requests that comply with the server's maximum size, and computing
 * each tile's bounding box (for WMS versions 1.1.1 and 1.3.0).
 *
 * All functions are pure; state such as maxTileSize is passed explicitly.
 */

/**
 * Returns an array of floats representing the bounding box found
 * in the 'BBOX' query-parameter in the supplied url.
 */
export const getBoundingBoxFromUrl = (url) => {
  return url.searchParams
    .get("BBOX")
    .split(",")
    .map((coord) => parseFloat(coord));
};

/**
 * Loads an image (tile) and draws it on the supplied canvas-context.
 */
export const loadImageTile = (canvas, tileOptions) => {
  // We have to get the context so that we can draw the image
  const ctx = canvas.getContext("2d");
  // Then we need some tile-information
  const { url, x, y, tileWidth, tileHeight } = tileOptions;
  // Let's return a promise...
  return new Promise((resolve, reject) => {
    // Let's create an image-element
    const tile = document.createElement("img");
    tile.onload = () => {
      // When the tile has loaded, we can draw the tile on the canvas.
      ctx.drawImage(tile, x, y, tileWidth, tileHeight);
      // The promise can be resolved when the tile has been fetched and
      // drawn on the canvas.
      resolve();
    };
    // If the fetch fails, we have to reject the promise.
    tile.onerror = () => {
      reject();
    };
    // Let's set the cross-origin-attribute to prevent cors-problems
    tile.crossOrigin = "anonymous";
    // Then we'll set the url so that the image can be fetched.
    tile.src = url;
  });
};

/**
 * Creates tile-information-objects for a column (all tiles needed to fill
 * up to the target-height).
 */
export const getTileColumn = (
  targetHeight,
  x,
  tileWidth,
  maxTileSize,
  tiles = []
) => {
  // We'll iterate (and push tiles to the tile-array) until...
  while (true) {
    // ... we've reached the target-height. Let's summarize all tile-height
    // so that we can check if we're done.
    const accHeight = tiles.reduce((acc, curr) => acc + curr.tileHeight, 0);
    // If we are, we can return the array of tile-information
    if (accHeight >= targetHeight) return tiles;
    // Otherwise we'll calculate how many pixels are left...
    const remainingHeight = targetHeight - accHeight;
    // And either create a tile with that height (or the max-height if the remainder is too large).
    const tileHeight =
      remainingHeight > maxTileSize ? maxTileSize : remainingHeight;
    // Then we have to calculate where the tile is to be placed on the canvas later.
    const y = targetHeight - accHeight - tileHeight;
    // And finally we'll push the information to the array.
    tiles.push({
      x,
      y,
      tileWidth,
      tileHeight,
    });
  }
};

/**
 * Returns a string representing the bounding-box for the supplied tile.
 * (WMS-version 1.3.0)
 * If the WMS-version is set to 1.3.0 the axis-orientation should be set by the
 * definition of the projection. However, in 'ConfigMapper.js' we specify the
 * axis-direction as 'NEU' (northing, easting, up). This means we can assume
 * that the axis-direction is 'NEU' when dealing with version 1.3.0.
 */
export const getVersionThreeBoundingBox = (tile, bBox, height, width) => {
  // We have to know how much the northing and easting change per pixel, so that we
  // can calculate proper bounding-boxes for the new tiles.
  const northingChangePerPixel = (bBox[2] - bBox[0]) / height;
  const eastingChangePerPixel = (bBox[3] - bBox[1]) / width;
  // Then we can construct the bounding-box-string:
  // The bounding-box is calculated by combining how much the bounding-box
  // changes per pixel, along with the supplied tile height, width, and position
  // (presented as pixel-values). For information regarding x, and y, see:
  // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage
  return `${
    bBox[0] + northingChangePerPixel * (height - tile.y - tile.tileHeight)
  },${bBox[1] + eastingChangePerPixel * tile.x},${
    bBox[0] + northingChangePerPixel * (height - tile.y)
  }, ${bBox[1] + eastingChangePerPixel * (tile.x + tile.tileWidth)}`;
};

/**
 * Returns a string representing the bounding-box for the supplied tile.
 * (WMS-version 1.1.1)
 * In version 1.1.1 the axis orientation is always 'ENU' (easting-northing-up).
 */
export const getVersionOneBoundingBox = (tile, bBox, height, width) => {
  // We have to know how much the northing and easting change per pixel, so that we
  // can calculate proper bounding-boxes for the new tiles.
  const northingChangePerPixel = (bBox[3] - bBox[1]) / height;
  const eastingChangePerPixel = (bBox[2] - bBox[0]) / width;
  // Then we can construct the bounding-box-string:
  return `${bBox[0] + eastingChangePerPixel * tile.x},${
    bBox[1] + northingChangePerPixel * (height - tile.y - tile.tileHeight)
  },${bBox[0] + eastingChangePerPixel * (tile.x + tile.tileWidth)},${
    bBox[1] + northingChangePerPixel * (height - tile.y)
  }`;
};

/**
 * Appends a bounding-box to each tile-information-object.
 * The bounding-box calculations might seem a bit messy... One reason for that
 * is that the x- and y-values for the tiles are set to match how images are added
 * to a canvas, and those coordinates go the opposite direction compared to the map-coordinate-axels.
 * See: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage for more info.
 */
export const appendBoundingBox = (tiles, bBox, height, width, wmsVersion) => {
  for (const tile of tiles) {
    // We have to make sure to check if we're dealing with version 1.3.0 or 1.1.1
    // so that we can handle the axis-orientation properly.
    if (wmsVersion === "1.3.0") {
      tile.bBox = getVersionThreeBoundingBox(tile, bBox, height, width);
    } else {
      // If we're not dealing with version 1.3.0, we're probably dealing with 1.1.1
      tile.bBox = getVersionOneBoundingBox(tile, bBox, height, width);
    }
  }
};

/**
 * Returns an array of objects containing information regarding the tiles
 * that should be created to comply with the supplied 'maxTileSize' and
 * also 'fill' the image.
 *
 * @param {number} height Full requested image height in pixels.
 * @param {number} width Full requested image width in pixels.
 * @param {URL} url The original request URL (provides BBOX and VERSION).
 * @param {number} maxTileSize Maximum allowed tile width/height in pixels.
 * @returns {Array} Tile descriptors including their bounding boxes.
 */
export const getTileInformation = (height, width, url, maxTileSize) => {
  // We're gonna want to return an array containing the tile-objects
  const tiles = [];
  // We're also gonna need to keep track of the original bounding box. This bounding-box
  // will be used to calculate the new bounding-boxes for each tile that we're about to create.
  const bBox = getBoundingBoxFromUrl(url);
  // Since the northing and easting axels are flipped in version 1.1.0 vs 1.3.0 we
  // have to make sure to check which WMS-version we are dealing with.
  const wmsVersion = url.searchParams.get("VERSION");
  // To gather all the required tile-information we will work with 'columns'. This means
  // we will create all necessary images at a fixed width, and then move to the next width.
  // We'll do this until we've created enough columns to fill the entire width.
  let accWidth = 0;
  while (true) {
    // If we've created enough columns to fill the supplied width, we can break.
    if (accWidth >= width) break;
    // Otherwise we'll check how many pixels remain until we do...
    const remainingWidth = width - accWidth;
    // We'll use a tile-width that is either:
    // - The remaining amount of pixels
    // - The max tile-size
    const tileWidth =
      remainingWidth > maxTileSize ? maxTileSize : remainingWidth;
    // Then we'll create a column of tiles
    tiles.push(...getTileColumn(height, accWidth, tileWidth, maxTileSize));
    // And bump the current width
    accWidth += tileWidth;
  }
  // When the tile-information is created, we can append the bounding-box-information
  // to each tile. The bounding-box-information will be used to fetch the tiles later.
  appendBoundingBox(tiles, bBox, height, width, wmsVersion);
  // Finally we can return the tile-information.
  return tiles;
};
