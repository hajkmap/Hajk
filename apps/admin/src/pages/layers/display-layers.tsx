import { Layer } from "../../api/layers";
import LayersList from "./components/layers-list";

// Filter function for display layers
const filterDisplayLayers = (layers: Layer[]): Layer[] => {
  return layers.filter((layer) => {
    // TODO: Implement filtering logic here for display layers
    return layer;
  });
};

export default function DisplayLayersPage() {
  return (
    <LayersList
      filterLayers={filterDisplayLayers}
      showCreateButton={true}
      pageTitleKey="navBar.servicesAndLayers.displayLayers"
      baseRoute="/display-layers"
    />
  );
}
