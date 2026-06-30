import type { ReactNode } from "react";

export type TransactionRowProps = { children?: ReactNode; status?: string };

export function TransactionRow({ children, status }: TransactionRowProps) {
  return <div data-component="TransactionRow" data-status={status}>{children}</div>;
}
