import DialogWindowPlugin from "../DialogWindowPlugin";
import DefaultIcon from "@mui/icons-material/InfoTwoTone";
import i18n, { configText } from "src/i18n";

// Admin-entered texts that can be translated per dialog.
const TRANSLATABLE_FIELDS = [
  "title",
  "description",
  "headerText",
  "text",
  "buttonText",
  "abortText",
];

// Each dialog's texts can be translated under "infoDialog.dialogs.<name>.<field>",
// using the dialog's name from the map config. Like other admin texts, the
// admin value is assumed to be Swedish, see configText().
const translateInstance = (options) => {
  if (!options.name) return options;
  const translated = { ...options };
  for (const field of TRANSLATABLE_FIELDS) {
    const value = configText(
      `infoDialog.dialogs.${options.name}.${field}`,
      options[field]
    );
    if (value !== undefined) translated[field] = value;
  }
  return translated;
};

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
      options={translateInstance(instanceOptions)} // Supply the unique instance's options…
      map={props.map} // …but the shared map…
      app={props.app} // …and app.
      type="InfoDialog" // Unique name - each plugin needs one. Upper-case first letter, must be valid JS variable name.
      defaults={{
        // Some defaults to fall back to in case instanceOptions doesn't provide them.
        icon: <DefaultIcon />, // Default icon for this plugin
        title: i18n.t("infoDialog.title"),
        description: i18n.t("infoDialog.description"), // Shown on Widget button as well as Tooltip for Control button
      }}
    />
  ));
};

export default InfoDialog;
