import BaseWindowPlugin from "../BaseWindowPlugin";
import CommandPaletteView from "./CommandPaletteView";

function CommandPalette(props) {
  return (
    <BaseWindowPlugin
      {...props}
      type="CommandPalette"
      custom={{
        title: "Command Palette",
        description: "Sök och starta verktyg",
        render: () => (
          <CommandPaletteView
            globalObserver={props.app.globalObserver}
            appModel={props.app}
          />
        ),
      }}
    />
  );
}

export default CommandPalette;
