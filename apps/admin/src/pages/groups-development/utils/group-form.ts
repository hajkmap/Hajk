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
    exclusiveGroup: values.exclusiveGroup,
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
    exclusiveGroup: settings.exclusiveGroup,
    infoDocument: settings.infoDocument,
    metadata: { ...settings.metadata },
  };
}
