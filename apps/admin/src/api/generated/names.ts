export const generateRandomName = () => {
  const adjectives = [
    "hidden",
    "ancient",
    "vast",
    "mysterious",
    "uncharted",
    "remote",
    "scenic",
    "explored",
    "rugged",
    "legendary",
    "charted",
    "fabled",
    "enigmatic",
    "wild",
    "endless",
  ];

  const nouns = [
    "path",
    "trail",
    "route",
    "compass",
    "ridge",
    "valley",
    "summit",
    "waypoint",
    "island",
    "horizon",
    "landmark",
    "canyon",
    "terrain",
    "district",
    "region",
    "atlas",
    "globe",
    "map",
    "boundary",
    "zone",
  ];

  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${
    nouns[Math.floor(Math.random() * nouns.length)]
  }-${(Math.floor(Math.random() * 9999) + 1).toString().padStart(4, "0")}`;
};
