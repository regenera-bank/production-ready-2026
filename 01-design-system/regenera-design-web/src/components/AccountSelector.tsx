import type { ReactNode } from "react";

export type AccountSelectorProps = { children?: ReactNode; status?: string };

export function AccountSelector({ children, status }: AccountSelectorProps) {
  return <div data-component="AccountSelector" data-status={status}>{children}</div>;
}
