import type { ReactNode } from "react";

export type EmptyStateProps = { children?: ReactNode; status?: string };

export function EmptyState({ children, status }: EmptyStateProps) {
  return <div data-component="EmptyState" data-status={status}>{children}</div>;
}
