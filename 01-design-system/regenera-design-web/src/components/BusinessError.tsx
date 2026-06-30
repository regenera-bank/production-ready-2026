import type { ReactNode } from "react";

export type BusinessErrorProps = { children?: ReactNode; status?: string };

export function BusinessError({ children, status }: BusinessErrorProps) {
  return <div data-component="BusinessError" data-status={status}>{children}</div>;
}
