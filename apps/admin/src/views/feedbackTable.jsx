import React from "react";
import Checkbox from "@material-ui/core/Checkbox";
import Tooltip from "@material-ui/core/Tooltip";

const MAX_VISIBLE_ENTRIES = 100;

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return isNaN(date.getTime())
    ? String(timestamp || "")
    : date.toLocaleString("sv-SE");
}

function isHttpUrl(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

function formatUser(user) {
  if (user === undefined || user === null || user === "") return "";
  return typeof user === "string" ? user : JSON.stringify(user);
}

/**
 * Table with feedback entries, each with a checkbox that marks it as
 * answered (or, when unticked, as not answered).
 *
 * Props:
 * - entries: the entries to show, newest first
 * - answered: true if this is the answered tab (shows when/by whom)
 * - pending: object with ids of entries that are being updated
 * - onToggle(entry): called when an entry's checkbox is clicked
 * - emptyText: shown when there are no entries
 */
function FeedbackTable({ entries, answered, pending, onToggle, emptyText }) {
  if (entries.length === 0) {
    return <p>{emptyText}</p>;
  }
  const visible = entries.slice(0, MAX_VISIBLE_ENTRIES);
  const toggleLabel = answered
    ? "Markera som obesvarad"
    : "Markera som besvarad";
  return (
    <>
      {entries.length > MAX_VISIBLE_ENTRIES && (
        <p>
          Visar de {MAX_VISIBLE_ENTRIES} senaste av totalt {entries.length}{" "}
          inlägg. Ladda ner JSON-filen för att se allt.
        </p>
      )}
      <table className="table table-striped table-condensed">
        <thead>
          <tr>
            <th style={{ width: 1, whiteSpace: "nowrap" }}>Besvarad</th>
            <th style={{ whiteSpace: "nowrap" }}>Tidpunkt</th>
            <th>Karta</th>
            <th>Meddelande</th>
            <th>Länk</th>
            <th>Användare</th>
            {answered && <th style={{ whiteSpace: "nowrap" }}>Besvarad av</th>}
          </tr>
        </thead>
        <tbody>
          {visible.map((entry, i) => {
            const anchorUrl = entry.context && entry.context.anchorUrl;
            return (
              <tr key={entry.id || i}>
                <td style={{ padding: 0, verticalAlign: "middle" }}>
                  <Tooltip title={toggleLabel}>
                    <span>
                      <Checkbox
                        color="primary"
                        size="small"
                        checked={entry.answered === true}
                        disabled={!entry.id || pending[entry.id] === true}
                        onChange={() => onToggle(entry)}
                        inputProps={{ "aria-label": toggleLabel }}
                      />
                    </span>
                  </Tooltip>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  {formatTimestamp(entry.timestamp)}
                </td>
                <td>{entry.map == null ? "" : String(entry.map)}</td>
                <td style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {entry.message == null ? "" : String(entry.message)}
                </td>
                <td>
                  {isHttpUrl(anchorUrl) ? (
                    <a
                      href={anchorUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Öppna
                    </a>
                  ) : null}
                </td>
                <td>{formatUser(entry.user)}</td>
                {answered && (
                  <td style={{ whiteSpace: "nowrap" }}>
                    {entry.answeredAt ? formatTimestamp(entry.answeredAt) : ""}
                    {entry.answeredBy ? (
                      <>
                        <br />
                        {formatUser(entry.answeredBy)}
                      </>
                    ) : null}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default FeedbackTable;
