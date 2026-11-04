import { hfetch } from "../../utils/FetchWrapper";

import { MAX_ANCHOR_URL_LENGTH } from "./constants";
import i18n from "src/i18n";
import type { SubmitResult } from "./types";
import type { HajkApp } from "../../types/hajk";

interface AnchorModel {
  getAnchor: (preventHashUpdate?: boolean) => Promise<string>;
}

/**
 * @summary Talks to the feedback endpoints in Backend.
 */
export default class FeedbackModel {
  #app: HajkApp;
  #baseUrl: string;
  #challengeUrl: string;

  constructor(app: HajkApp) {
    this.#app = app;
    const appConfig = app.config.appConfig as { mapserviceBase: string };
    this.#baseUrl = `${appConfig.mapserviceBase}/feedback`;
    this.#challengeUrl = `${appConfig.mapserviceBase}/captcha/challenge`;
  }

  /** URL that the ALTCHA widget fetches its challenge from */
  getChallengeUrl(): string {
    return this.#challengeUrl;
  }

  /** Link to the map as the user sees it right now, if it isn't too long */
  async #getAnchorUrl(): Promise<string | null> {
    try {
      const anchorModel = this.#app.anchorModel as AnchorModel | undefined;
      const url = (await anchorModel?.getAnchor(true)) ?? null;
      return url && url.length <= MAX_ANCHOR_URL_LENGTH ? url : null;
    } catch {
      return null;
    }
  }

  /**
   * @param message The user's feedback
   * @param captcha Payload from the solved ALTCHA challenge
   */
  async submit(message: string, captcha: string): Promise<SubmitResult> {
    const body = {
      map: this.#app.config.activeMap,
      message,
      captcha,
      context: {
        anchorUrl: await this.#getAnchorUrl(),
        clientVersion: import.meta.env.VITE_APP_GIT_HASH || null,
      },
    };

    let response: Response;
    try {
      response = await hfetch(this.#baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      return { ok: false, message: i18n.t("feedback.errors.network") };
    }

    if (response.ok) return { ok: true };

    switch (response.status) {
      case 403:
        return { ok: false, message: i18n.t("feedback.errors.captcha") };
      case 404:
        return { ok: false, message: i18n.t("feedback.errors.notEnabled") };
      case 429:
        return { ok: false, message: i18n.t("feedback.errors.tooMany") };
      case 400:
        return { ok: false, message: i18n.t("feedback.errors.invalid") };
      default:
        return { ok: false, message: i18n.t("feedback.errors.generic") };
    }
  }
}
