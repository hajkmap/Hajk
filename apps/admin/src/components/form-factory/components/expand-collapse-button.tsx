import { IconButton, Tooltip } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { t } from "i18next";

interface ExpandCollapseButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
}

const ExpandCollapseButton = ({ isExpanded, onToggle }: ExpandCollapseButtonProps) => {
  return (
    <Tooltip title={isExpanded ? t("form.collapseAll") : t("form.expandAll")}>
      <IconButton onClick={onToggle} size="small">
        {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default ExpandCollapseButton; 