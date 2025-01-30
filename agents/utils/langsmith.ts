import { Client } from "langsmith";
import { env } from "../config/env";

// Initialize LangSmith client if credentials are available
export const langsmith = env.LANGSMITH_API_KEY ? new Client({
  apiUrl: env.LANGSMITH_ENDPOINT,
  apiKey: env.LANGSMITH_API_KEY,
}) : null;

// Helper function to get trace name
export function getTraceName(workflowName: string) {
  return `${env.NODE_ENV}/${workflowName}`;
}

// Helper to create run metadata
export function createRunMetadata(options: {
  workflowName: string;
  runId?: string;
  tags?: string[];
  extraMetadata?: Record<string, any>;
}) {
  const { workflowName, runId, tags = [], extraMetadata = {} } = options;

  return {
    name: getTraceName(workflowName),
    run_id: runId,
    project: env.LANGSMITH_PROJECT,
    run_type: "chain",
    inputs: extraMetadata,
    tags: [env.NODE_ENV, workflowName, ...tags],
    metadata: {
      environment: env.NODE_ENV,
      model: env.OPENAI_MODEL,
      ...extraMetadata
    }
  } as const;
}

// Helper to wrap workflow execution with tracing
export async function traceWorkflow<T>(
  workflowName: string,
  execution: () => Promise<T>,
  options: {
    runId?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  } = {}
): Promise<T> {
  if (!langsmith || !env.LANGSMITH_TRACING) {
    return execution();
  }

  const runData = createRunMetadata({
    workflowName,
    runId: options.runId,
    tags: options.tags,
    extraMetadata: options.metadata
  });

  // Create run and get ID
  const createResult = await langsmith.createRun(runData);
  const runId = (createResult as unknown as { id: string }).id;

  try {
    const result = await execution();
    await langsmith.updateRun(runId, {
      outputs: { result },
      end_time: Date.now(),
    });
    return result;
  } catch (error) {
    await langsmith.updateRun(runId, {
      error: error instanceof Error ? error.message : 'Unknown error',
      end_time: Date.now(),
    });
    throw error;
  }
} 