import PropTypes from "prop-types";
import FirSearchResultsViewCore from "../Fir/FirSearchResultsViewCore";

function KirSearchResultsView({ model, app, localObserver }) {
  const genderField = model.config.genderField;

  return (
    <FirSearchResultsViewCore
      model={model}
      app={app}
      localObserver={localObserver}
      eventPrefix="kir"
      getResultLabel={(data) =>
        `${
          data.get(genderField) === model.config.genderMale ? "Man" : "Kvinna"
        }, ${data.get(model.config.ageField)} år`
      }
      onOpenToggled={(feature, open) => {
        localObserver.publish("kir.search.results.mark", {
          feature: feature,
          open: open,
        });
      }}
    />
  );
}

KirSearchResultsView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default KirSearchResultsView;
