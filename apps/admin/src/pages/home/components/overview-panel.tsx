import { useState } from "react";
import { Link } from "react-router";
import {
  Button,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";

export interface OverviewItem {
  title: string;
  count: number;
  to: string;
  loading?: boolean;
}

function StatCard({ title, count, to, loading }: OverviewItem) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={60} height={42} />
          ) : (
            <Typography variant="h4" component="p">
              {count}
            </Typography>
          )}
          <Button component={Link} to={to} variant="contained" size="small">
            View
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function OverviewPanel({ items }: { items: OverviewItem[] }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);

  return (
    <Card
      component="section"
      variant="outlined"
      aria-labelledby="home-overview-title"
    >
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          px: 2,
          py: 1.5,
        }}
      >
        <Typography id="home-overview-title" variant="h6" component="h2">
          {t("home.overview")}
        </Typography>
        <IconButton
          aria-label={t("home.toggleOverview")}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Stack>
      <Collapse in={expanded}>
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid key={item.to} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
                <StatCard {...item} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
}
