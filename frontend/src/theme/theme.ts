import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#137de2",
      dark: "#0869c5",
    },
    background: {
      default: "#ffffff",
    },
    text: {
      primary: "#303030",
      secondary: "#696969",
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
    button: {
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 16,
  },
});
