import PropTypes from "prop-types";
import KirSearchView from "./KirSearchView";
import KirExportView from "./KirExportView";
import KirSearchResultsView from "./KirSearchResultsView";
import FirViewShell from "../Fir/FirViewShell";

function KirView(props) {
  const { model, app, localObserver } = props;
  const passProps = { model, app, localObserver };

  return (
    <FirViewShell
      localObserver={localObserver}
      windowVisible={props.windowVisible}
      tabs={[
        {
          label: "Sök",
          content: (
            <>
              <KirSearchView {...passProps} />
              <KirSearchResultsView {...passProps} />
            </>
          ),
        },
        {
          label: "Exportera",
          content: <KirExportView {...passProps} />,
        },
      ]}
    />
  );
}

KirView.propTypes = {
  model: PropTypes.object.isRequired,
  app: PropTypes.object.isRequired,
  localObserver: PropTypes.object.isRequired,
  windowVisible: PropTypes.bool,
};

export default KirView;
