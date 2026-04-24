import { faGear, faMagnifyingGlass, faPlus, faUser, faXmark } from "@fortawesome/free-solid-svg-icons";

export const ICONS = {
  user: faUser,
  settings: faGear,
  close: faXmark,
  add: faPlus,
  search: faMagnifyingGlass,
} as const;

export type IconName = keyof typeof ICONS;
