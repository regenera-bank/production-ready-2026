import type { ReactNode } from "react";

export type MoneyInputProps = { children?: ReactNode; status?: string };

export function MoneyInput({ children, status }: MoneyInputProps) {
  return <div data-component="MoneyInput" data-status={status}>{children}</div>;
}
