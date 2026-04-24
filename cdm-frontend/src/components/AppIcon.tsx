import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ICONS, type IconName } from "@/utils/icons";

type Props = {
  name: IconName;
  className?: string;
  spin?: boolean;
};

export function AppIcon({ name, className, spin }: Props) {
  const icon: IconProp = ICONS[name];
  return <FontAwesomeIcon icon={icon} className={className} spin={spin} />;
}
