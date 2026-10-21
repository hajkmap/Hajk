import DialogWindowPlugin from "../DialogWindowPlugin";
import DefaultIcon from "@mui/icons-material/InfoTwoTone";
import i18n from "src/i18n";

const InfoDialog = (props) => {
  // Make it possible to serve multiple Dialogs in one plugin
  let opts = null;
  if (!Array.isArray(props.options)) {
    opts = [props.options];
  } else {
    opts = props.options;
  }

  // Render an instance of DialogWindowPlugin for each instance provided
  return opts.map((instanceOptions, i) => (
    <DialogWindowPlugin
      key={i}
      options={instanceOptions} // Supply the unique instance's options…
      map={props.map} // …but the shared map…
      app={props.app} // …and app.
      type="InfoDialog" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name.
      defaults={{
        // Some defaults to fall back to in case instanceOptions doesn't provide them.
        icon: <DefaultIcon />, // Default icon for this plugin
        // Admin texts are content, so they're used as-is in every language.
        title: i18n.t("infoDialog.title"),
        description: i18n.t("infoDialog.description"), // Shown on Widget button as well as Tooltip for Control button
      }}
    />
  ));
};

export default InfoDialog;
