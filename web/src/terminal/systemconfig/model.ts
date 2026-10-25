import type { ModelOption } from "../dto/model";

export const PROVIDED_MODEL_ID = 6;

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 2, label: "Groq GPT-OSS 120B" },
  { id: 3, label: "Claude Fable 5" },
  { id: 4, label: "Kimi K2.6" },
  { id: 5, label: "DeepSeek Chat" },
  { id: PROVIDED_MODEL_ID, label: "DeepSeek Flash (provided)" },
  { id: 7, label: "OpenRouter Auto" },
];

export function isProvidedModel(model_id: number): boolean {
  return model_id === PROVIDED_MODEL_ID;
}

export function isFundedModel(model_id: number): boolean {
  return model_id === PROVIDED_MODEL_ID;
}
