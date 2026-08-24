/**
 * Catalogo de iconos en formato *dato* para morphicons.
 *
 * morphicons interpola geometria, asi que no consume componentes de
 * `lucide-react` sino los `IconNode` del paquete `lucide` (mismos trazos,
 * misma version). Los dos paquetes conviven a proposito: los iconos
 * estaticos siguen siendo componentes de `lucide-react` y solo los que
 * cambian de estado pasan por aqui.
 *
 * Se re-exportan con nombre de par (`ICONO.a` / `ICONO.b`) para que en el
 * sitio de uso se lea que hay una transicion, no dos iconos sueltos.
 */
import {
  Check,
  ChevronDown,
  ChevronUp,
  Circle,
  Eye,
  EyeOff,
  Maximize2,
  Menu,
  Minimize2,
  PanelLeft,
  PanelLeftClose,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
  MapPin,
  Fingerprint,
  Lightbulb,
  Scale,
  X,
} from "lucide";

export const ICON = {
  check: Check,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  circle: Circle,
  eye: Eye,
  eyeOff: EyeOff,
  maximize: Maximize2,
  menu: Menu,
  minimize: Minimize2,
  panelLeft: PanelLeft,
  panelLeftClose: PanelLeftClose,
  panelRightClose: PanelRightClose,
  panelRightOpen: PanelRightOpen,
  messageSquare: MessageSquare,
  mapPin: MapPin,
  fingerprint: Fingerprint,
  lightbulb: Lightbulb,
  scale: Scale,
  x: X,
} as const;

export type IconKey = keyof typeof ICON;
