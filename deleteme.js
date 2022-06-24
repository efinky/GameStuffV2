const foo = {
  wangsets: [
    {
      colors: [
        {
          color: "#ff0000",
          name: "",
          probability: 1,
          properties: [
            {
              name: "SpeedTileSet",
              type: "int",
              value: 5,
            },
          ],
          tile: 112,
        },
      ],
      name: "TerrainSet",
      tile: 113,
      type: "corner",
      wangtiles: [
        {
          tileid: 1,
          wangid: [0, 1, 0, 1, 0, 7, 0, 7],
        },
        {
          tileid: 2,
          wangid: [0, 7, 0, 1, 0, 1, 0, 7],
        },
      ],
    },
  ],
};

let result = {
  colors: [
      { SpeedTileSet: 5 },
  ],
  wangtiles: [
    {
      tileid: 1,
      wangid: [0, 1, 0, 1, 0, 7, 0, 7],
    },
    {
      tileid: 2,
      wangid: [0, 7, 0, 1, 0, 1, 0, 7],
    },
  ],
};


// function to convert from foo to result
function convertWangSets() {
  let wangset = foo.wangsets.find((s) => s.name === "TerrainSet");
  if (wangset === undefined) {
    return undefined;
  }
  let result = {
    colors: wangset.colors.map((color) => {
      let speed = color.properties.find((p) => p.name === "SpeedTileSet")?.value;
      return { SpeedTileSet: speed }
    }),
    wangtiles: wangset.wangtiles,
  }
  return result
}
