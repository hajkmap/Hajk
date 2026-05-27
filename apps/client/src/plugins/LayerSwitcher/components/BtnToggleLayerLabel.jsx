import LabelOutlinedIcon from "@mui/icons-material/LabelImportantOutlined";
import LabelIcon from "@mui/icons-material/LabelImportant";
import LsIconButton from "./LsIconButton";
import HajkToolTip from "components/HajkToolTip";

function BtnToggleLayerLabel({ active, onClick }) {
  const iconSx = (theme) => ({
    width: "0.7em",
    height: "0.7em",
    marginTop: "1px",
    color: theme.palette.grey[500],
  });

  return (
    <LsIconButton
      size="small"
      sx={(theme) => ({
        marginTop: "3px",
        "&:hover .ls-details-icon": {
          color: theme.palette.grey[900],
          ...theme.applyStyles("dark", {
            color: "#fff",
          }),
        },
      })}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
    >
      <HajkToolTip title={active ? "Dölj etiketter" : "Visa etiketter"}>
        {active ? (
          <LabelIcon className="ls-details-icon" sx={iconSx} />
        ) : (
          <LabelOutlinedIcon className="ls-details-icon" sx={iconSx} />
        )}
      </HajkToolTip>
    </LsIconButton>
  );
}

export default BtnToggleLayerLabel;
