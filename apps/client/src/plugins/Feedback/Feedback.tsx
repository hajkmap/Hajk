import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";

import FeedbackModel from "./FeedbackModel";
import FeedbackView from "./FeedbackView";

import FeedbackIcon from "@mui/icons-material/Feedback";

import {
  DEFAULT_DESCRIPTION,
  DEFAULT_INSTRUCTION_TEXT,
  DEFAULT_MAX_LENGTH,
  DEFAULT_THANK_YOU_TEXT,
  DEFAULT_TITLE,
} from "./constants";
import type { FeedbackProps } from "./types";

/**
 * @summary Lets users send short feedback to the admins. Saved by Backend,
 * see FEEDBACK_* in Backend's .env.
 */
const Feedback: React.FC<FeedbackProps> = (props) => {
  const [model] = React.useState(() => new FeedbackModel(props.app));
  const { options } = props;

  return (
    <BaseWindowPlugin
      {...props}
      type="feedback"
      custom={{
        icon: <FeedbackIcon />,
        title: options.title || DEFAULT_TITLE,
        description: options.description || DEFAULT_DESCRIPTION,
        height: "dynamic",
        width: 400,
      }}
    >
      <FeedbackView
        model={model}
        instructionText={options.instructionText ?? DEFAULT_INSTRUCTION_TEXT}
        thankYouText={options.thankYouText || DEFAULT_THANK_YOU_TEXT}
        maxLength={
          Number.isInteger(options.maxLength) && options.maxLength! > 0
            ? options.maxLength!
            : DEFAULT_MAX_LENGTH
        }
      />
    </BaseWindowPlugin>
  );
};

export default Feedback;
