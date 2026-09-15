import { getLayerSwitcherSteps } from "./layerSwitcherSteps";

// Initial steps for the full tour (before layer switcher)
const getInitialSteps = (
  drawerButtonTitle,
  documenthandlerDrawerButtonTitle,
  documenthandler,
  _activeDrawerContent,
  _isDrawerPermanent
) => {
  const steps = [
    {
      title: "Välkommen",
      intro:
        "Här får du en kort guide som visar dig runt i applikationen. Syftet är att ge en överblick över grundfunktionerna och de nyheter som tillkommit i Hajk 4. <br><br>Observera att inga andra åtgärder, som att klicka på knappar eller använda andra funktioner i applikationen, är möjliga under introduktionen. <br><br>👉 Följ med!",
    },
    {
      title: "Verktygspanel",
      element: "#drawer-toggle-button-group",
      intro: () => {
        let intro = `<b>${drawerButtonTitle || "Verktygspanel"}:</b> här hittar du olika funktioner och verktyg som hjälper dig att interagera med kartan.`;

        if (documenthandler) {
          intro += `<br /><br /><b>${documenthandlerDrawerButtonTitle || "Meny"}:</b> är ett verktyg som används för att visa större mängder text i Hajk. Klicka på knappen för att visa sidomenyn.`;
        }

        return intro;
      },
    },
  ];

  // Add Kartverktyg step
  steps.push({
    title: "Kartverktyg",
    element: "#drawer-content",
    intro:
      "Kartverktygen har olika funktioner som hjälper dig att navigera i kartan.<br><br>Här visas de verktyg som är placerade i sidomenyn.<br><br>Verktygens placering kan ändras av administratörer.",
  });

  // Add remaining steps
  steps.push(
    {
      title: "Lås fast sidomenyn",
      element: "#toggle-drawer-permanent",
      intro: "Klicka på knappen för att låsa fast sidomenyn.",
    },
    // Show the Document Handler content after locking the drawer (when available)
    ...(documenthandler
      ? [
          {
            title: "Dokumenthanteraren",
            element: "#drawer-content",
            intro:
              "Dokumenthanteraren används för att visa och hantera texter som är kopplade till kartan. Dokumenten är fristående och kan återanvändas i flera kartor.<br><br>Med Dokumenthanteraren kan du: <ul><li>Visa utförliga texter som är kopplade till kartbokmärken.</li><li>Kombinera text och karta genom att lägga till kartlänkar som motsvarar kartlager i kartan.</li></ul>",
          },
        ]
      : []),
    {
      title: "Sökruta",
      element: "#search-bar",
      intro: "Sökverktyget hjälper dig att snabbt hitta rätt plats i kartan.",
    },
    {
      title: "Fler sökalternativ",
      element: "#search-options-button",
      intro: "Här hittar du fler avancerade sökalternativ.",
      position: "left",
    },
    {
      title: "Meny för sökverktyg",
      element: "#search-tools-menu",
      intro:
        "Här kan du välja mellan olika sökverktyg för att göra din sökning.<br><br>Du kan också klicka på <b>Sökinställningar</b> för att öppna en separat meny.",
      position: "left",
    },
    {
      title: "Kartkontroller",
      element: "#controls-column",
      intro:
        "Längst till höger på skärmen finns kontrollknappar som du kan använda för att navigera i kartan.",
    }
  );

  return steps;
};

export const getFullIntroductionSteps = (
  layerSwitcherPlugin,
  drawerButtonTitle,
  documenthandlerDrawerButtonTitle,
  documenthandler,
  activeDrawerContent,
  isDrawerPermanent
) => [
  ...getInitialSteps(
    drawerButtonTitle,
    documenthandlerDrawerButtonTitle,
    documenthandler,
    activeDrawerContent,
    isDrawerPermanent
  ),
  ...getLayerSwitcherSteps(layerSwitcherPlugin),
];
