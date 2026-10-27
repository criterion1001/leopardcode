import { Box, Text } from "ink";
import type { ReactNode } from "react";
import type { CommandEntry } from "../command/command_list";
import { QuestionnaireBox } from "../command/questionnaire_box";
import { SuggestionBox } from "../command/suggestion_box";
import type { StructuredQuestionDTO } from "../dto/wire";
import { LOGO_PROMPT_WIDTH, useScreenSize, WINDOW_PAD } from "../hooks/use_layout";
import { PromptBox } from "./prompt_box";
import { BG_BLACK } from "./theme";

const LOGO_BANNER_COLS = 90;
const LOGO_BANNER = [
  "██╗     ███████╗ ██████╗ ██████╗  █████╗ ██████╗ ██████╗  ██████╗ ██████╗ ██████╗ ███████╗",
  "██║     ██╔════╝██╔═══██╗██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝",
  "██║     █████╗  ██║   ██║██████╔╝███████║██████╔╝██║  ██║██║     ██║   ██║██║  ██║█████╗",
  "██║     ██╔══╝  ██║   ██║██╔═══╝ ██╔══██║██╔══██╗██║  ██║██║     ██║   ██║██║  ██║██╔══╝",
  "███████╗███████╗╚██████╔╝██║     ██║  ██║██║  ██║██████╔╝╚██████╗╚██████╔╝██████╔╝███████╗",
  "╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝",
].join("\n");

type LogoViewProps = {
  innerWidth: number;
  logoPromptWidth: number;
  promptMaxRows: number;
  suggestionOpen: boolean;
  commandMatches: CommandEntry[];
  selectedIdx: number;
  questionnaireActive: boolean;
  question: StructuredQuestionDTO;
  currentQuestion: number;
  totalQuestions: number;
  questionnaireFreeText: boolean;
  questionnaireDraft: string;
  onQuestionnaireDraftChange: (value: string) => void;
  onQuestionnaireSelect: (value: string) => void;
  onQuestionnaireOther: () => void;
  onQuestionnaireDraftSubmit: (value: string) => void;
  inputKey: number;
  inputValue: string;
  promptPlaceholder: string;
  onInputChange: (value: string) => void;
  onPromptSubmit: (value: string) => void;
  commandOverlay: ReactNode;
};

export function LogoView({
  innerWidth,
  logoPromptWidth,
  promptMaxRows,
  suggestionOpen,
  commandMatches,
  selectedIdx,
  questionnaireActive,
  question,
  currentQuestion,
  totalQuestions,
  questionnaireFreeText,
  questionnaireDraft,
  onQuestionnaireDraftChange,
  onQuestionnaireSelect,
  onQuestionnaireOther,
  onQuestionnaireDraftSubmit,
  inputKey,
  inputValue,
  promptPlaceholder,
  onInputChange,
  onPromptSubmit,
  commandOverlay,
}: LogoViewProps) {
  const { width: screen_width, height: screen_height } = useScreenSize();
  const compact = screen_width < 80;
  const show_banner = screen_width >= LOGO_BANNER_COLS + 4 && screen_height >= 18;

  return (
    <Box
      flexDirection="column"
      display="flex"
      alignItems="center"
      justifyContent="flex-start"
      backgroundColor={BG_BLACK}
      padding={WINDOW_PAD}
      width={screen_width}
      height={screen_height}
    >
      <Box
        width="100%"
        height="100%"
        display="flex"
        flexDirection="column"
        justifyContent={compact ? "space-between" : "center"}
        alignItems="center"
        paddingY={compact ? 1 : 0}
      >
        {show_banner ? (
          <Text color="#E3A32F">{LOGO_BANNER}</Text>
        ) : (
          <Text bold color="#E3A32F">
            leopardcode
          </Text>
        )}
        {compact ? null : (
          <Box flexDirection="column" alignItems="center" marginTop={1} marginBottom={1}>
            <Text bold color="#F0E6D4">
              Use /sample command to see an example
            </Text>
            <Text bold color="#F0E6D4">
              Try spamming more /sample while a sample is running
            </Text>
          </Box>
        )}
        {questionnaireActive ? (
          <Box width="100%" display="flex" flexDirection="column" alignItems="center">
            <QuestionnaireBox
              question={question}
              current={currentQuestion}
              total={totalQuestions}
              onSelect={onQuestionnaireSelect}
              freeText={questionnaireFreeText}
              onOther={onQuestionnaireOther}
            />
            {questionnaireFreeText && (
              <PromptBox
                key={`q-other-logo-${currentQuestion}`}
                value={questionnaireDraft}
                onChange={onQuestionnaireDraftChange}
                onSubmit={onQuestionnaireDraftSubmit}
                placeholder="Type your answer… (Esc to go back)"
                width={logoPromptWidth}
                maxContentRows={promptMaxRows}
                bordered={true}
              />
            )}
          </Box>
        ) : (
          <>
            {suggestionOpen && (
              <Box
                width={Math.min(LOGO_PROMPT_WIDTH, innerWidth)}
                display="flex"
                flexDirection="column"
              >
                <SuggestionBox commands={commandMatches} selectedIndex={selectedIdx} />
              </Box>
            )}
            <PromptBox
              key={inputKey}
              value={inputValue}
              onChange={onInputChange}
              onSubmit={onPromptSubmit}
              placeholder={promptPlaceholder}
              width={logoPromptWidth}
              maxContentRows={promptMaxRows}
              bordered={false}
            />
          </>
        )}
      </Box>
      {commandOverlay}
    </Box>
  );
}
