// Base
import React, { useMemo } from "react";
import { styled } from "@mui/material/styles";
import { AppBar, Chip, Divider, Grid, Tabs, Tab } from "@mui/material";

// Components
import EstateSection from "./components/estates/EstateSection";
import CoordinateSection from "./components/coordinates/CoordinateSection";

// Constants
import { HUB_CONNECTION_STATUS, INTEGRATION_IDS, TABS } from "./constants";

const Root = styled("div")(() => ({
  margin: -10,
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const StyledAppBar = styled(AppBar)(() => ({
  top: -10,
}));

const TabContent = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: theme.spacing(1),
  width: "100%",
  height: "100%",
  minHeight: 300,
}));

function VisionIntegrationView(props) {
  // We're gonna want to display a chip with some information regarding the hub-connection-status.
  // Let's get the information every time the connection-status changes.
  const hubChipInformation = useMemo(() => {
    const label =
      props.hubConnectionStatus === HUB_CONNECTION_STATUS.LOADING
        ? "Upprättar koppling mot Vision"
        : props.hubConnectionStatus === HUB_CONNECTION_STATUS.SUCCESS
        ? "Uppkopplad mot Vision"
        : "Uppkoppling mot Vision misslyckad";
    const color =
      props.hubConnectionStatus === HUB_CONNECTION_STATUS.LOADING
        ? "warning"
        : props.hubConnectionStatus === HUB_CONNECTION_STATUS.SUCCESS
        ? "success"
        : "error";

    return { label, color };
  }, [props.hubConnectionStatus]);

  // Renders the section connected to the active tab
  const renderActiveSection = () => {
    switch (props.activeTab) {
      case INTEGRATION_IDS.ESTATES:
        return (
          <EstateSection
            model={props.model}
            selectedEstates={props.selectedEstates}
            source={props.model.getEstateSearchSource()}
          />
        );
      case INTEGRATION_IDS.COORDINATES:
        return (
          <CoordinateSection
            model={props.model}
            selectedEstates={props.selectedEstates}
            searchSource={props.model.getEstateSearchSource()}
          />
        );
      // TODO: Since the edit-tab is disabled ofr now, we'll just return null for now.
      case INTEGRATION_IDS.EDIT:
        return null;
      default:
        return null;
    }
  };

  return props.windowVisible ? (
    <Root>
      <Grid item container justifyContent="center">
        <StyledAppBar position="sticky" color="default">
          <Tabs variant="fullWidth" value={props.activeTab}>
            {TABS.map((tab) => {
              return (
                <Tab
                  key={tab.id}
                  value={tab.id}
                  sx={{ width: `${100 / TABS.length}%` }}
                  disabled={tab.disabled}
                  icon={tab.icon}
                  label={tab.label}
                  onClick={() => props.setActiveTab(tab.id)}
                />
              );
            })}
          </Tabs>
        </StyledAppBar>
      </Grid>
      <TabContent>
        {renderActiveSection()}
        <Grid container>
          <Grid
            container
            sx={{ marginTop: 0, marginBottom: 1 }}
            justifyContent="center"
          >
            <Divider sx={{ width: "20%" }} />
          </Grid>
          <Grid item container justifyContent="center">
            <Chip
              color={hubChipInformation.color}
              size="small"
              label={hubChipInformation.label}
            />
          </Grid>
        </Grid>
      </TabContent>
    </Root>
  ) : null;
}

export default VisionIntegrationView;
