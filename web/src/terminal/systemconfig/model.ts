import type { ModelOption } from "../dto/model";

export const PROVIDED_MODEL_ID = 6;

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 2, label: "Nemotron 3.5 Super 120B" },
  { id: 3, label: "Nemotron 3.5 Lightning 30B" },
  { id: 4, label: "Nemotron 3 Ultra 550B" },
  { id: PROVIDED_MODEL_ID, label: "DeepSeek Flash (provided)" },
];

export function isProvidedModel(model_id: number): boolean {
  return model_id === PROVIDED_MODEL_ID;
}

export function isFundedModel(model_id: number): boolean {
  return MODEL_OPTIONS.some((option) => option.id === model_id);
}
