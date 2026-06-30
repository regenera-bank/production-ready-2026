import type { ReactNode } from "react";

export type ConsentProps = { children?: ReactNode; status?: string };

export function Consent({ children, status }: ConsentProps) {
  return <div data-component="Consent" data-status={status}>{children}</div>;
}
