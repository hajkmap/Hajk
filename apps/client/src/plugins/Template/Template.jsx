import AddIcon from "@mui/icons-material/Add";

import BaseWindowPlugin from "../BaseWindowPlugin";

import TemplateView from "./TemplateView";

function Template(props) {
  return (
    <BaseWindowPlugin
      {...props}
      type="Template"
      custom={{
        icon: <AddIcon />,
        // Title and description: "template.title" and "template.description"
        // in ./i18n/<lng>.json (rename the "template" key with the plugin).
        height: "dynamic",
        width: 330,
      }}
    >
      <TemplateView />
    </BaseWindowPlugin>
  );
}

export default Template;
