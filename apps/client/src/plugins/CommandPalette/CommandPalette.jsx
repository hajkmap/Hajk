import CommandPaletteView from "./CommandPaletteView";

function CommandPalette({ app }) {
  return (
    <CommandPaletteView globalObserver={app.globalObserver} appModel={app} />
  );
}

export default CommandPalette;
