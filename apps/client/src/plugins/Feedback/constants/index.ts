export const DEFAULT_TITLE = "Tyck till";
export const DEFAULT_DESCRIPTION = "Skicka synpunkter till oss";
export const DEFAULT_INSTRUCTION_TEXT =
  "Har du synpunkter på kartan eller dess innehåll? Skriv dem här.";
export const DEFAULT_THANK_YOU_TEXT = "Tack för din återkoppling!";
export const DEFAULT_MAX_LENGTH = 2000;

// Backend rejects longer links, so we leave the link out rather than lose the feedback
export const MAX_ANCHOR_URL_LENGTH = 2048;

export const UI_STRINGS = {
  messageLabel: "Meddelande",
  send: "Skicka",
  sending: "Skickar…",
  sendAgain: "Skicka en till",
  privacyNotice:
    "Skriv inga personuppgifter. En länk till kartan som du ser den just nu skickas med.",
  errors: {
    generic: "Det gick inte att skicka. Försök igen senare.",
    network:
      "Kunde inte nå servern. Kontrollera din anslutning och försök igen.",
    captcha:
      "Verifieringen gick inte igenom. Verifiera igen och skicka på nytt.",
    tooMany:
      "Du har skickat för många meddelanden. Vänta en stund och försök igen.",
    notEnabled: "Funktionen är inte aktiverad.",
    invalid:
      "Meddelandet kunde inte tas emot. Kontrollera texten och försök igen.",
  },
};
