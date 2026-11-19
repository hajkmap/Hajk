import React from "react";
import { Component } from "react";
import Alert from "../views/alert.jsx";
import FeedbackTable from "./feedbackTable.jsx";
import Button from "@material-ui/core/Button";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import RefreshIcon from "@material-ui/icons/Refresh";
import GetAppIcon from "@material-ui/icons/GetApp";
import DeleteForeverIcon from "@material-ui/icons/DeleteForever";
import { withStyles } from "@material-ui/core/styles";
import { blue, red } from "@material-ui/core/colors";

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const defaultState = {
  loading: false,
  error: null,
  stats: null,
  entries: [],
  activeTab: 0, // 0 = unanswered, 1 = answered
  pending: {}, // ids of entries whose answered status is being saved
  alert: false,
  confirm: false,
  alertMessage: "",
  confirmAction: () => {},
  denyAction: () => {},
};

function formatBytes(bytes) {
  if (typeof bytes !== "number" || !isFinite(bytes)) return "Okänt";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} ${
    units[unit]
  }`;
}

function todayAsString() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

class Feedback extends Component {
  constructor() {
    super();
    this.state = defaultState;
  }

  componentDidMount() {
    this.props.model.set("config", this.props.config);
    this.refresh();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  safeSetState(state) {
    if (!this.unmounted) this.setState(state);
  }

  refresh() {
    this.setState({ loading: true, error: null });
    this.props.model.getStats((statsError, stats) => {
      this.props.model.getEntries((entriesError, entries) => {
        this.safeSetState({
          loading: false,
          error: statsError || entriesError || null,
          stats: statsError ? null : stats,
          entries: entriesError ? [] : entries,
        });
      });
    });
  }

  /**
   * Toggle an entry's answered status. The entry moves to the other tab
   * right away and moves back if saving fails.
   */
  toggleAnswered(entry) {
    const id = entry.id;
    const answered = !entry.answered;
    const updateEntry = (changes) =>
      this.safeSetState((state) => ({
        entries: state.entries.map((e) =>
          e.id === id ? { ...e, ...changes } : e
        ),
      }));
    const setPending = (value) =>
      this.safeSetState((state) => ({
        pending: { ...state.pending, [id]: value },
      }));

    setPending(true);
    updateEntry({ answered });
    this.props.model.setAnswered(id, answered, (error, result) => {
      setPending(false);
      if (error) {
        updateEntry({
          answered: entry.answered,
          answeredAt: entry.answeredAt,
          answeredBy: entry.answeredBy,
        });
        this.safeSetState({ alert: true, confirm: false, alertMessage: error });
        return;
      }
      updateEntry({
        answered: result.answered,
        answeredAt: result.answeredAt,
        answeredBy: result.answeredBy,
      });
    });
  }

  download() {
    this.setState({ error: null });
    this.props.model.getEntries((error, entries) => {
      if (error) {
        this.safeSetState({ error });
        return;
      }
      const blob = new Blob([JSON.stringify(entries, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `feedback-${todayAsString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }

  deleteAll() {
    this.setState({
      alert: true,
      confirm: true,
      alertMessage:
        "All inkommen feedback kommer att raderas permanent. Är detta ok?",
      confirmAction: () => {
        this.props.model.deleteAll((error, result) => {
          if (error) {
            this.safeSetState({ alert: true, alertMessage: error });
          } else {
            const count = result && result.deletedFiles;
            this.safeSetState({
              alert: true,
              alertMessage: `All feedback raderades (${
                typeof count === "number" ? count : 0
              } filer).`,
            });
          }
          this.refresh();
        });
      },
    });
  }

  getAlertOptions() {
    return {
      visible: this.state.alert,
      message: this.state.alertMessage,
      confirm: this.state.confirm,
      confirmAction: () => {
        this.state.confirmAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      denyAction: () => {
        this.state.denyAction();
        this.setState({
          alert: false,
          confirm: false,
          alertMessage: "",
        });
      },
      onClick: () => {
        this.setState({
          alert: false,
          alertMessage: "",
        });
      },
    };
  }

  renderStats(answeredCount, unansweredCount) {
    const { stats } = this.state;
    if (!stats) return null;
    const files = Array.isArray(stats.files) ? stats.files : [];
    const maxFiles = stats.limits && stats.limits.maxFiles;
    return (
      <table className="table table-condensed" style={{ width: "auto" }}>
        <tbody>
          <tr>
            <th>Aktiverad i backend</th>
            <td>
              {stats.active ? "Ja" : "Nej"}
              {!stats.active && (
                <span style={{ marginLeft: 8, color: "#a94442" }}>
                  (Sätt FEEDBACK_ACTIVE=true i backendens .env för att ta emot
                  feedback.)
                </span>
              )}
            </td>
          </tr>
          <tr>
            <th>Antal inlägg</th>
            <td>{stats.entryCount}</td>
          </tr>
          <tr>
            <th>Obesvarade / besvarade</th>
            <td>
              {unansweredCount} / {answeredCount}
            </td>
          </tr>
          <tr>
            <th>Total storlek</th>
            <td>{formatBytes(stats.totalSize)}</td>
          </tr>
          <tr>
            <th>Antal filer</th>
            <td>
              {files.length}
              {typeof maxFiles === "number" ? ` / ${maxFiles}` : ""}
            </td>
          </tr>
          <tr>
            <th>Ledigt diskutrymme</th>
            <td>{formatBytes(stats.freeDiskSpace)}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  renderEntries(unanswered, answered) {
    const { activeTab, pending } = this.state;
    return (
      <>
        <Tabs
          value={activeTab}
          onChange={(e, value) => this.setState({ activeTab: value })}
          indicatorColor="primary"
          textColor="primary"
          style={{ marginBottom: 10 }}
        >
          <Tab label={`Obesvarade (${unanswered.length})`} />
          <Tab label={`Besvarade (${answered.length})`} />
        </Tabs>
        {activeTab === 0 ? (
          <FeedbackTable
            entries={unanswered}
            answered={false}
            pending={pending}
            onToggle={(entry) => this.toggleAnswered(entry)}
            emptyText="Det finns ingen obesvarad feedback."
          />
        ) : (
          <FeedbackTable
            entries={answered}
            answered={true}
            pending={pending}
            onToggle={(entry) => this.toggleAnswered(entry)}
            emptyText="Det finns ingen besvarad feedback."
          />
        )}
      </>
    );
  }

  render() {
    const { loading, error, entries } = this.state;
    const answered = entries.filter((e) => e.answered === true);
    const unanswered = entries.filter((e) => e.answered !== true);
    return (
      <section className="tab-pane active">
        <Alert options={this.getAlertOptions()} />
        <h1>Feedback</h1>
        <p>
          <ColorButtonBlue
            variant="contained"
            className="btn"
            disabled={loading}
            onClick={() => this.refresh()}
            startIcon={<RefreshIcon />}
          >
            Uppdatera
          </ColorButtonBlue>
          &nbsp;
          <ColorButtonBlue
            variant="contained"
            className="btn"
            disabled={loading}
            onClick={() => this.download()}
            startIcon={<GetAppIcon />}
          >
            Ladda ner (JSON)
          </ColorButtonBlue>
          &nbsp;
          <ColorButtonRed
            variant="contained"
            className="btn"
            disabled={loading}
            onClick={() => this.deleteAll()}
            startIcon={<DeleteForeverIcon />}
          >
            Radera all feedback
          </ColorButtonRed>
          {loading && (
            <i className="fa fa-refresh fa-spin" style={{ marginLeft: 10 }} />
          )}
        </p>
        {error && <div className="alert alert-danger">{error}</div>}
        {this.renderStats(answered.length, unanswered.length)}
        {this.renderEntries(unanswered, answered)}
      </section>
    );
  }
}

export default Feedback;
