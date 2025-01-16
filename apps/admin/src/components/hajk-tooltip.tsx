import Tooltip from "@mui/material/Tooltip";
import { ReactElement, ReactNode } from "react";

interface Props {
  title?: ReactNode; // Allow both string and Elements
  children?: ReactElement;
  [key: string]: unknown; // To allow any additional props
}

const HajkTooltip = ({ title, children, ...rest }: Props) => {
  return (
    <Tooltip
      enterDelay={500}
      leaveDelay={50}
      disableInteractive={true}
      title={title}
      {...rest}
    >
      {children ?? <></>}
    </Tooltip>
  );
};

export default HajkTooltip;
