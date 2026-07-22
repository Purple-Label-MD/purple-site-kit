import type { RenderedNode, RenderedOption } from "@/lib/purple/types";

export function optionsOf(node: Partial<RenderedNode> | null | undefined): RenderedOption[];
export function humanize(code: string): string;
export function exclusiveCodes(node: Partial<RenderedNode> | null | undefined): string[];
export function toggleMulti(
  selected: string[],
  node: Partial<RenderedNode>,
  code: string,
): string[];
export function resolveExclusive422(lastToggledCode: string | undefined): string[];
export function isContinueEnabled(
  node: Partial<RenderedNode> | null | undefined,
  selectedCount: number,
): boolean;
export function numberKeyIndex(key: string, optionCount: number): number;
export function isCardControl(control: string | undefined): boolean;
