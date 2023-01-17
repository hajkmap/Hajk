// Base
import React, { useMemo } from "react";
import { styled } from "@mui/material/styles";
import { AppBar, Chip, Divider, Grid, Tabs, Tab } from "@mui/material";

// Components
import EstateSection from "./components/estates/EstateSection";
import CoordinateSection from "./components/coordinates/CoordinateSection";
import EnvironmentSection from "./components/environment/EnvironmentSection";

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
            app={props.app}
            model={props.model}
            mapViewModel={props.mapViewModel}
            selectedEstates={props.selectedEstates}
            setSelectedEstates={props.setSelectedEstates}
            source={props.model.getEstateSearchSource()}
            activeMapInteraction={props.activeMapInteraction}
            setActiveMapInteraction={props.setActiveMapInteraction}
          />
        );
      case INTEGRATION_IDS.COORDINATES:
        return (
          <CoordinateSection
            app={props.app}
            model={props.model}
            localObserver={props.localObserver}
            mapViewModel={props.mapViewModel}
            selectedCoordinates={props.selectedCoordinates}
            setSelectedCoordinates={props.setSelectedCoordinates}
            source={props.model.getCoordinateSearchSource()}
            activeMapInteraction={props.activeMapInteraction}
            setActiveMapInteraction={props.setActiveMapInteraction}
          />
        );
      case INTEGRATION_IDS.ENVIRONMENT:
        return (
          <EnvironmentSection
            activeType={props.activeEnvironmentType}
            setActiveType={props.setActiveEnvironmentType}
            environmentState={props.environmentState}
            setEnvironmentState={props.setEnvironmentState}
            app={props.app}
            model={props.model}
            source={null}
            mapViewModel={props.mapViewModel}
          />
        );
      default:
        return null;
    }
  };

  return props.windowVisible ? (
    <Root>
      <Grid item container justifyContent="center">
        <StyledAppBar position="sticky" color="default">
          <Tabs variant="fullWidth" value={props.activeTab} textColor="inherit">
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
