import type { ReactNode } from "react";

export type LoadingStateProps = { children?: ReactNode; status?: string };

export function LoadingState({ children, status }: LoadingStateProps) {
  return <div data-component="LoadingState" data-status={status}>{children}</div>;
}
