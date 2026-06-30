import type { ReactNode } from "react";

export type MaintenanceStateProps = { children?: ReactNode; status?: string };

export function MaintenanceState({ children, status }: MaintenanceStateProps) {
  return <div data-component="MaintenanceState" data-status={status}>{children}</div>;
}
