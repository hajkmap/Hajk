export const getLayerSwitcherSteps = (layerSwitcherPlugin) => [
  {
    title: "Hajk 4",
    intro:
      "Det här är en introduktion till Hajk 4, främst för att visa hur den nya lagerhanteraren fungerar. <br><br>Introduktionens syfte är att illustrera ändringarna som har tillkommit i Hajk 4.",
  },
  {
    title: "Lagerlista",
    element: "#layerslist-container",
    intro:
      "I lagerlistan kan du se alla lager som är tillgängliga i kartan. <br><br> Du kan söka efter lager, slå på/av lager och se information om varje lager.",
  },
  {
    title: "Sök lager",
    element: "#layer-list-filter",
    intro:
      "Ange text för att söka efter lager. <br><br> Sökresultaten visas i lagerlistan nedan.",
  },
  {
    title: "Öppna meny bredvid sökfält",
    element: "#layerswitcher-actions-menu-button",
    intro:
      "Klicka på kebabmenyn. <br><br> <b>Menyn innehåller funktioner som:</b> dölj alla aktiva lager, scrolla till toppen av lagerlistan, scrolla till botten av lagerlistan.",
  },
  {
    title: "Meny",
    element: "#layerswitcher-actions-menu",
    intro:
      "<b>Dölj alla aktiva lager:</b> Klicka på knappen för att dölja <b>ALLA</b> aktiva lager. <br><br> <b>Scrolla till toppen:</b> Klicka på knappen för att scrolla till toppen av lagerlistan. <br><br> <b>Scrolla till botten:</b> Klicka på knappen för att scrolla till botten av lagerlistan.",
  },
  {
    title: "Lagergrupp",
    element: "#layerGroup-accordion-arrow-button",
    intro:
      "Pilen indikerar en lagergrupp. Klicka för att se underliggande lager. <br/><br/> Notera att lagergruppnamn med <b>fetstil</b> innehåller aktiverade lager.",
  },
  {
    title: "Aktivera/inaktivera lager",
    element: "#toggle-layer-item",
    intro:
      "Klicka för att växla mellan slå på/av lager. Lagernamn med <b>fetstil</b> visar att lagret är aktiverat.",
    position: "bottom",
  },
  {
    title: "Knapp för mer information",
    element: "#show-layer-details",
    intro: "Klicka på knappen för att se mer information om lagret.",
  },
  {
    title: "Teckenförklaring",
    element: "#toggle-legend-icon",
    intro:
      "Knappen expanderar en sektion med teckenförklaring. <br><br> Klicka för att visa eller dölja teckenförklaringen.",
  },
  {
    title: "Information",
    element: "#layer-item-details-info",
    intro: "Här visas eventuell information om lagret.",
  },
  {
    title: "Transparens",
    element: "#layer-details-opacity-slider",
    intro: "Reglaget används för att ändra transparensen för lagret.",
  },
  {
    title: "Åtgärdsknapp för snabbåtkomst",
    element: "#layer-details-quick-access-button",
    intro:
      "<b>Lägg till i snabbåtkomst:</b> lagret kommer att läggas till i snabbåtkomstmenyn under kartlagerfliken. <br><br> <b>Ta bort från snabbåtkomst:</b> lagret finns redan som snabbåtkomst och kommer att tas bort från snabbåtkomstmenyn under kartlagerfliken.",
  },
  {
    title: "Flikar i lagerhanteraren",
    element: "#layer-switcher-tab-panel",
    intro: () =>
      `Klicka här för att växla mellan olika vyer: <br><br> - Kartlager <br> - Bakgrund <br>${layerSwitcherPlugin.options.showDrawOrderView ? "- Ritordning: Här kan du ändra ritordningen för aktiverade lager i kartan" : ""}`,
  },
  {
    title: "Ritordning",
    element: "#draw-order-tab",
    intro:
      "Klicka på Ritordnings-fliken för att se och ändra ritordningen för lagren.",
  },
  {
    title: "Aktivera systemlager",
    element: "#draw-order-switch",
    intro:
      "Klicka för att visa systemlager i lagerlistan och ändra ritordningen för lager som genereras av verktyg.",
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
      "Klicka på kebabmenyn i snabbåtkomst.<br><br> <b>Menyn innehåller funktioner som:</b> <br> - Lägg till aktiverade lager <br> - Rensa allt",
  },
  {
    title: "Meny med alternativ för snabbåtkomst",
    element: "#quick-access-menu-content",
    intro:
      "<b>Lägg till aktiverade lager:</b> Klicka för att lägga till alla aktiverade lager i snabbåtkomst. <br><br> <b>Rensa allt:</b> Klicka för att rensa alla lager i snabbåtkomst.",
  },
  {
    title: "Mina favoriter",
    element: "#favorites-menu-button",
    intro:
      "Klicka på favoriter-knappen. <br><br> Menyn innehåller funktioner för att spara till favoriter, redigera favoriter och ladda favoriter.",
  },
  {
    title: "Meny för favoriter",
    element: "#favorites-menu",
    intro:
      "Knappen öppnar en meny med verktyg för att gruppera och spara lager i snabbåtkomst (mina favoriter): <br><br> - <b>Spara till favoriter:</b> Sparar en grupp som innehåller ett eller flera lager. Titel och beskrivning av denna grupp kan anpassas. <i>Observera att favoriter endast sparas tillfälligt och lokalt för dig</i>. <br><br> - <b>Redigera favoriter:</b> Hantera sparade lager. <br><br> - <b>Ladda favorit:</b> Vid laddning ersätts lagren i snabbåtkomst. Alla aktiverade lager i kartan inaktiveras och ersätts med favoritens aktiverade lager.",
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
    title: "Knapp för att visa flera alternativ",
    element: "#favorites-list-options-button",
    intro:
      "Klicka på kebabmenyn för respektive favorit. <br><br> <b>Menyn innehåller funktioner som:</b> information om själva favoriten, redigera favoriten, ta bort favoriten och exportera favoriten som en .json-fil.",
  },
  {
    title: "Meny med olika alternativ för respektive favorit",
    element: "#favorites-list-options-menu",
    intro:
      "<b>Redigera:</b> Redigera titel och beskrivning för favoriter <br><br> <b>Ta bort:</b> Tar bort favoriten från listan <br><br> <b>Exportera:</b> Exporterar favoriten som en .json-fil",
  },
  {
    title: "Teman",
    element: "#quick-access-theme-button",
    intro:
      "Klicka på knappen för att visa teman. <br> Teman är fördefinierade lagergrupper skapade av Hajk-administratörer.",
  },
  {
    title: "Lista för teman",
    element: "#quick-access-presets-view",
    intro:
      "Här kan du se teman som är tillgängliga i kartan. <br><br> Klicka på ett tema för att aktivera alla lager i temat. <br><br> Du kan också söka efter teman i sökfältet.",
  },
  {
    title: "Slut",
    intro:
      "Detta är slutet av introduktionen. Vill du gå igenom introduktionen igen?<br><br>Klicka på knappen i kartkontrollpanelen på höger sida för att starta om introduktionen.",
  },
];
