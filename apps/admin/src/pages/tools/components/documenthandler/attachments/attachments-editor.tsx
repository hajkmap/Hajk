import { Box, Button, Divider, IconButton, TextField, Typography } from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { Control, Controller, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";

export interface Attachment {
  name: string;
  link: string;
}

const EMPTY_ATTACHMENT: Attachment = { name: "", link: "" };

function toAttachment(item: unknown): Attachment {
  if (typeof item !== "object" || item === null) {
    return { ...EMPTY_ATTACHMENT };
  }

  const record = item as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : "",
    link: typeof record.link === "string" ? record.link : "",
  };
}

function normalizeAttachments(value: unknown): Attachment[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  return value.map(toAttachment);
}

interface AttachmentsEditorProps {
  control: Control<FieldValues>;
}

export function AttachmentsEditor({ control }: AttachmentsEditorProps) {
  const { t } = useTranslation();

  return (
    <Controller
      name="options.pdfLinks"
      control={control}
      render={({ field }) => {
        const attachments = normalizeAttachments(field.value);

        const updateAttachment = (
          index: number,
          key: keyof Attachment,
          value: string,
        ) => {
          const next = attachments.map((item, i) =>
            i === index ? { ...item, [key]: value } : item,
          );
          field.onChange(next);
        };

        const addRow = () => {
          field.onChange([...attachments, { ...EMPTY_ATTACHMENT }]);
        };

        const removeRow = (index: number) => {
          field.onChange(attachments.filter((_, i) => i !== index));
        };

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
                {t("tools.documenthandler.attachments.addAttachment")}
              </Button>
            </Box>

            <Divider />

            {attachments.map((attachment, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ minWidth: 24, textAlign: "right", flexShrink: 0 }}
                >
                  {index + 1}
                </Typography>
                <TextField
                  sx={{ flex: "1 1 220px", maxWidth: 280 }}
                  label={t("tools.documenthandler.attachments.nameLabel")}
                  placeholder={t(
                    "tools.documenthandler.attachments.namePlaceholder",
                  )}
                  value={attachment.name}
                  onChange={(event) =>
                    updateAttachment(index, "name", event.target.value)
                  }
                />
                <TextField
                  sx={{ flex: "1 1 250px", maxWidth: 400 }}
                  label={t("tools.documenthandler.attachments.linkLabel")}
                  placeholder={t(
                    "tools.documenthandler.attachments.linkPlaceholder",
                  )}
                  value={attachment.link}
                  onChange={(event) =>
                    updateAttachment(index, "link", event.target.value)
                  }
                />
                <IconButton
                  sx={{ flexShrink: 0 }}
                  aria-label={t(
                    "tools.documenthandler.attachments.removeAttachment",
                  )}
                  onClick={() => removeRow(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        );
      }}
    />
  );
}
