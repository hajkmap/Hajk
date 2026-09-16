import type {
  GroupDisplaySettings,
  GroupFormValues,
} from "../types";

export function toDisplaySettings(
  values: GroupFormValues,
): GroupDisplaySettings {
  return {
    toggled: values.toggled,
    expanded: values.expanded,
    exclusive: values.exclusive,
    infoDocument: values.infoDocument,
    metadata: { ...values.metadata },
  };
}

export function toFormValues(
  name: string,
  settings: GroupDisplaySettings,
): GroupFormValues {
  return {
    name,
    toggled: settings.toggled,
    expanded: settings.expanded,
    exclusive: settings.exclusive,
    infoDocument: settings.infoDocument,
    metadata: { ...settings.metadata },
  };
}
