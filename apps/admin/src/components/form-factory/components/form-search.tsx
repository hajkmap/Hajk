import React from "react";
import { TextField } from "@mui/material";
import { t } from "i18next";
import SearchAdornment from "./search-adornment";
import { highlightColor } from "./highlight-indicator";
import { FieldValues } from "react-hook-form";
import DynamicFormContainer, { FormElement } from "../dynamic-form-container";
import DynamicInputSettings from "../types/dynamic-input-settings";
import { isFormElementContainer, isFormElementInput } from "../form-utils";

const minimumSearchLength = 3;

const searchFormElements = <TFieldValues extends FieldValues>(
  elements: FormElement<TFieldValues>[],
  searchTerm: string
): number => {
  let hitCount = 0;

  if (!searchTerm || searchTerm.length < minimumSearchLength) {
    elements.forEach((item) => {
      if (isFormElementInput(item)) {
        (item as DynamicInputSettings<TFieldValues>).highlight = false;
      } else if (isFormElementContainer(item)) {
        (item as DynamicFormContainer<TFieldValues>).highlight = false;
        searchFormElements(
          (item as DynamicFormContainer<TFieldValues>).getElements(),
          searchTerm
        );
      }
    });
    return 0;
  }

  elements.forEach((item) => {
    if (isFormElementContainer(item)) {
      const container = item as DynamicFormContainer<TFieldValues>;
      const hitsInContainer = searchFormElements(
        container.getElements(),
        searchTerm
      );

      container.highlight = hitsInContainer > 0;
      if (hitsInContainer > 0) hitCount += hitsInContainer;
    } else if (isFormElementInput(item)) {
      const inputItem = item as DynamicInputSettings<TFieldValues>;

      // Lets search for stuff.
      // If we want to search other props, we can add that here later.
      if (
        inputItem.title?.toLowerCase().includes(searchTerm.trim().toLowerCase())
      ) {
        inputItem.highlight = true;
        hitCount++;
      } else {
        inputItem.highlight = false;
      }
    }
  });

  return hitCount;
};

interface FormSearchProps<TFieldValues extends FieldValues> {
  formControls: DynamicFormContainer<TFieldValues>;
  onElementsChange: (elements: FormElement<TFieldValues>[]) => void;
}

const FormSearch = <TFieldValues extends FieldValues>({
  formControls,
  onElementsChange,
}: FormSearchProps<TFieldValues>) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [hitCount, setHitCount] = React.useState(0);
  const prevSearchTermRef = React.useRef("");

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    setSearchTerm((event.target as HTMLInputElement).value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  // Update search results when search term changes (immediate)
  React.useEffect(() => {
    // Only update if search term actually changed
    if (prevSearchTermRef.current === searchTerm) {
      return;
    }

    const elements = formControls.getElements();
    const hits = searchFormElements(elements, searchTerm);
    setHitCount(hits);

    // Create a new array reference to trigger React re-render
    onElementsChange([...elements]);

    prevSearchTermRef.current = searchTerm;
  }, [searchTerm, formControls, onElementsChange]);

  return (
    <TextField
      size="small"
      fullWidth
      label={t("form.search.placeholder", {
        minChars: minimumSearchLength,
      })}
      variant="outlined"
      value={searchTerm}
      onInput={handleInput}
      slotProps={{
        input: {
          endAdornment: (
            <SearchAdornment
              searchTerm={searchTerm}
              hitCount={hitCount}
              highlightColor={highlightColor}
              handleClearSearch={handleClearSearch}
              minimumSearchLength={minimumSearchLength}
            />
          ),
        },
      }}
    />
  );
};

export default FormSearch;
