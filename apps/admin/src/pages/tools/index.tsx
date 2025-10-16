import { Tool } from "../../api/tools";
import ToolsList from "./components/tools-list";

// Filter function for all tools
const filterAllTools = (tools: Tool[]): Tool[] => {
  return tools;
};

export default function ToolsPage() {
  return (
    <ToolsList
      filterTools={filterAllTools}
      pageTitleKey="common.tools"
      baseRoute="/tools"
    />
  );
}
