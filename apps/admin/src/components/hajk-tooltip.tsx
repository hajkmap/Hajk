import Tooltip from "@mui/material/Tooltip";
import { ReactElement } from "react";

interface Props {
  title?: string;
  children?: ReactElement;
  [key: string]: unknown; // To allow any additional props
}

const HajkTooltip = ({ title, children, ...rest }: Props) => {
  return (
    <Tooltip
      enterDelay={500}
      leaveDelay={50}
      disableInteractive={true}
      title={title ? title : ""}
      {...rest}
    >
      {children ?? <></>}
    </Tooltip>
  );
};

export default HajkTooltip;
