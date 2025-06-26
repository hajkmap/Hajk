export const getLayerSwitcherSteps = (layerSwitcherPlugin) => [
  {
    title: "Hajk 4",
    intro:
      "Detta är en introduktion till Hajk 4, främst för att visa hur den nya lagerhanteraren fungerar. <br><br> Observera att du inte kan utföra några åtgärder som att klicka på knappar under introduktionen, detta är enbart för att illustrera hur den nya lagerhanteraren fungerar.",
  },
  {
    title: "Lagerlista",
    element: "#layerslist-container",
    intro:
      "Här finns lagerlistan där du kan se alla lager som är tillgängliga i kartan. <br><br> Du kan söka efter lager, tända/släcka lager och se information om varje lager.",
  },
  {
    title: "Sök lager",
    element: "#layer-list-filter",
    intro:
      "Mata in text för att söka efter lager. <br><br> Sökresultat visas i lagerlistan nedan.",
    position: () =>
      layerSwitcherPlugin.options.position === "right" ? "left" : "right",
  },
  {
    title: "Öppna meny bredvid sökfält",
    element: "#layerswitcher-actions-menu",
    intro:
      "Klicka på kebabmenyn. <br><br> <b>Menyn innehåller funktioner som:</b> dölj alla aktiva lager, scrolla till toppen av lagerlistan, scrolla till botten av lagerlistan.",
    position: () =>
      layerSwitcherPlugin.options.position === "right" ? "left" : "right",
  },
  {
    title: "Sök meny",
    element: "#layerswitcher-actions-menu-content",
    intro:
      "<b>Dölj alla aktiva lager:</b> Klicka på knappen för att dölja <b>ALLA</b> aktiva lager. <br><br> <b>Scrolla till toppen:</b> Klicka på knappen för att scrolla till toppen av lagerlistan. <br><br> <b>Scrolla till botten:</b> Klicka på knappen för att scrolla till botten av lagerlistan.",
  },
  {
    title: "Lagergrupp",
    element: "#layerGroup-accordion-arrow-button",
    intro:
      "Pil indikerar lagergrupp. Klicka för att se underliggande lager. <br/><br/> Notera att lagergruppnamns med <b>fetstil</b> innehåller tända lager.",
  },
  {
    title: "Tänd lager",
    element: "#toggle-layer-item",
    intro:
      "Klicka för att tända/släcka lager. Lagernamn med <b>fetsil</b> visar att lagret är tänt.",
    position: () =>
      layerSwitcherPlugin.options.position === "right" ? "left" : "bottom",
  },
  {
    title: "Lagerinformation",
    element: "#show-layer-details",
    intro: "Klicka för att se mer information om ett lager.",
  },
  {
    title: "Teckenförklaring",
    element: "#toggle-legend-icon",
    intro: "Knappen visar teckenförklaring.",
  },
  {
    title: "Lagerinformations vy",
    element: "#layer-item-details-info",
    intro: "Här visas eventuell information oOpacitetm ett lager.",
  },
  {
    title: "Opacitet",
    element: "#layer-details-opacity-slider",
    intro: "Reglage för att ändra opacitet för ett lager.",
  },
  {
    title: "Lägg till/ta bort lager i snabbåtkomst",
    element: "#layer-details-quick-access-button",
    intro:
      "Knappen lägger till/tar bort ett lager från snabbåtkomst menyn i lagervyn.",
  },
  {
    title: "Flikar i lagerhanteraren",
    element: "#layer-switcher-tab-panel",
    intro: () =>
      `Klicka här för att växla mellan olika vyer: <br><br> - Kartlager <br> - Bakgrund <br>${layerSwitcherPlugin.options.showDrawOrderView ? "- Ritordning: Här kan du ändra ritordning på tända lager i kartan" : ""}`,
  },
  {
    title: "Ritordning",
    element: "#draw-order-tab",
    intro:
      "Klicka på Ritordnings-fliken för att se och ändra ritordningen för lagren.",
    position: () =>
      layerSwitcherPlugin.options.position === "right" ? "left" : "right",
  },
  {
    title: "Aktivera systemlager",
    element: "#draw-order-switch",
    intro:
      "Klicka för att visa systemlager i lagerlistan och ändra ritordning av lager genererade av verktyg.",
  },
  {
    title: "Lista över systemlager",
    element: ".draw-order-list",
    intro:
      "Här kan du se och ändra ritordningen för systemlager. <br><br> Dra och släpp lager för att ändra ritordningen.",
  },
  {
    title: "Snabbåtkomst",
    element: "#quick-access-view",
    intro: "Lista och menyer för åtkomst och underhåll av sparade lager.",
  },
  {
    title: "Snabbåtkomst meny",
    element: "#quick-access-menu-button",
    intro:
      "Klicka på kebabmenyn i snabbåtkomst.<br><br> <b>Menyn innehåller funktioner som:</b> <br> - Lägg till tända lager <br> - Rensa allt",
  },
  {
    title: "Snabbåtkomst meny innehåll",
    element: "#quick-access-menu-content",
    intro:
      "<b>Lägg till tända lager:</b> Klicka för att lägga till alla tända lager i snabbåtkomst. <br><br> <b>Rensa allt:</b> Klicka för att rensa alla lager i snabbåtkomst.",
  },
  {
    title: "Mina favoriter",
    element: "#favorites-menu-button",
    intro:
      "Klicka på favoriter-knappen. <br><br> Menyn innehåller funktioner som att spara till favoriter, redigera favoriter och ladda favoriter.",
  },
  {
    title: "Mina favoriter meny",
    element: "#favorites-menu",
    intro:
      "Knappen öppnar en meny med verktyg för att gruppera och spara lager i snabbåtkomst (mina favoriter): <br><br> - <b>Spara till favoriter:</b> Sparar en grupp som innehåller ett eller flera lager. Titel och beskrivning av denna grupp kan tillämpas, <i>observera att favoriter endast sparas tillfälligt och lokalt för dig</i>. <br><br> - <b>Redigera favoriter:</b> Hantera sparade lager. <br><br> - <b>Ladda favorit:</b> Vid laddning ersätts lagren i snabbåtkomst. Alla tända lager i kartan släcks och ersätts med favoritens tända lager.",
  },
  {
    title: "Redigera favoriter",
    element: "#edit-favorites",
    intro: "Knappen öppnar en separat vy för att hantera sparade favoriter.",
  },
  {
    title: "Importera favoriter",
    element: "#import-favorites-button",
    intro: "Klicka för att importera favoriter från en .json-fil.",
  },
  {
    title: "Lista över favoriter",
    element: ".favorites-list-view",
    intro:
      "Här kan du se och hantera dina sparade favoriter. Klicka för att skriva över befintliga lager med favoriterna.",
  },
  {
    title: "Favoriter flerval",
    element: "#favorites-list-options-button",
    intro:
      "Klicka på kebabmenyn i favoriter-listan. <br><br> <b>Menyn innehåller funtioner som t.ex:</b> information om favoriten, redigera favoriten, ta bort favoriten och exportera favoriten som en .json fil.",
  },
  {
    title: "Favoriter flerval meny",
    element: "#favorites-list-options-menu",
    intro:
      "<b> - Redigera:</b> Redigera titel och beskrivning för favoriter <br><br> <b> - Ta bort:</b> Tar bort favoriten från listan <br><br> <b> - Exportera:</b> Exporterar favoriten som en .json fil",
  },
  {
    title: "Slut",
    intro: "Detta är slutet.",
  },
];
