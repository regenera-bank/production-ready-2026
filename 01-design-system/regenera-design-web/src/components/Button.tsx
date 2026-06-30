import type { ReactNode } from "react";

export type ButtonProps = { children?: ReactNode; status?: string };

export function Button({ children, status }: ButtonProps) {
  return <div data-component="Button" data-status={status}>{children}</div>;
}
