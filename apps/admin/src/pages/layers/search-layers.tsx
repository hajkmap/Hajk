import LayersList from "./components/layers-list";

export default function SearchLayersPage() {
  return (
    <LayersList
      layerKind="search"
      showCreateButton={true}
      pageTitleKey="navBar.servicesAndLayers.searchLayers"
      baseRoute="/search-layers"
    />
  );
}
