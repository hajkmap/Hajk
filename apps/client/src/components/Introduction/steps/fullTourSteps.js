import { getLayerSwitcherSteps } from "./layerSwitcherSteps";

// Initial steps for the full tour (before layer switcher)
const getInitialSteps = (
  drawerButtonTitle,
  documenthandlerDrawerButtonTitle,
  documenthandler,
  activeDrawerContent,
  isDrawerPermanent
) => {
  const steps = [
    {
      title: "Välkommen",
      intro:
        "Här kommer en kort guide som visar dig runt i applikationen. <br /><br /><b>Instruktioner:</b> Vänta tills objektet markeras (se nedan) innan du går vidare till nästa steg. Du kan inte utföra några åtgärder som att klicka på knappar under introduktionen.<br /><br />Detta är endast för att illustrera det mesta av grund funktionaliteten i applikationen. <br><br> <div style='text-align: center; margin: 15px 0;'><div class='highlight-demo' style='display: inline-block; width: 100px; height: 60px; border: 3px solid #fff; border-radius: 8px; background: rgba(0,0,0,0.9); animation: moveHighlight 3s infinite; color: #fff; text-align: center; line-height: 60px; font-size: 12px; font-weight: bold;'>Innehåll</div></div><br /><br />Följ med!",
    },
    {
      title: "Verktygspanel",
      element: "header > div:first-child",
      intro: () => {
        let intro = `<b>${drawerButtonTitle || "Verktygspanel"}:</b> här hittar du olika funktioner och verktyg som hjälper dig att interagera med kartan.`;

        if (documenthandler) {
          intro += `<br /><br /><b>${documenthandlerDrawerButtonTitle || "Meny"}:</b> är ett verktyg som används för att visa större mängder text i Hajk. Primär användning idag är för översiktsplaner men det skulle kunna användas för valfri textmängd. Klicka på knappen för att visa sidomenyn.`;
        }

        return intro;
      },
    },
  ];

  // Conditionally add either Kartverktyg or Dokumenthanteraren step
  if (activeDrawerContent === "documenthandler" && isDrawerPermanent) {
    steps.push({
      title: "Dokumenthanteraren",
      element: "#drawer-content",
      intro: "Här hittar du verktyg för att hantera dokument och filer.",
    });
  } else {
    steps.push({
      title: "Kartverktyg",
      element: "#drawer-content",
      intro:
        "Kartverktygen har olika funktioner som kan användas för att navigera i kartan.<br /><br />Här listas de verktyg som har verktygsplaceringen i sidomenyn. .<br /><br /> Verktygen kan placeras om av administratörerna.",
    });
  }

  // Add remaining steps
  steps.push(
    {
      title: "Lås fast verktygspanelen",
      element: "#toggle-drawer-permanent",
      intro: "Klicka på knappen för att låsa fast verktygspanelen.",
    },
    {
      title: "Sökruta",
      element: ".MuiAutocomplete-inputRoot",
      intro:
        "Med hjälp av sökverktyget hittar du enkelt till rätt plats i kartan.",
    },
    {
      title: "Fler sökalternativ",
      element: "#search-options-button",
      intro: "Under den här knappen hittar du fler avancerade sökalternativ.",
      position: "left",
    },
    {
      title: "Meny för fler sökverktyg",
      element: "#search-tools-menu",
      intro:
        "Här kan du välja mellan olika sökverktyg för att genomföra din sökning. <br><br> Du kan även öppna en separat meny för att hantera sökinställningar.",
      position: "left",
    },
    {
      title: "Kartkontroller",
      element: "#controls-column",
      intro:
        "Längst ut i den högra delen av skärmen finns olika kontroller knappar som du använder för att navigera i kartan.",
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
