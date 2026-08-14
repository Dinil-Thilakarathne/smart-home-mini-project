export type FeedbackTone = "success" | "warning" | "danger" | "info" | "neutral";

export const statusColors: Record<FeedbackTone, { surface: string; border: string; text: string; strong: string }> = {
  success: { surface: "#E1F3E8", border: "#B8DEC6", text: "#1E6240", strong: "#176B4D" },
  warning: { surface: "#FFF3DD", border: "#F2D49B", text: "#87530E", strong: "#A85A16" },
  danger: { surface: "#FDE8E5", border: "#F2C1B8", text: "#96382B", strong: "#B74737" },
  info: { surface: "#E7F0FA", border: "#BED5EF", text: "#245B87", strong: "#2D6A9F" },
  neutral: { surface: "#EEF1EE", border: "#D9E0DA", text: "#526057", strong: "#68766C" },
};

export function toneForAlert(severity: string): FeedbackTone {
  if (severity === "CRITICAL") return "danger";
  if (severity === "WARNING") return "warning";
  return "info";
}
