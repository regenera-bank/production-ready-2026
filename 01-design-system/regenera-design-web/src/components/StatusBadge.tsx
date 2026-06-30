import type { ReactNode } from "react";

export type StatusBadgeProps = { children?: ReactNode; status?: string };

export function StatusBadge({ children, status }: StatusBadgeProps) {
  return <div data-component="StatusBadge" data-status={status}>{children}</div>;
}
