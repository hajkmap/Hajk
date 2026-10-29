import { Alert, Button, Stack, type SxProps, type Theme } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { Presence, PresenceResource } from "../api/presence";

/** Whose tree shows in the tree's place: the editing or the saved one. */
export type PresenceShadowOf = "editing" | "saved";

interface PresenceNoticeProps {
  resource: PresenceResource;
  /** From the page's usePresence. */
  presence: Presence | undefined;
  /** What the tree shows instead of one's own, if anything. */
  shadowOf: PresenceShadowOf | null;
  /** Left out where the tree isn't shown: no buttons for it then. */
  onShadowChange?: (shadowOf: PresenceShadowOf | null) => void;
  /** The page's draft began before the tree's last save. */
  overwrites: boolean;
  /** Drops the draft for the saved tree. */
  onReload: () => void;
  /** Spacing to what is around it; nothing is drawn when there is no warning. */
  sx?: SxProps<Theme>;
}

/**
 * That someone saved the map's or group's tree after the page's draft began,
 * with buttons that show what they saved in the tree's place and that drop
 * the draft for it, and that someone else is editing the tree, and since
 * when, with a button that shows their unsaved tree. Only warnings: the last
 * save wins.
 */
export default function PresenceNotice({
  resource,
  presence,
  shadowOf,
  onShadowChange,
  overwrites,
  onReload,
  sx,
}: PresenceNoticeProps) {
  const { t, i18n } = useTranslation();
  const editors = presence?.editors ?? [];
  const saved = overwrites ? presence?.saved : null;
  if (editors.length === 0 && !saved) return null;

  // The time, with the date only if that isn't today.
  const when = (iso: string, key: "since" | "at") => {
    const date = new Date(iso);
    const time = date.toLocaleTimeString(i18n.language, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return date.toDateString() === new Date().toDateString()
      ? t(`presence.${key}.today`, { time })
      : t(`presence.${key}.date`, {
          date: date.toLocaleDateString(i18n.language),
          time,
        });
  };
  const names = [
    ...new Set(editors.flatMap((editor) => editor.userName ?? [])),
  ];
  // Since the first of them began.
  const since = editors.map((editor) => editor.since).sort()[0];
  const toggle = (of: PresenceShadowOf) =>
    onShadowChange ? (
      <Button
        color="inherit"
        size="small"
        sx={{ whiteSpace: "nowrap" }}
        onClick={() => onShadowChange(shadowOf === of ? null : of)}
      >
        {t(shadowOf === of ? "presence.hide" : "presence.show")}
      </Button>
    ) : null;

  return (
    <Stack spacing={1} sx={sx}>
      {saved ? (
        <Alert
          severity="warning"
          data-presence-saved
          action={
            <Stack direction="row" spacing={1}>
              {toggle("saved")}
              <Button
                color="inherit"
                size="small"
                sx={{ whiteSpace: "nowrap" }}
                onClick={onReload}
              >
                {t("presence.reload")}
              </Button>
            </Stack>
          }
        >
          {t(`presence.saved.${resource.type}`, {
            who: saved.by ?? t("presence.someone"),
            at: when(saved.at, "at"),
          })}
        </Alert>
      ) : null}
      {editors.length > 0 ? (
        <Alert
          severity="warning"
          data-presence-editing
          action={toggle("editing")}
        >
          {t(`presence.editing.${resource.type}`, {
            who:
              names.length > 0
                ? new Intl.ListFormat(i18n.language, {
                    type: "conjunction",
                  }).format(names)
                : t("presence.someone"),
            since: when(since, "since"),
          })}
        </Alert>
      ) : null}
    </Stack>
  );
}
