import type { ReactNode } from "react";

export type ManualReviewStateProps = { children?: ReactNode; status?: string };

export function ManualReviewState({ children, status }: ManualReviewStateProps) {
  return <div data-component="ManualReviewState" data-status={status}>{children}</div>;
}
