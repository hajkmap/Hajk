import i18n from "src/i18n";

// Creates a built-in introduction step. Built-in steps have an `id`, which
// Introduction.jsx uses to recognize them (titles are translated, so they
// can't be used for that). Texts are read from `introduction.steps.<id>.*`.
export const step = (id, props = {}) => ({
  id,
  title: i18n.t(`introduction.steps.${id}.title`),
  intro: i18n.t(`introduction.steps.${id}.intro`),
  ...props,
});
