import { GridLocaleText } from "@mui/x-data-grid";

export const GRID_SWEDISH_LOCALE_TEXT: GridLocaleText = {
  // Root
  noRowsLabel: "Inga rader",
  noResultsOverlayLabel: "Inga resultat funna.",

  // Density selector toolbar button text
  toolbarDensity: "Densitet",
  toolbarDensityLabel: "Densitet",
  toolbarDensityCompact: "Kompakt",
  toolbarDensityStandard: "Standard",
  toolbarDensityComfortable: "Bekväm",

  // Columns selector toolbar button text
  toolbarColumns: "Kolumner",
  toolbarColumnsLabel: "Välj kolumner",

  // Filters toolbar button text
  toolbarFilters: "Filter",
  toolbarFiltersLabel: "Visa filter",
  toolbarFiltersTooltipHide: "Dölj filter",
  toolbarFiltersTooltipShow: "Visa filter",
  toolbarFiltersTooltipActive: (count) =>
    count !== 1 ? `${count} aktiva filter` : `${count} aktivt filter`,

  // Quick filter toolbar field
  toolbarQuickFilterPlaceholder: "Sök…",
  toolbarQuickFilterLabel: "Sök",
  toolbarQuickFilterDeleteIconLabel: "Rensa",

  // Export selector toolbar button text
  toolbarExport: "Exportera",
  toolbarExportLabel: "Exportera",
  toolbarExportCSV: "Ladda ner som CSV",
  toolbarExportPrint: "Skriv ut",
  toolbarExportExcel: "Ladda ner som Excel",

  // Columns management text
  columnsManagementSearchTitle: "Sök",
  columnsManagementNoColumns: "Inga kolumner",
  columnsManagementShowHideAllText: "Visa/Dölj alla",
  columnsManagementReset: "Återställ",

  // Filter panel text
  filterPanelAddFilter: "Lägg till filter",
  filterPanelRemoveAll: "Ta bort alla",
  filterPanelDeleteIconLabel: "Radera",
  filterPanelLogicOperator: "Logisk operator",
  filterPanelOperator: "Operator",
  filterPanelOperatorAnd: "Och",
  filterPanelOperatorOr: "Eller",
  filterPanelColumns: "Kolumner",
  filterPanelInputLabel: "Värde",
  filterPanelInputPlaceholder: "Filtervärde",

  // Filter operators text
  filterOperatorContains: "innehåller",
  filterOperatorDoesNotContain: "innehåller inte",
  filterOperatorEquals: "lika med",
  filterOperatorDoesNotEqual: "inte lika med",
  filterOperatorStartsWith: "börjar med",
  filterOperatorEndsWith: "slutar med",
  filterOperatorIs: "är",
  filterOperatorNot: "är inte",
  filterOperatorAfter: "är efter",
  filterOperatorOnOrAfter: "är på eller efter",
  filterOperatorBefore: "är före",
  filterOperatorOnOrBefore: "är på eller före",
  filterOperatorIsEmpty: "är tom",
  filterOperatorIsNotEmpty: "är inte tom",
  filterOperatorIsAnyOf: "är något av",
  "filterOperator=": "=",
  "filterOperator!=": "!=",
  "filterOperator>": ">",
  "filterOperator>=": ">=",
  "filterOperator<": "<",
  "filterOperator<=": "<=",

  // Header filter operators text
  headerFilterOperatorContains: "Innehåller",
  headerFilterOperatorDoesNotContain: "Innehåller inte",
  headerFilterOperatorEquals: "Lika med",
  headerFilterOperatorDoesNotEqual: "Inte lika med",
  headerFilterOperatorStartsWith: "Börjar med",
  headerFilterOperatorEndsWith: "Slutar med",
  headerFilterOperatorIs: "Är",
  headerFilterOperatorNot: "Är inte",
  headerFilterOperatorAfter: "Är efter",
  headerFilterOperatorOnOrAfter: "Är på eller efter",
  headerFilterOperatorBefore: "Är före",
  headerFilterOperatorOnOrBefore: "Är på eller före",
  headerFilterOperatorIsEmpty: "Är tom",
  headerFilterOperatorIsNotEmpty: "Är inte tom",
  headerFilterOperatorIsAnyOf: "Är något av",
  "headerFilterOperator=": "Lika med",
  "headerFilterOperator!=": "Inte lika med",
  "headerFilterOperator>": "Större än",
  "headerFilterOperator>=": "Större än eller lika med",
  "headerFilterOperator<": "Mindre än",
  "headerFilterOperator<=": "Mindre än eller lika med",

  // Filter values text
  filterValueAny: "något",
  filterValueTrue: "sant",
  filterValueFalse: "falskt",

  // Column menu text
  columnMenuLabel: "Meny",
  columnMenuShowColumns: "Visa kolumner",
  columnMenuManageColumns: "Hantera kolumner",
  columnMenuFilter: "Filter",
  columnMenuHideColumn: "Dölj kolumn",
  columnMenuUnsort: "Ta bort sortering",
  columnMenuSortAsc: "Sortera stigande",
  columnMenuSortDesc: "Sortera fallande",

  // Column header text
  columnHeaderFiltersTooltipActive: (count) =>
    count !== 1 ? `${count} aktiva filter` : `${count} aktivt filter`,
  columnHeaderFiltersLabel: "Visa filter",
  columnHeaderSortIconLabel: "Sortera",

  // Rows selected footer text
  footerRowSelected: (count) =>
    count !== 1
      ? `${count.toLocaleString()} rader valda`
      : `${count.toLocaleString()} rad vald`,

  // Total row amount footer text
  footerTotalRows: "Totalt antal rader:",

  // Total visible row amount footer text
  footerTotalVisibleRows: (visibleCount, totalCount) =>
    `${visibleCount.toLocaleString()} av ${totalCount.toLocaleString()}`,

  // Checkbox selection text
  checkboxSelectionHeaderName: "Kryssruteval",
  checkboxSelectionSelectAllRows: "Välj alla rader",
  checkboxSelectionUnselectAllRows: "Avmarkera alla rader",
  checkboxSelectionSelectRow: "Välj rad",
  checkboxSelectionUnselectRow: "Avmarkera rad",

  // Boolean cell text
  booleanCellTrueLabel: "ja",
  booleanCellFalseLabel: "nej",

  // Actions cell more text
  actionsCellMore: "mer",

  // Column pinning text
  pinToLeft: "Fäst till vänster",
  pinToRight: "Fäst till höger",
  unpin: "Lossa",

  // Tree Data
  treeDataGroupingHeaderName: "Grupp",
  treeDataExpand: "visa barn",
  treeDataCollapse: "dölj barn",

  // Grouping columns
  groupingColumnHeaderName: "Grupp",
  groupColumn: (name) => `Gruppera efter ${name}`,
  unGroupColumn: (name) => `Sluta gruppera efter ${name}`,

  // Master/detail
  detailPanelToggle: "Detaljpanelens omkopplare",
  expandDetailPanel: "Expandera",
  collapseDetailPanel: "Minimera",

  // Used core components translation keys
  MuiTablePagination: {
    labelDisplayedRows: ({ from, to, count }) =>
      `${from} - ${to} av ${count === -1 ? `mer än ${to}` : count}`,
    labelRowsPerPage: "Rader per sida:",
  },

  // Row reordering text
  rowReorderingHeaderName: "Ombeställning av rader",

  // Aggregation
  aggregationMenuItemHeader: "Aggregation",
  aggregationFunctionLabelSum: "summa",
  aggregationFunctionLabelAvg: "medel",
  aggregationFunctionLabelMin: "min",
  aggregationFunctionLabelMax: "max",
  aggregationFunctionLabelSize: "storlek",
};
