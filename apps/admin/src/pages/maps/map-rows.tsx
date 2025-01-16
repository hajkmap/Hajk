interface MapItem {
  id: string;
  options: {
    description: string;
    name: string;
    mapId: string;
  };
}

export default function mapMapRows(data: MapItem[]) {
  return data.map((map) => ({
    id: map,
    description: map,
    name: map,
    mapId: map,
  }));
}
