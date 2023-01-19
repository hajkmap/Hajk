// Base
import React from "react";
import { styled } from "@mui/material/styles";
import { AppBar, Grid, Tabs, Tab } from "@mui/material";

// Components
import EstateSection from "../components/estates/EstateSection";
import CoordinateSection from "../components/coordinates/CoordinateSection";
import EnvironmentSection from "../components/environment/EnvironmentSection";

// Constants
import { INTEGRATION_IDS, TABS } from "../constants";

// Components
import SmallDivider from "../components/SmallDivider";
import HubConnectionStatusChip from "../components/HubConnectionStatusChip";

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

function BaseView(props) {
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
            mapViewModel={props.mapViewModel}
            activeMapInteraction={props.activeMapInteraction}
            setActiveMapInteraction={props.setActiveMapInteraction}
          />
        );
      default:
        return null;
    }
  };

  return (
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
          <SmallDivider />
          <Grid item container justifyContent="center">
            <HubConnectionStatusChip
              hubConnectionStatus={props.hubConnectionStatus}
            />
          </Grid>
        </Grid>
      </TabContent>
    </Root>
  );
}

export default BaseView;
