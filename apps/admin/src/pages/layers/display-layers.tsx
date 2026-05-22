import LayersList from "./components/layers-list";

export default function DisplayLayersPage() {
  return (
    <LayersList
      layerKind="display"
      showCreateButton={true}
      pageTitleKey="navBar.servicesAndLayers.displayLayers"
      baseRoute="/display-layers"
    />
  );
}
