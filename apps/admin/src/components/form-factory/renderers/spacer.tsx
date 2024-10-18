import { ReactElement } from "react";

const renderSpacer = (): ReactElement | null => {
  // Spacers are always hidden on XS. this is handled in wrapInGrid
  return <div>&nbsp;</div>;
};

export default renderSpacer;
