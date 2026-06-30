import type { ReactNode } from "react";

export type UnknownTransactionStateProps = { children?: ReactNode; status?: string };

export function UnknownTransactionState({ children, status }: UnknownTransactionStateProps) {
  return <div data-component="UnknownTransactionState" data-status={status}>{children}</div>;
}
