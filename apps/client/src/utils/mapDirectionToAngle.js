export const mapDirectionToAngle = (direction) => {
  // the return is given in radians.
  switch (direction) {
    case "n":
      return 0;
    case "ne":
      return Math.PI / 4;
    case "e":
      return Math.PI / 2;
    case "se":
      return 3 * (Math.PI / 4);
    case "s":
      return Math.PI;
    case "sw":
      return 5 * (Math.PI / 4);
    case "w":
      return 3 * (Math.PI / 2);
    case "nw":
      return 7 * (Math.PI / 4);
    default:
      // If the direction is unset we rotate the map to north
      return 0;
  }
};
