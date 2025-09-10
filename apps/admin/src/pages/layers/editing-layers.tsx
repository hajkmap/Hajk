import { Layer } from "../../api/layers";
import LayersList from "./components/layers-list";

// Filter function for editable layers
const filterEditableLayers = (layers: Layer[]): Layer[] => {
  return layers.filter((layer) => {
    // TODO: Implement filtering logic here for editable layers
    return layer;
  });
};

export default function EditingLayersPage() {
  return (
    <LayersList
      filterLayers={filterEditableLayers}
      showCreateButton={true}
      pageTitleKey="navBar.servicesAndLayers.editingLayers"
      baseRoute="/editing-layers"
    />
  );
}
