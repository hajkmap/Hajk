import { Map } from "../../api/maps";
import MapsList from "./components/maps-list";

// Filter function for all maps
const filterAllMaps = (maps: Map[]): Map[] => {
  return maps;
};

export default function MapsPage() {
  return (
    <MapsList
      filterMaps={filterAllMaps}
      showCreateButton={true}
      pageTitleKey="common.maps"
      baseRoute="/maps"
    />
  );
}
