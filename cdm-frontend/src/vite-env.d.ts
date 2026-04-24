/// <reference types="vite/client" />
import type * as React from "react";

// 빌드별 기본 로그인 분기용 (Router.tsx)
interface ImportMetaEnv {
  readonly VITE_APP_TARGET?: "admin" | "partner" | "mb";
}
import "@mui/material/styles";

declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.scss" {
  const content: { [className: string]: string };
  export default content;
}

declare module "*.module.scss" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

declare module "*.svg" {
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module "@mui/material/styles" {
  interface TypographyVariants {
    body3: React.CSSProperties;
    body4: React.CSSProperties;
    description: React.CSSProperties;
    subtitle: React.CSSProperties;
    headerTitle: React.CSSProperties;
    mainTitle: React.CSSProperties;
    menuTitle: React.CSSProperties;
    default: React.CSSProperties;
  }

  interface TypographyVariantsOptions {
    body3?: React.CSSProperties;
    body4?: React.CSSProperties;
    description?: React.CSSProperties;
    subtitle?: React.CSSProperties;
    headerTitle?: React.CSSProperties;
    mainTitle?: React.CSSProperties;
    menuTitle?: React.CSSProperties;
    default?: React.CSSProperties;
  }
}

declare module "@mui/material/Typography" {
  interface TypographyPropsVariantOverrides {
    body3: true;
    body4: true;
    description: true;
    subtitle: true;
    headerTitle: true;
    mainTitle: true;
    menuTitle: true;
    default: true;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsVariantOverrides {
    containedGray: true;
    containedLight: true;
  }
  interface ButtonPropsSizeOverrides {
    xsmall: true;
  }
}

declare module "@mui/material/Button/buttonClasses" {
  interface ButtonClasses {
    sizeXsmall: string;
  }
}
