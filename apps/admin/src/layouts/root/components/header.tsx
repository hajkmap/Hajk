import Grid from "@mui/material/Grid2";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Divider,
  Paper,
  Popover,
  Typography,
  useTheme,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { useEffect, useState } from "react";
import { HEADER_HEIGHT, HEADER_ZINDEX } from "../constants";
import HajkTooltip from "../../../components/hajk-tooltip";

class DummyUser {
  public id: string;
  public name: string;
  public url: string;
  public email: string;

  constructor(id: string, name: string, url: string, email: string) {
    this.id = id;
    this.name = name;
    this.url = url;
    this.email = email;
  }
}

const getUserInitials = (user: DummyUser): string => {
  const words: string[] = user.name.split(" ");
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
};

export default function Header() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const [userList, setUserList] = useState<DummyUser[]>([]);
  const [activeUser, setActiveUser] = useState<DummyUser>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const testActiveUser: DummyUser = new DummyUser(
      "u55555",
      "Jesper Adddddd",
      "",
      "jesade-vbg@gmail.com"
    );

    setActiveUser(testActiveUser);

    setUserList(
      [
        new DummyUser("u11111", "Henrik H", "", "hh___@gmail.com"),
        new DummyUser("u22222", "Jacob W", "", "jw___@gmail.com"),
        new DummyUser("u33333", "Olof S", "", "os___@gmail.com"),
        new DummyUser("u44444", "Albin A", "", "aa___@gmail.com"),
        testActiveUser,
      ].filter((user) => user.id !== testActiveUser.id)
    );
  }, [setActiveUser, setUserList]);

  return (
    <Paper
      component="header"
      elevation={2}
      sx={{
        backgroundColor: palette.mode === "light" ? "#efefef" : "",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: HEADER_ZINDEX,
      }}
      square
    >
      <Grid
        container
        size={12}
        alignItems="center"
        direction={"row"}
        sx={{ width: "100%", height: `${HEADER_HEIGHT}px` }}
      >
        <Grid size={{ xs: 8, sm: 4 }} sx={{ fontSize: "0" }}>
          <Link
            to="/"
            style={{
              position: "relative",
              display: "inline-flex",
              marginLeft: "16px",
            }}
          >
            <img
              src="/hajk-admin-logo.svg"
              alt={t("common.clickableLogo")}
              style={{
                height: "32px",
                width: "auto",
                filter: `invert(${palette.mode === "light" ? 0 : 1})`,
                userSelect: "none",
              }}
            />
          </Link>
        </Grid>
        <Grid
          container
          size={{ xs: 4, sm: 8 }}
          justifyContent="flex-end"
          alignSelf="center"
          alignItems="center"
        >
          <AvatarGroup max={4} sx={{ display: { xs: "none", sm: "flex" } }}>
            {userList.map((user) => {
              return (
                <HajkTooltip
                  key={user.id}
                  title={user.name}
                  placement="bottom-end"
                >
                  <Avatar
                    key={user.id + "avatar"}
                    alt={user.name}
                    sx={{
                      width: "30px",
                      height: "30px",
                      fontSize: "0.9rem",
                      transition:
                        "transform 200ms ease, background-color 200ms ease",
                      "&:hover": {
                        backgroundColor: palette.primary.light,
                        transform:
                          "scale3d(1.12,1.12,1.12) translateX(3px) translateZ(0)",
                      },
                    }}
                  >
                    {getUserInitials(user)}
                  </Avatar>
                </HajkTooltip>
              );
            })}
          </AvatarGroup>
          {activeUser && (
            <HajkTooltip
              key={activeUser.id}
              title={activeUser.name + ` (${t("common.you")})`}
              placement="bottom-end"
            >
              <Avatar
                onClick={(e) => {
                  setAnchorEl(anchorEl ? null : e.currentTarget);
                }}
                key={activeUser.id}
                sx={{
                  backgroundColor: palette.primary.main,
                  width: "36px",
                  height: "36px",
                  marginLeft: "14px",
                  marginRight: "14px",
                  borderWidth: "2px",
                  borderStyle: "solid",
                  borderColor: palette.primary.light,
                  cursor: "pointer",
                  transition: "transform 200ms ease",
                  transform: "scale3d(1.0,1.0,1.0) translateZ(0)",
                  "&:hover": {
                    transform: "scale3d(1.12,1.12,1.12) translateZ(0)",
                  },
                }}
              >
                {getUserInitials(activeUser)}
              </Avatar>
            </HajkTooltip>
          )}

          <Popover
            sx={{ marginTop: "10px", minWidth: "0" }}
            anchorEl={anchorEl}
            open={anchorEl != null}
            onClose={() => setAnchorEl(null)}
            disableScrollLock={true}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
          >
            <Grid container sx={{ p: 1 }}>
              <Grid size={12}>
                <Box>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {activeUser?.name}
                  </Typography>
                </Box>
                <Box>{activeUser?.email}</Box>
                <Divider sx={{ mb: 1, mt: 1 }} />
              </Grid>
              <Grid size={12} sx={{ textAlign: "right" }}>
                <Button startIcon={<SettingsIcon />}>
                  {t("common.settings")}
                </Button>
              </Grid>
            </Grid>
          </Popover>
        </Grid>
      </Grid>
    </Paper>
  );
}
