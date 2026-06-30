import type { ReactNode } from "react";

export type StepUpAuthenticationProps = { children?: ReactNode; status?: string };

export function StepUpAuthentication({ children, status }: StepUpAuthenticationProps) {
  return <div data-component="StepUpAuthentication" data-status={status}>{children}</div>;
}
