export function composeResolveRequest<T extends object>(
  params: T,
): {
  query: string;
  headers: Record<string, string>;
};
export function entryPhaseFor(
  checkoutMode: "pay-first" | "questionnaire-first" | undefined,
  current: string | null | undefined,
): string | undefined;
