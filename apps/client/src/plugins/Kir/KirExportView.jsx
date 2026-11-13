import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { styled } from "@mui/material/styles";

import FirExportResidentListView from "../Fir/FirExportResidentListView";

const ContainerInfo = styled("div")(({ theme }) => ({
  padding: theme.spacing(2),
}));

const SpanNum = styled("span")(({ _theme }) => ({
  fontWeight: 500,
  fontSize: "1rem",
}));

function KirExportView({ model, app, localObserver }) {
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
    localObserver.subscribe("kir.results.filtered", (list) => {
      fnsRef.current.handleResultsFiltered(list);
    });
  }, [localObserver, fnsRef]);

  return (
    <>
      <div>
        <ContainerInfo>
          {!model.app.plugins.kir?.options?.residentList && (
            <div>Otillräcklig behörighet för att exportera resultat</div>
          )}
          {model.app.plugins.kir?.options?.residentList && (
            <div>
              <SpanNum>{state.results.length}</SpanNum> objekt finns
              tillgängliga för export.
            </div>
          )}
        </ContainerInfo>
        <FirExportResidentListView
          results={state.results}
          model={model}
          app={app}
          localObserver={localObserver}
          type={"kir"}
        />
      </div>
    </>
  );
}

KirExportView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default KirExportView;
