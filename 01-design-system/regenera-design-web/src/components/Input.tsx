import type { ReactNode } from "react";

export type InputProps = { children?: ReactNode; status?: string };

export function Input({ children, status }: InputProps) {
  return <div data-component="Input" data-status={status}>{children}</div>;
}
