import React from "react";
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
        title: "Template",
        description: "Short description about the template plugin.",
        height: "dynamic",
        width: 330,
      }}
    >
      <TemplateView />
    </BaseWindowPlugin>
  );
}

export default Template;
