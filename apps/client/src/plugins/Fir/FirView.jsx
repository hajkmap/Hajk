import PropTypes from "prop-types";
import FirSearchView from "./FirSearchView";
import FirExportView from "./FirExportView";
import FirSearchNeighborView from "./FirSearchNeighborView";
import FirSearchResultsView from "./FirSearchResultsView";
import FirViewShell from "./FirViewShell";

function FirView(props) {
  const { model, app, localObserver } = props;
  const passProps = { model, app, localObserver };

  return (
    <FirViewShell
      localObserver={localObserver}
      windowVisible={props.windowVisible}
      searchErrorEvent="fir.search.error"
      tabs={[
        {
          label: "Sök",
          content: (
            <>
              <FirSearchView {...passProps} />
              <FirSearchNeighborView {...passProps} />
              <FirSearchResultsView {...passProps} />
            </>
          ),
        },
        {
          label: "Exportera",
          content: <FirExportView {...passProps} />,
        },
      ]}
    />
  );
}

FirView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
  windowVisible: PropTypes.bool,
};

export default FirView;
