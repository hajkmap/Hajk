import LayersList from "./components/layers-list";

export default function EditingLayersPage() {
  return (
    <LayersList
      layerKind="editing"
      showCreateButton={true}
      pageTitleKey="navBar.servicesAndLayers.editingLayers"
      baseRoute="/editing-layers"
    />
  );
}
