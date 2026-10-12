import type OlMap from "ol/Map";
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { HajkApp } from "../../types/hajk";
import type FeedbackModel from "./FeedbackModel";

// ---- Plugin options (from Admin config) ----

export interface FeedbackOptions {
  visibleAtStart?: boolean;
  title?: string;
  description?: string;
  /** Text shown above the message field */
  instructionText?: string;
  /** Plain text shown after the feedback has been sent */
  thankYouText?: string;
  /** Max number of characters. Can't exceed FEEDBACK_MAX_MESSAGE_LENGTH in Backend. */
  maxLength?: number;
  target?: string;
  position?: string;
  width?: number;
  height?: number | string;
}

// ---- Component props ----

export interface FeedbackProps {
  app: HajkApp;
  map: OlMap;
  options: FeedbackOptions;
  [key: string]: unknown;
}

export interface FeedbackViewProps {
  model: FeedbackModel;
  instructionText: string;
  thankYouText: string;
  maxLength: number;
}

export type SubmitResult = { ok: true } | { ok: false; message: string };

// ---- The ALTCHA web component ----

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "altcha-widget": DetailedHTMLProps<
        HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        challenge?: string;
        language?: string;
        configuration?: string;
      };
    }
  }
}
