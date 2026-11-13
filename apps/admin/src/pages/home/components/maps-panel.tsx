import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useTranslation } from "react-i18next";
import { useMaps } from "../../../api/maps/hooks";
import type { Map as MapRecord } from "../../../api/maps/types";
import { useDefaultMap } from "../../../hooks/use-default-map";
import CreateMapDialog from "../../maps/components/create-map-dialog";
import DuplicateMapDialog from "../../maps/components/duplicate-map-dialog";
import MapCard from "./map-card";

const MAX_MAPS_SHOWN = 7;

const CARD_GRID_SIZE = { xs: 12, sm: 6, md: 4, lg: 3 };
const CARD_MIN_HEIGHT = 240;

function savedTime(map: MapRecord): number {
  const date = map.lastSavedDate ?? map.createdDate;
  return date ? new Date(date).getTime() : 0;
}

export default function MapsPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: maps = [], isLoading } = useMaps();
  const { defaultMap } = useDefaultMap();
  const [createOpen, setCreateOpen] = useState(false);
  const [duplicateSource, setDuplicateSource] = useState<MapRecord | null>(
    null,
  );

  const shownMaps = useMemo(
    () =>
      [...maps]
        .sort((a, b) => {
          if (a.name === defaultMap) return -1;
          if (b.name === defaultMap) return 1;
          return savedTime(b) - savedTime(a);
        })
        .slice(0, MAX_MAPS_SHOWN),
    [maps, defaultMap],
  );

  return (
    <Box component="section" aria-labelledby="home-maps-title">
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
      >
        <Typography id="home-maps-title" variant="h6" component="h2">
          {t("common.maps")}
        </Typography>
        <Button
          component={Link}
          to="/maps"
          size="small"
          endIcon={<ArrowForwardIcon />}
        >
          {t("home.allMaps")}
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => (
              <Grid key={index} size={CARD_GRID_SIZE}>
                <Skeleton variant="rounded" height={CARD_MIN_HEIGHT} />
              </Grid>
            ))
          : shownMaps.map((map) => (
              <Grid key={map.id} size={CARD_GRID_SIZE}>
                <MapCard
                  map={map}
                  isDefault={map.name === defaultMap}
                  onDuplicate={setDuplicateSource}
                />
              </Grid>
            ))}
        <Grid size={CARD_GRID_SIZE}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              minHeight: CARD_MIN_HEIGHT,
              borderStyle: "dashed",
              borderWidth: 2,
              bgcolor: "transparent",
            }}
          >
            <CardActionArea
              onClick={() => setCreateOpen(true)}
              sx={{ height: "100%", minHeight: CARD_MIN_HEIGHT }}
            >
              <Stack
                spacing={1}
                sx={{ alignItems: "center", color: "primary.main" }}
              >
                <AddIcon fontSize="large" />
                <Typography variant="subtitle2">
                  {t("map.createMap")}
                </Typography>
              </Stack>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      <CreateMapDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        baseRoute="/maps"
        existingMaps={maps}
      />
      <DuplicateMapDialog
        open={duplicateSource !== null}
        sourceMap={duplicateSource}
        existingMaps={maps}
        onClose={() => setDuplicateSource(null)}
        onDuplicated={(map) => {
          if (map.id != null) {
            void navigate(`/maps/${map.id}`);
          }
        }}
      />
    </Box>
  );
}
