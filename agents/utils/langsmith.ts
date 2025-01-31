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
  // If tracing is disabled or client isn't available, just execute
  if (!langsmith || !env.LANGSMITH_TRACING) {
    return execution();
  }

  const runData = createRunMetadata({
    workflowName,
    runId: options.runId,
    tags: options.tags,
    extraMetadata: options.metadata
  });

  let createResult: { id: string } | null = null;

  try {
    // Create run and get ID, with proper type checking
    let result: any;
    try {
      result = await langsmith.createRun(runData);
    } catch (error) {
      console.warn('Failed to create LangSmith run:', error);
      return execution();
    }

    if (typeof result !== 'object' || !result) {
      console.warn('Invalid result from LangSmith createRun');
      return execution();
    }

    createResult = result as { id: string };
    if (!createResult.id) {
      console.warn('Invalid run ID from LangSmith');
      return execution();
    }

    // Execute the workflow
    const executionResult = await execution();

    // Update the run with results
    try {
      await langsmith.updateRun(createResult.id, {
        outputs: { result: executionResult },
        end_time: Date.now(),
      });
    } catch (error) {
      console.warn('Failed to update LangSmith run:', error);
    }

    return executionResult;
  } catch (error) {
    // If we have a valid run ID, try to update it with the error
    if (createResult?.id) {
      try {
        await langsmith.updateRun(createResult.id, {
          error: error instanceof Error ? error.message : 'Unknown error',
          end_time: Date.now(),
        });
      } catch (updateError) {
        console.warn('Failed to update LangSmith run with error:', updateError);
      }
    }
    throw error;
  }
} 