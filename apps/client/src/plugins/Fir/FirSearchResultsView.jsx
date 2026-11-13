import PropTypes from "prop-types";
import FirSearchResultsViewCore from "./FirSearchResultsViewCore";

function FirSearchResultsView({ model, app, localObserver }) {
  const textField = model.config.resultsList.textField.trim();

  return (
    <FirSearchResultsViewCore
      model={model}
      app={app}
      localObserver={localObserver}
      eventPrefix="fir"
      showMapClickTools={true}
      keepPageOnFiltered={true}
      getResultLabel={(data) => data.get(textField)}
      onOpenToggled={(feature, open) => {
        localObserver.publish("fir.search.results.highlight", {
          feature: feature,
          highlight: open,
        });
      }}
      onRemoveFeature={() => {
        localObserver.publish("fir.search.results.highlight", {
          feature: null,
          highlight: false,
        });
      }}
    />
  );
}

FirSearchResultsView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
};

export default FirSearchResultsView;
