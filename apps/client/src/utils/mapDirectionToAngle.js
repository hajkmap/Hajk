export const mapDirectionToAngle = (direction) => {
  if (!direction) {
    return null;
  }

  switch (direction) {
    case "n":
      return 0;
    case "ne":
      return Math.PI / 8;
    case "e":
      return Math.PI / 4;
    case "se":
      return 3 * (Math.PI / 8);
    case "s":
      return Math.PI / 2;
    case "sw":
      return 5 * (Math.PI / 8);
    case "w":
      return 3 * (Math.PI / 4);
    case "nw":
      return 7 * (Math.PI / 8);
    default:
      return 0;
  }
};
