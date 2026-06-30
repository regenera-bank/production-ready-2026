import type { ReactNode } from "react";

export type DataMaskProps = { children?: ReactNode; status?: string };

export function DataMask({ children, status }: DataMaskProps) {
  return <div data-component="DataMask" data-status={status}>{children}</div>;
}
