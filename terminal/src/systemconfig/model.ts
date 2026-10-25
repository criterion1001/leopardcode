import type { ModelOption } from "../dto/model";

export const MODEL_OPTIONS: ModelOption[] = [
  { id: 2, label: "Groq GPT-OSS 120B" },
  { id: 3, label: "Claude Fable 5" },
  { id: 4, label: "Kimi K2.6" },
  { id: 5, label: "DeepSeek Chat" },
  { id: 7, label: "OpenRouter Auto" },
];

export function isFundedModel(_model_id: number): boolean {
  return false;
}
