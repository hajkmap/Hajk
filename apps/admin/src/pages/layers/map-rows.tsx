interface LayerItem {
  id: string;
  options: {
    content: string;
    caption: string;
    infoUrl: string;
    opacity: string;
    isBroken: boolean;
  };
}

export default function mapLayerRows(data: LayerItem[]) {
  return data.map((layer) => ({
    id: layer.id,
    serviceType: layer.options.content,
    name: layer.options.caption,
    url: layer.options.infoUrl,
    usedBy: layer.options.opacity,
    isBroken: layer.options.isBroken,
    actions: "",
  }));
}
