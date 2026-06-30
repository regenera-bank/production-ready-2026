import type { ReactNode } from "react";

export type PartialLoadingStateProps = { children?: ReactNode; status?: string };

export function PartialLoadingState({ children, status }: PartialLoadingStateProps) {
  return <div data-component="PartialLoadingState" data-status={status}>{children}</div>;
}
