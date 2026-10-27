import architectureDoc from "../../../docs/engineering/architecture.md?raw";
import backendReferenceDoc from "../../../docs/engineering/backend_reference.md?raw";
import buildAndRunDoc from "../../../docs/engineering/build_and_run.md?raw";
import dataModelDoc from "../../../docs/engineering/data_model.md?raw";
import pipelinesDoc from "../../../docs/engineering/pipelines.md?raw";
import socketProtocolDoc from "../../../docs/engineering/socket_protocol.md?raw";
import terminalReferenceDoc from "../../../docs/engineering/terminal_reference.md?raw";
import techStackDoc from "../../../docs/engineering/tech_stack.md?raw";
import webReferenceDoc from "../../../docs/engineering/web_reference.md?raw";
import aiToolsDoc from "../../../docs/engineering/ai_tools.md?raw";
import businessValueDoc from "../../../docs/product/business_value.md?raw";
import competitionAnalysisDoc from "../../../docs/product/competition_analysis.md?raw";
import problemDoc from "../../../docs/product/problem.md?raw";
import solutionDoc from "../../../docs/product/solution.md?raw";
import submissionDoc from "../../../docs/product/submission.md?raw";
import faqDoc from "../../../docs/hackathon/faq.md?raw";
import officialRulesDoc from "../../../docs/hackathon/official_rules.md?raw";
import overviewDoc from "../../../docs/hackathon/overview.md?raw";
import tracksAndPrizesDoc from "../../../docs/hackathon/tracks_and_prizes.md?raw";
import gettingStartedDoc from "../../../docs/getting_started.md?raw";
import taskMorphingDoc from "../../../docs/engineering/task_morphing.md?raw";
import sponsorVerificationDoc from "../../../docs/engineering/sponsor_verification.md?raw";
import memoryEngineDoc from "../../../docs/engineering/memory_engine.md?raw";
import userWorkflowsDoc from "../../../docs/product/user_workflows.md?raw";
import integrationWriteupDoc from "../../../docs/product/integration_writeup.md?raw";

export type DocGroup = "start" | "engineering" | "product" | "hackathon";

export type DocEntry = {
  id: string;
  title: string;
  group: DocGroup;
  markdown: string;
};

export const DOC_GROUPS: ReadonlyArray<{ id: DocGroup; label: string }> = [
  { id: "start", label: "Getting started" },
  { id: "engineering", label: "Engineering" },
  { id: "product", label: "Product" },
  { id: "hackathon", label: "Hackathon" },
];

export const DOC_ENTRIES: ReadonlyArray<DocEntry> = [
  { id: "getting-started", title: "Getting started", group: "start", markdown: gettingStartedDoc },
  { id: "architecture", title: "Architecture", group: "engineering", markdown: architectureDoc },
  { id: "build-and-run", title: "Build & run", group: "engineering", markdown: buildAndRunDoc },
  { id: "tech-stack", title: "Tech stack", group: "engineering", markdown: techStackDoc },
  { id: "data-model", title: "Data model", group: "engineering", markdown: dataModelDoc },
  { id: "pipelines", title: "Pipelines", group: "engineering", markdown: pipelinesDoc },
  {
    id: "socket-protocol",
    title: "Socket protocol",
    group: "engineering",
    markdown: socketProtocolDoc,
  },
  { id: "ai-tools", title: "AI tools", group: "engineering", markdown: aiToolsDoc },
  {
    id: "backend-reference",
    title: "Backend reference",
    group: "engineering",
    markdown: backendReferenceDoc,
  },
  {
    id: "terminal-reference",
    title: "Terminal reference",
    group: "engineering",
    markdown: terminalReferenceDoc,
  },
  { id: "web-reference", title: "Web reference", group: "engineering", markdown: webReferenceDoc },
  { id: "task-morphing", title: "Task morphing", group: "engineering", markdown: taskMorphingDoc },
  {
    id: "sponsor-verification",
    title: "Sponsor verification",
    group: "engineering",
    markdown: sponsorVerificationDoc,
  },
  {
    id: "memory-engine",
    title: "Memory engine (H-MEM)",
    group: "engineering",
    markdown: memoryEngineDoc,
  },
  { id: "problem", title: "Problem", group: "product", markdown: problemDoc },
  { id: "solution", title: "Solution", group: "product", markdown: solutionDoc },
  {
    id: "competition-analysis",
    title: "Competition analysis",
    group: "product",
    markdown: competitionAnalysisDoc,
  },
  { id: "business-value", title: "Business value", group: "product", markdown: businessValueDoc },
  { id: "submission", title: "Submission", group: "product", markdown: submissionDoc },
  {
    id: "user-workflows",
    title: "User workflows",
    group: "product",
    markdown: userWorkflowsDoc,
  },
  {
    id: "integration-writeup",
    title: "Integration write-up",
    group: "product",
    markdown: integrationWriteupDoc,
  },
  { id: "hackathon-overview", title: "Overview", group: "hackathon", markdown: overviewDoc },
  { id: "official-rules", title: "Official rules", group: "hackathon", markdown: officialRulesDoc },
  {
    id: "tracks-and-prizes",
    title: "Tracks & prizes",
    group: "hackathon",
    markdown: tracksAndPrizesDoc,
  },
  { id: "hackathon-faq", title: "FAQ", group: "hackathon", markdown: faqDoc },
];

export const DEFAULT_DOC_ID = "getting-started";

export function findDoc(id: string | null): DocEntry {
  const match = DOC_ENTRIES.find((entry) => entry.id === id);
  return match ?? DOC_ENTRIES.find((entry) => entry.id === DEFAULT_DOC_ID) ?? DOC_ENTRIES[0];
}
