import ControlButton from "components/ControlButton";

export default function PluginControlButton({
  icon,
  onClick,
  title,
  abstract,
}) {
  return (
    <ControlButton
      tooltip={`${title}: ${abstract}`}
      ariaLabel={title}
      onClick={onClick}
    >
      {icon}
    </ControlButton>
  );
}
