## Legacy CSS triage

This project still carries a set of global legacy styles under `src/assets/css/`.
They are currently bundled via `src/assets/styles/app.scss` (see `layouts/admin.scss`).

### Files and suggested next steps

- **`src/assets/css/common.css`**
  - **role**: global tokens + shared utilities (contains lots of `:root` vars)
  - **next**: migrate CSS variables into `src/assets/styles/core/_tokens.scss` and remove duplicates

- **`src/assets/css/content.css`**
  - **role**: login & content page global styling
  - **next**: split into page-scoped modules (e.g. login page module) where feasible

- **`src/assets/css/layout.scss`**
  - **role**: admin content layout globals (`.content_wrap`, `.location`, ...)
  - **next**: move `AdminContentLayout`-specific styles into a CSS Module (or keep as `layouts/admin.scss` section)

- **`src/assets/css/community.css`, `src/assets/css/ckeditor.css`, `src/assets/css/cdm.css`**
  - **role**: feature-area globals (likely used across multiple screens)
  - **next**: gradually convert hot spots into CSS Modules; keep truly global resets/utilities only

- **`src/assets/css/global-aggrid.css`, `src/assets/css/global-aggridguard.css`**
  - **role**: vendor/widget global overrides
  - **next**: keep global; consider isolating to routes that use grids if bundle size becomes an issue

- **`src/assets/css/font.css`**
  - **role**: fonts
  - **next**: keep imported from `src/index.css`

- **`src/assets/css/partner-layout.scss`**
  - **role**: partner portal layout
  - **status**: tokens/mixins were extracted to `src/assets/styles/core/*`; remaining layout can be split into partials over time

