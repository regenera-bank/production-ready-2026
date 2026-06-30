import type { ReactNode } from "react";

export type TechnicalErrorProps = { children?: ReactNode; status?: string };

export function TechnicalError({ children, status }: TechnicalErrorProps) {
  return <div data-component="TechnicalError" data-status={status}>{children}</div>;
}
