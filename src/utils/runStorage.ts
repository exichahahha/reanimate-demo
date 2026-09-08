import { PipelineStageNumber } from '../types';

export interface SavedRun {
  id: string;
  name?: string;
  readOnly?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedStage {
  input?: unknown;
  output?: unknown;
  data?: unknown;
}

export interface SavedRunPayload extends SavedRun {
  stages: Partial<Record<`stage${PipelineStageNumber}`, SavedStage>>;
}

export async function createRun(): Promise<SavedRun> {
  const response = await fetch('/api/runs', { method: 'POST' });
  if (!response.ok) throw new Error('Unable to create pipeline run');
  return response.json();
}

export async function listRuns(): Promise<SavedRun[]> {
  const response = await fetch('/api/runs');
  if (!response.ok) throw new Error('Unable to list pipeline runs');
  return response.json();
}

export async function loadRun(runId: string): Promise<SavedRunPayload> {
  const response = await fetch(`/api/runs/${encodeURIComponent(runId)}`);
  if (!response.ok) throw new Error('Unable to load pipeline run');
  return response.json();
}

export async function saveStageData(
  runId: string | null,
  stage: PipelineStageNumber,
  data: unknown,
) {
  if (!runId || runId.startsWith('sample_')) return;
  await fetch(`/api/runs/${encodeURIComponent(runId)}/stage${stage}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data }),
  });
}

export async function saveStageInputOutput(
  runId: string | null,
  stage: PipelineStageNumber,
  input: unknown,
  output: unknown,
  data?: unknown,
) {
  if (!runId || runId.startsWith('sample_')) return;
  await fetch(`/api/runs/${encodeURIComponent(runId)}/stage${stage}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, output, data }),
  });
}
