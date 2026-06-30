import type { ReactNode } from "react";

export type ConfirmationProps = { children?: ReactNode; status?: string };

export function Confirmation({ children, status }: ConfirmationProps) {
  return <div data-component="Confirmation" data-status={status}>{children}</div>;
}
