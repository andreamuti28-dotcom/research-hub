import {
  Sparkles,
  Flower2,
  BookOpen,
  Mountain,
  Camera,
  Music,
  Coffee,
  Bike,
  Code2,
  Palette,
  Plane,
  Dumbbell,
  Gamepad2,
  Utensils,
  Film,
  Headphones,
  PenTool,
  Leaf,
  Heart,
  Star,
  type LucideIcon,
} from "lucide-react";

export const HOBBY_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  Flower2,
  BookOpen,
  Mountain,
  Camera,
  Music,
  Coffee,
  Bike,
  Code2,
  Palette,
  Plane,
  Dumbbell,
  Gamepad2,
  Utensils,
  Film,
  Headphones,
  PenTool,
  Leaf,
  Heart,
  Star,
};

export const HOBBY_ICON_NAMES = Object.keys(HOBBY_ICONS);

export function getHobbyIcon(name: string): LucideIcon {
  return HOBBY_ICONS[name] ?? Sparkles;
}
