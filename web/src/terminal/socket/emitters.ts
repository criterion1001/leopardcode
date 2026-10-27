import type { QuestionnaireAnswerDTO, ToolResultDTO } from "../dto/wire";
import { saveDisplayHistory } from "../save/config_writer";
import { commitSession } from "../session/user_data";
import { preparePrompt } from "../session/project_memory";
import { socket } from "./client";

export function emitUserPrompt(prompt: string): number {
  commitSession();
  saveDisplayHistory({ role: "user", content: prompt });
  const prepared = preparePrompt(prompt);
  socket.emit("user_prompt", prepared.wire_prompt);
  return prepared.recalled_count;
}

export function emitQuestionnaireAnswers(answers: QuestionnaireAnswerDTO[]) {
  socket.emit("questionnaire_answers", answers);
}

export function emitAgentErrorResponse(message: string) {
  socket.emit("agent_error_response", message);
}

export function emitToolResult(result: ToolResultDTO) {
  socket.emit("tool_result", result);
}
