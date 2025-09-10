import { Layer } from "../../api/layers";
import LayersList from "./components/layers-list";

// Filter function for searchable layers
const filterSearchableLayers = (layers: Layer[]): Layer[] => {
  return layers.filter((layer) => {
    // TODO: Implement filtering logic here for searchable layers
    return layer;
  });
};

export default function SearchLayersPage() {
  return (
    <LayersList
      filterLayers={filterSearchableLayers}
      showCreateButton={true}
      pageTitleKey="navBar.servicesAndLayers.searchLayers"
      baseRoute="/search-layers"
    />
  );
}
