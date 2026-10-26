export const BG_BLACK = "black";
export const BG_PANEL = "#17130E";

import { isQuestionnaireEntry } from "./display_entry";

const BG_USER = "#F0E6D4";

const ROLE_COLOR: Record<string, string> = {
  user: "#0F0D0A",
  assistant: "#F0E6D4",
  system: "#E3A32F",
  error: "#FF6B4A",
};

export function roleColor(role: string): string {
  return ROLE_COLOR[role] ?? ROLE_COLOR.assistant;
}

export function entryPanelBg(role: string, content: string): string | undefined {
  if (role === "user") {
    return BG_USER;
  }
  if (isQuestionnaireEntry(role, content)) {
    return BG_PANEL;
  }
  return undefined;
}
