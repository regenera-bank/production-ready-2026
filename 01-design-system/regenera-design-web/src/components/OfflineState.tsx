import type { ReactNode } from "react";

export type OfflineStateProps = { children?: ReactNode; status?: string };

export function OfflineState({ children, status }: OfflineStateProps) {
  return <div data-component="OfflineState" data-status={status}>{children}</div>;
}
