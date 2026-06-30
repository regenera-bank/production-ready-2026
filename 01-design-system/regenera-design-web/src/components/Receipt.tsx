import type { ReactNode } from "react";

export type ReceiptProps = { children?: ReactNode; status?: string };

export function Receipt({ children, status }: ReceiptProps) {
  return <div data-component="Receipt" data-status={status}>{children}</div>;
}
