import type { ReactNode } from "react";

export type TimeoutStateProps = { children?: ReactNode; status?: string };

export function TimeoutState({ children, status }: TimeoutStateProps) {
  return <div data-component="TimeoutState" data-status={status}>{children}</div>;
}
