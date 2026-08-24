import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";

import FirExportPropertyListView from "./FirExportPropertyListView";
import FirExportResidentListView from "./FirExportResidentListView";

const ContainerInfo = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const SpanNum = styled("span")(({ _theme }) => ({
  fontWeight: 500,
  fontSize: "1rem",
}));

function FirExportView({ model, app, localObserver }) {
  const fnsRef = useRef({});

  const [state, setStateRaw] = useState(() => ({
    results: [],
  }));
  const stateRef = useRef(state);
  const [, setTick] = useState(0);

  const setState = (patch) => {
    stateRef.current = { ...stateRef.current, ...patch };
    setStateRaw(stateRef.current);
  };

  const forceUpdate = () => {
    setTick((tick) => tick + 1);
  };

  fnsRef.current = {
    handleResultsFiltered: (list) => {
      setState({ results: [...list] });
      forceUpdate();
    },
  };

  useEffect(() => {
    localObserver.subscribe("fir.results.filtered", (list) => {
      fnsRef.current.handleResultsFiltered(list);
    });
  }, [localObserver, fnsRef]);

  return (
    <>
      <div>
        <ContainerInfo>
          <SpanNum>{state.results.length}</SpanNum> objekt finns tillgängliga
          för export.
        </ContainerInfo>
        {model.config.propertyList ? (
          <FirExportPropertyListView
            results={state.results}
            model={model}
            app={app}
            localObserver={localObserver}
          />
        ) : (
          ""
        )}
        {model.config.residentList ? (
          <FirExportResidentListView
            results={state.results}
            model={model}
            localObserver={localObserver}
          />
        ) : (
          ""
        )}
      </div>
    </>
  );
}

FirExportView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default FirExportView;
