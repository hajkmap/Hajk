import { Group } from "../../api/groups";
import GroupsList from "./components/groups-list";

// Filter function for all groups
const filterAllGroups = (groups: Group[]): Group[] => {
  return groups;
};

export default function GroupsPage() {
  return (
    <GroupsList
      filterGroups={filterAllGroups}
      showCreateButton={true}
      pageTitleKey="common.layerGroups"
      baseRoute="/groups"
    />
  );
}
