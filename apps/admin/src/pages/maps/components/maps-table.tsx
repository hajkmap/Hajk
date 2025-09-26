import { useMemo, useState } from "react";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import MoreIcon from "@mui/icons-material/More";

import { useTranslation } from "react-i18next";
import { useDebounce } from "use-debounce";

import { Map } from "../../../api/maps";
import { useMaps } from "../../../api/maps/hooks";
import MapListFilterPanel from "./map-list-filter-panel";
import { useNavigate } from "react-router";
import StyledDataGrid  from "../../../components/data-grid";

export default function MapsTable() {
  const { t } = useTranslation();
  const { data: maps, isLoading: mapsLoading } = useMaps();

  const [searchString, setSearchString] = useState("");
  const [debouncedSearchString] = useDebounce(searchString, 200);

  const navigate = useNavigate();

  const columns: GridColDef<Map>[] = [
    { field: "name", flex: 1, headerName: t("map.name") },
    {
      field: "description",
      flex: 1,
      headerName: t("map.description"),
      valueGetter: (_value, row) =>
        row.options?.description ?? "(to be implemented)",
    },
    {
      field: "title",
      flex: 1,
      headerName: t("map.title"),
      valueGetter: (_value, row) => {
        return row.options?.title;
      },
    },
    { field: "locked", flex: 1, headerName: t("map.locked") },
    {
      field: "more",
      headerName: "",
      flex: 0.2,
      renderCell: (_params: GridRenderCellParams<Map, string>) => (
        <Button
          color="info"
          size="small"
          //   onClick={() => {}}
        >
          <MoreIcon />
        </Button>
      ),
    },
  ];

  const filteredMaps: readonly Map[] = useMemo(() => {
    return !maps
      ? []
      : maps.filter((map) => {
          return (
            debouncedSearchString === "" ||
            Object.values(map).some((value) => {
              return (
                (typeof value === "string" &&
                  value
                    .toLowerCase()
                    .includes(debouncedSearchString.toLowerCase())) ||
                (value &&
                  typeof value === "object" &&
                  Object.values(map).some(
                    (v) =>
                      typeof v === "string" &&
                      v
                        .toLowerCase()
                        .includes(debouncedSearchString.toLowerCase())
                  )) ||
                // TODO: This filters on ALL properties inside the options object.
                // Probably not what we want, so we need to fix this at some point
                // and limit to perhaps "description", "title" and maybe something more.
                (typeof map === "object" &&
                  typeof map.options === "object" &&
                  Object.values(map.options).some(
                    (v) =>
                      typeof v === "string" &&
                      v
                        .toLowerCase()
                        .includes(debouncedSearchString.toLowerCase())
                  ))
              );
            })
          );
        });
  }, [maps, debouncedSearchString]);

  return (
    <>
      <MapListFilterPanel
        searchString={searchString}
        setSearchString={setSearchString}
      />
      <StyledDataGrid<Map>
        onRowClick={({ row }) => {
          const id: string = (row as Map).id;
          if (id) {
            void navigate(`/maps/${id}`);
          }
        }}
        rows={filteredMaps}
        columns={columns}
        loading={mapsLoading}
      />
    </>
  );
}
