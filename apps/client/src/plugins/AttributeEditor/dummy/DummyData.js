/* === Field descriptions === */
export const FIELD_META = [
  { key: "geoid", label: "geoid", readOnly: true },
  { key: "oracle_geoid", label: "oracle_geoid" },
  { key: "ar_typ", label: "ar_typ" },
  { key: "ar_andamal", label: "ar_andamal" },
  {
    key: "ar_status",
    label: "ar_status",
    type: "select",
    options: ["Aktiv", "Avslutad", "Okänd"],
  },
  { key: "ar_forman", label: "ar_forman" },
  { key: "ar_last", label: "ar_last" },
  { key: "ar_utbredning", label: "ar_utbredning" },
  { key: "ar_aktbeteckning", label: "ar_aktbeteckning" },
  { key: "ar_anteckning", label: "ar_anteckning", type: "textarea" },
  { key: "ar_dokumentlank", label: "ar_dokumentlank" },
  { key: "ar_datum", label: "ar_datum", type: "date" },
];

/* === Example data === */
export function createDummyFeatures() {
  const types = [
    "Registrerad nyttjanderätt",
    "Servitut",
    "Avtal",
    "Överenskommelse",
  ];
  const andamal = [
    "Ledningsrätt",
    "Teknisk anläggning",
    "Elstation",
    "Byggnadsbegränsning",
    "Miljöavtal",
    "Korridor 5m bred",
    "Väganslutning",
  ];
  const forman = [
    "Exempelkommun",
    "Myndighet A",
    "Fastighet A 14",
    "Fastighet B 2",
    "Fastighet C 13",
    "Område D",
  ];
  const last = [
    "Kommun Område 12:1",
    "Kommun Gatan 5",
    "Kvarter 3:223",
    "Fastighet A 21",
    "Område 1:80",
    "Fastighet B 5",
    "Fastighet C 15",
  ];

  const fmt = (d) => d.toISOString().slice(0, 10); // YYYY-MM-DD
  const addDays = (d, n) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const base = new Date(2023, 0, 15);

  const list = [];
  for (let i = 0; i < 17; i++) {
    list.push({
      id: i + 1,
      geoid: 13 + i,
      oracle_geoid: (i % 11) + 2,
      ar_typ: types[i % types.length],
      ar_andamal: andamal[i % andamal.length],
      ar_status: i % 9 === 0 ? "Avslutad" : "Aktiv",
      ar_forman: forman[i % forman.length],
      ar_last: last[i % last.length],
      ar_utbredning: i % 3 === 0 ? null : "",
      ar_aktbeteckning: `${12 + (i % 3)}/${22195 + i}`,
      ar_anteckning: i % 5 === 0 ? "Kontrollera dokumentation" : "",
      ar_dokumentlank: `${12 + (i % 3)}_${22195 + i}.PDF`,
      ar_datum: i % 4 === 0 ? null : fmt(addDays(base, i * 11)),
    });
  }
  return list;
}
