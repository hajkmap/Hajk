import { useTranslation } from "react-i18next";
import Page from "../layouts/root/components/page";
import {
  Grid2 as Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Skeleton,
  Box,
} from "@mui/material";
import { PieChart, LineChart, BarChart } from "@mui/x-charts";
import { Link } from "react-router";
import { useMaps } from "../api/maps/hooks";
import { useServices } from "../api/services/hooks";
import { useLayers } from "../api/layers/hooks";
import { useGroups } from "../api/groups/hooks";
import { useTools } from "../api/tools/hooks";
import { useUsers } from "../api/users/hooks";

function StatCard({
  title,
  count,
  to,
  loading,
}: {
  title: string;
  count: number;
  to: string;
  loading?: boolean;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="overline" color="text.secondary">
            {title}
          </Typography>
          {loading ? (
            <Skeleton variant="text" width={60} height={40} />
          ) : (
            <Typography variant="h3">{count}</Typography>
          )}
          <Button component={Link} to={to} variant="contained" size="small">
            View
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  children,
  chartCardHeight = "300px",
}: {
  title: string;
  children: React.ReactNode;
  chartCardHeight?: string;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ width: "100%", height: chartCardHeight }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

export default function IndexPage() {
  const { t } = useTranslation();

  const { data: maps, isLoading: mapsLoading } = useMaps();
  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: layers, isLoading: layersLoading } = useLayers();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const { data: tools, isLoading: toolsLoading } = useTools();
  const { data: users, isLoading: usersLoading } = useUsers();

  const isLoading =
    mapsLoading ||
    servicesLoading ||
    layersLoading ||
    groupsLoading ||
    toolsLoading ||
    usersLoading;

  const entityData = [
    { id: 0, value: maps?.length ?? 0, label: t("common.maps") },
    {
      id: 1,
      value: services?.length ?? 0,
      label: t("navBar.servicesAndLayers.serviceDefinitions"),
    },
    { id: 2, value: layers?.length ?? 0, label: t("common.layers") },
    { id: 3, value: groups?.length ?? 0, label: t("common.layerGroups") },
    { id: 4, value: tools?.length ?? 0, label: t("common.tools") },
    { id: 5, value: users?.length ?? 0, label: t("common.users") },
  ];

  const barData = entityData.map((item) => ({
    name: item.label,
    count: item.value,
  }));

  const trendData = [
    { month: "Jan", maps: 2, services: 5, layers: 15, users: 3 },
    { month: "Feb", maps: 3, services: 7, layers: 18, users: 4 },
    { month: "Mar", maps: 4, services: 8, layers: 22, users: 5 },
    { month: "Apr", maps: 5, services: 10, layers: 25, users: 6 },
    { month: "May", maps: 6, services: 12, layers: 28, users: 7 },
    { month: "Jun", maps: 7, services: 14, layers: 32, users: 8 },
  ];

  return (
    <Page title={t("common.home")}>
      {/* Main Card */}
      <Grid container spacing={2} size={{ xs: 12 }}>
        {/* Charts and Statistics Card */}
        <Grid container spacing={2} direction="column" size={{ xs: 8 }}>
          {/* Statistics Cards*/}
          <Grid container spacing={2} direction="column">
            {/* Statistics Cards 1 - 3*/}
            <Grid container>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatCard
                  title={t("common.maps")}
                  count={maps?.length ?? 0}
                  to="/maps"
                  loading={mapsLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatCard
                  title={t("navBar.servicesAndLayers.serviceDefinitions")}
                  count={services?.length ?? 0}
                  to="/services"
                  loading={servicesLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatCard
                  title={t("common.layers")}
                  count={layers?.length ?? 0}
                  to="/search-layers"
                  loading={layersLoading}
                />
              </Grid>
            </Grid>
            {/* Statistics Cards 4 - 6*/}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatCard
                  title={t("common.layerGroups")}
                  count={groups?.length ?? 0}
                  to="/groups"
                  loading={groupsLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatCard
                  title={t("common.tools")}
                  count={tools?.length ?? 0}
                  to="/tools"
                  loading={toolsLoading}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatCard
                  title={t("common.users")}
                  count={users?.length ?? 0}
                  to="/users"
                  loading={usersLoading}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Growth Trends Chart */}
          <Grid>
            <ChartCard
              title="Growth Trends (Last 6 Months)"
              chartCardHeight="500px"
            >
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" />
              ) : (
                <LineChart
                  dataset={trendData}
                  xAxis={[{ scaleType: "band", dataKey: "month" }]}
                  series={[
                    {
                      dataKey: "maps",
                      label: t("common.maps"),
                      area: true,
                      stack: "total",
                      showMark: false,
                    },
                    {
                      dataKey: "services",
                      label: t("navBar.servicesAndLayers.serviceDefinitions"),
                      area: true,
                      stack: "total",
                      showMark: false,
                    },
                    {
                      dataKey: "layers",
                      label: t("common.layers"),
                      area: true,
                      stack: "total",
                      showMark: false,
                    },
                    {
                      dataKey: "users",
                      label: t("common.users"),
                      area: true,
                      stack: "total",
                      showMark: false,
                    },
                  ]}
                />
              )}
            </ChartCard>
          </Grid>
        </Grid>
        {/* Entity Distribution and Counts Cards */}
        <Grid container size={{ xs: 4 }} direction="column" spacing={3}>
          <Grid>
            <ChartCard title="Entity Distribution" chartCardHeight="200px">
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" />
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <PieChart
                    series={[
                      {
                        data: entityData,
                        highlightScope: { fade: "global", highlight: "item" },
                        innerRadius: 30,
                        outerRadius: 90,
                        paddingAngle: 3,
                        cornerRadius: 6,
                        startAngle: -40,
                        endAngle: 250,
                      },
                    ]}
                    width={200}
                    height={200}
                  />
                </Box>
              )}
            </ChartCard>
          </Grid>
          <Grid>
            <ChartCard title="Entity Counts" chartCardHeight="200px">
              {isLoading ? (
                <Skeleton variant="rectangular" width="100%" />
              ) : (
                <BarChart
                  dataset={barData}
                  xAxis={[{ scaleType: "band", dataKey: "name" }]}
                  series={[{ dataKey: "count", color: "#1976d2" }]}
                />
              )}
            </ChartCard>
          </Grid>
        </Grid>
      </Grid>
    </Page>
  );
}
