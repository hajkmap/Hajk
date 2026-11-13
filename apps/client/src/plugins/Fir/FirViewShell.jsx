import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import withSnackbar from "components/WithSnackbar";

const ViewContainer = styled("div")(({ _theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const StickyAppBar = styled(AppBar)(({ _theme }) => ({
  top: 0,
}));

const TabPanel = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(1),
  width: "100%",
  height: "100%",
}));

function FirViewShell({
  tabs,
  localObserver,
  windowVisible,
  searchErrorEvent,
  enqueueSnackbar,
  closeSnackbar,
}) {
  const [activeTab, setActiveTab] = useState(0);
  const snackBarRef = useRef(null);
  const fnsRef = useRef({});

  const hiddenStyle = {
    visibility: "hidden",
    height: 0,
    overflow: "hidden",
    padding: 0,
  };

  fnsRef.current = {
    handleSearchError: (err) => {
      closeSnackbar(snackBarRef.current);
      snackBarRef.current = enqueueSnackbar(
        `Ett fel inträffade vid sökningen.\n ${err.name}: ${err.message}`,
        {
          variant: "error",
          style: { whiteSpace: "pre-line" },
        }
      );
    },
  };

  useEffect(() => {
    if (!searchErrorEvent) {
      return;
    }
    localObserver.subscribe(searchErrorEvent, (err) => {
      fnsRef.current.handleSearchError(err);
    });
  }, [localObserver, fnsRef, searchErrorEvent]);

  const handleChangeTabs = (event, activeTab) => {
    setActiveTab(activeTab);
  };

  const handleTabsMounted = (ref) => {
    setTimeout(() => {
      ref !== null && ref.updateIndicator();
    }, 1);
  };

  return (
    <ViewContainer>
      <StickyAppBar position="sticky" color="default">
        <Tabs
          action={handleTabsMounted}
          onChange={handleChangeTabs}
          // make sure the window is visible, otherwise an error will be thrown.
          value={windowVisible ? activeTab : false}
          variant="fullWidth"
        >
          {tabs.map((tab, index) => (
            <Tab key={`tab-${index}`} label={tab.label} />
          ))}
        </Tabs>
      </StickyAppBar>
      {tabs.map((tab, index) => (
        <TabPanel
          key={`tabpanel-${index}`}
          style={activeTab !== index ? hiddenStyle : {}}
        >
          {tab.content}
        </TabPanel>
      ))}
    </ViewContainer>
  );
}

FirViewShell.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
  localObserver: PropTypes.object,
  windowVisible: PropTypes.bool,
  searchErrorEvent: PropTypes.string,
};

export default withSnackbar(FirViewShell);
