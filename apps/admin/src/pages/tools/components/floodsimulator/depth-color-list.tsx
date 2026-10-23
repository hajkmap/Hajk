import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";
import FormColorPicker from "../../../../components/form-components/form-color-picker";

export interface DepthColorStop {
  maxDepth: number;
  color: string;
}

function formatDepth(value: number): string {
  return Number.isFinite(value) ? String(Number(value.toFixed(2))) : "?";
}

export default function DepthColorList({
  stops,
  onChange,
}: {
  stops: DepthColorStop[];
  onChange: (stops: DepthColorStop[]) => void;
}) {
  const { t } = useTranslation();

  const legend = (index: number) => {
    const previous = index === 0 ? 0 : stops[index - 1]?.maxDepth;
    const from = formatDepth(previous);
    if (index === stops.length - 1 && stops.length > 1) {
      return t("tools.floodsimulator.depthLegendAbove", { from });
    }
    return t("tools.floodsimulator.depthLegendRange", {
      from,
      to: formatDepth(stops[index]?.maxDepth),
    });
  };

  const warnings = stops.flatMap((stop, index) => {
    const messages: string[] = [];
    if (!(stop.maxDepth > 0)) {
      messages.push(
        t("tools.floodsimulator.depthClassInvalid", { index: index + 1 }),
      );
    }
    const previous = stops[index - 1]?.maxDepth;
    if (index > 0 && stop.maxDepth <= previous) {
      messages.push(
        t("tools.floodsimulator.depthClassOrder", { index: index + 1 }),
      );
    }
    return messages;
  });

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {t("tools.floodsimulator.depthClasses")}
      </Typography>
      <Stack spacing={1}>
        {stops.map((stop, index) => (
          <Stack
            key={index}
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <Typography variant="body2" sx={{ width: 110, flexShrink: 0 }}>
              {legend(index)}
            </Typography>
            <TextField
              label={t("tools.floodsimulator.depthMax")}
              type="number"
              size="small"
              value={Number.isFinite(stop.maxDepth) ? stop.maxDepth : ""}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                const next = stops.map((item, itemIndex) =>
                  itemIndex === index
                    ? {
                        ...item,
                        maxDepth: Number.isFinite(parsed) ? parsed : Number.NaN,
                      }
                    : item,
                );
                onChange(next);
              }}
              sx={{ width: 140 }}
            />
            <Box sx={{ width: 180 }}>
              <FormColorPicker
                label={legend(index)}
                value={stop.color}
                onChange={(color) =>
                  onChange(
                    stops.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, color } : item,
                    ),
                  )
                }
              />
            </Box>
            <IconButton
              aria-label={t("common.delete")}
              onClick={() => onChange(stops.filter((_, itemIndex) => itemIndex !== index))}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      {warnings.map((warning) => (
        <Typography key={warning} variant="body2" color="warning.main" sx={{ mt: 1 }}>
          {warning}
        </Typography>
      ))}
      <Button
        startIcon={<AddIcon />}
        variant="outlined"
        sx={{ mt: 1 }}
        onClick={() => {
          const last = stops[stops.length - 1]?.maxDepth;
          onChange([
            ...stops,
            {
              maxDepth: Number.isFinite(last) ? last + 0.5 : 0.5,
              color: "#6baed6",
            },
          ]);
        }}
      >
        {t("common.add")}
      </Button>
    </Box>
  );
}
