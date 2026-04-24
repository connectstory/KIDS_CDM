import { createTheme } from "@mui/material";

const GLOBAL_FONT_SIZE = 14;
const GLOBAL_INPUT_HEIGHT = 35;
// const GLOBAL_TEXT_FIELD_MAX_HEIGHT = 300;

export const theme = createTheme({
  palette: {
    primary: { main: "#087c80" },
    text: {
      primary: "#1e2124", // 전역 기본 텍스트 색상 (CSS 변수 --main-font-color와 동일)
    },
  },
  typography: {
    fontSize: GLOBAL_FONT_SIZE,
    fontFamily: ["Pretendard GOV", "system-ui", "Avenir", "Helvetica", "Arial", "sans-serif"].join(","),
    mainTitle: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: "1",
    },
    subtitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      lineHeight: "1",
    },
    default: {
      fontSize: "1rem",
      fontWeight: 400,
    },
    description: {
      fontSize: "1rem",
      fontWeight: 400,
      color: "#666",
    },
    menuTitle: {
      fontSize: "1.05rem",
      fontWeight: 600,
      lineHeight: "1",
    },
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: "1",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      lineHeight: "1",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 700,
      lineHeight: "1",
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 700,
      lineHeight: "1",
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 700,
      lineHeight: "1",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 700,
      lineHeight: "1",
    },
    body1: {
      fontSize: "1.1rem",
      fontWeight: 400,
    },
    body2: {
      fontSize: "1rem",
      fontWeight: 400,
    },
    body3: {
      fontSize: "0.95rem",
      fontWeight: 400,
    },
    body4: {
      fontSize: "0.85rem",
      fontWeight: 400,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: { fontSize: "14px" },
        body: { fontSize: "1rem" },
        pre: {
          fontFamily: "inherit", // <- 핵심
        },
        ".MuiPickersInputBase-sectionsContainer": {
          fontSize: "1rem !important",
        },
        // MUI DatePicker 배경색 설정
        ".MuiPickersInputBase-root": {
          backgroundColor: "var(--input-bg) !important",
        },
        ".MuiDateCalendar-root": {
          backgroundColor: "#fff",
        },
        ".MuiPickersPopper-paper": {
          backgroundColor: "#fff",
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        select: {
          height: GLOBAL_INPUT_HEIGHT, // 핵심 1) select 영역 높이
          display: "flex",
          alignItems: "center",
          paddingTop: 0, // 핵심 2) 위아래 패딩 제거
          paddingBottom: 0,
          boxSizing: "border-box",
          backgroundColor: "var(--input-bg)",
        },
        icon: {
          top: "50%", // 핵심 3) 아이콘 수직 정렬
          transform: "translateY(-50%)",
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          display: "flex",
          alignItems: "center",
          minHeight: GLOBAL_INPUT_HEIGHT,
          // maxHeight: GLOBAL_TEXT_FIELD_MAX_HEIGHT, // TextField 최대 화면 높이 설정
          boxSizing: "border-box",
          backgroundColor: "var(--input-bg) !important",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--input-border)", // 기본 border 색상
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--input-border-hover)", // hover 시 border 색상
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#087c80", // focus 시 border 색상 (primary color)
            borderWidth: "2px",
          },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": {
            borderColor: "#d32f2f", // error 시 border 색상
          },
          "& .MuiOutlinedInput-input": {
            paddingTop: 0,
            paddingBottom: 0,
            fontSize: "1rem", // TextField 글자 크기 설정
          },
          "& .MuiOutlinedInput-input::placeholder": {
            color: "#3d3d3d",
            opacity: 1,
          },
          "& .MuiOutlinedInput-input::-webkit-input-placeholder": {
            color: "#3d3d3d",
            opacity: 1,
          },
          "& .MuiOutlinedInput-input::-moz-placeholder": {
            color: "#3d3d3d",
            opacity: 1,
          },
          "& .MuiOutlinedInput-input:-ms-input-placeholder": {
            color: "#3d3d3d",
            opacity: 1,
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#3d3d3d",
          fontSize: "1rem",
        },
        outlined: {
          transform: "translate(14px, 7px) scale(1)",
          "&.MuiInputLabel-shrink": {
            transform: "translate(14px, -6px) scale(0.85)",
          },
        },
      },
    },

    MuiButton: {
      defaultProps: {
        disableElevation: true, // contained 그림자 비활성화
      },
      styleOverrides: {
        root: {
          fontSize: "1rem",
          boxShadow: "none",
          minHeight: "var(--inputbtn-height)",
          padding: "2px 15px",
          "&:hover": { boxShadow: "none" },
          "&:active": { boxShadow: "none" },
          "&.Mui-focusVisible": { boxShadow: "none" },
          "&.Mui-disabled": { boxShadow: "none" },
        },
        sizeSmall: {
          minHeight: "var(--inputbtn-height-sm)",
          padding: "1px 15px",
          fontSize: "0.85rem",
        },
        sizeLarge: {
          minHeight: "var(--inputbtn-height-lg)",
          padding: "2px 15px",
          fontSize: "1.1rem",
        },
      },
      variants: [
        // =========================
        // size xsmall (custom)
        // =========================
        {
          props: { size: "xsmall" },
          style: {
            minWidth: "var(--inputbtn-width-xs)",
            minHeight: "var(--inputbtn-height-xs)",
            padding: "1px 5px",
            fontSize: "0.85rem",
          },
        },
        // =========================
        // .btn_default
        // =========================
        {
          props: { variant: "contained" },
          style: {
            color: "#fff",
            backgroundColor: "var(--btn_color_01)",
            border: "1px solid var(--btn_color_01)",
            "&:hover": {
              opacity: 0.9,
              backgroundColor: "var(--btn_color_01)",
              border: "1px solid var(--btn_color_01)",
            },
            "&.Mui-disabled": {
              color: "#fff",
              background: "var(--disabled_bg)",
              border: "1px solid var(--disabled_bg)",
            },
          },
        },

        // =========================
        // .btn_default.type02
        // =========================
        {
          props: { variant: "containedGray" },
          style: {
            color: "#fff",
            backgroundColor: "var(--btn_color_02)",
            border: "1px solid var(--btn_color_02)",
            "&:hover": {
              opacity: 0.9,
              backgroundColor: "var(--btn_color_02)",
              border: "1px solid var(--btn_color_02)",
            },
            "&.Mui-disabled": {
              color: "#fff",
              background: "var(--disabled_bg)",
              border: "1px solid var(--disabled_bg)",
            },
          },
        },

        // =========================
        // .btn_outline
        // =========================
        {
          props: { variant: "outlined" },
          style: {
            backgroundColor: "#fff",
            color: "var(--btn_color_01)",
            border: "1px solid var(--btn_color_01)",
            "&:hover": {
              backgroundColor: "#fff",
              border: "1px solid var(--btn_color_01)",
            },
            "&.Mui-disabled": {
              color: "var(--disabled_bg)",
              backgroundColor: "#fff",
              border: "1px solid var(--disabled_bg)",
            },
          },
        },

        // =========================
        // .btn_outline.type03
        // =========================
        {
          props: { variant: "containedLight" },
          style: {
            color: "var(--btn_color_01)",
            backgroundColor: "var(--btn_color_04)",
            border: "1px solid var(--btn_border_color_01)",
            "&:hover": {
              opacity: 0.9,
              backgroundColor: "var(--btn_color_04)",
              border: "1px solid var(--btn_border_color_01)",
            },
            "&.Mui-disabled": {
              color: "#fff",
              background: "var(--disabled_bg)",
              border: "1px solid var(--disabled_bg)",
            },
          },
        },
      ],
    },

    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          fontSize: "1rem", // 14px (html font-size가 14px이므로 1rem = 14px)
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        input: {
          "&::placeholder": {
            fontSize: "1rem", // 14px (html font-size가 14px이므로 1rem = 14px)
            color: "#3d3d3d",
            opacity: 1,
          },
          "&::-webkit-input-placeholder": {
            fontSize: "1rem",
            color: "#3d3d3d",
            opacity: 1,
          },
          "&::-moz-placeholder": {
            fontSize: "1rem",
            color: "#3d3d3d",
            opacity: 1,
          },
          "&:-ms-input-placeholder": {
            fontSize: "1rem",
            color: "#3d3d3d",
            opacity: 1,
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#000",
          fontSize: "1rem", // 전역 폰트 크기 (html 14px 기준 1rem = 14px)
        },
        arrow: {
          color: "#000000",
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          // boxShadow: "none",
        },
      },
    },

    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: "1rem",
        },
      },
    },

    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
  },
});
