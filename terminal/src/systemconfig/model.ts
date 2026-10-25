import type { ModelOption } from "../dto/model";

const FUNDED_MODEL_IDS: number[] = [];

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 2, label: "Nemotron 3.5 Super 120B" },
  { id: 3, label: "Nemotron 3.5 Lightning 30B" },
  { id: 4, label: "Nemotron 3 Ultra 550B" },
];

export function isFundedModel(model_id: number): boolean {
  return FUNDED_MODEL_IDS.includes(model_id);
}
