import type { ReactNode } from "react";

export type RiskWarningProps = { children?: ReactNode; status?: string };

export function RiskWarning({ children, status }: RiskWarningProps) {
  return <div data-component="RiskWarning" data-status={status}>{children}</div>;
}
