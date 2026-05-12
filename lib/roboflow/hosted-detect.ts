import { appConfig } from '@/lib/config';

export interface RoboflowHostedPrediction {
  class: string;
  confidence?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

function normalizePredictionClass(className: string): string {
  return className.trim().toLowerCase();
}

export function predictionsHaveGlassAndG(predictions: RoboflowHostedPrediction[]): {
  hasGlass: boolean;
  hasG: boolean;
} {
  const hasGlass = predictions.some((p) => normalizePredictionClass(p.class) === 'glass');
  const hasG = predictions.some((p) => normalizePredictionClass(p.class) === 'g');
  return { hasGlass, hasG };
}

/**
 * Same Roboflow **model** as the web PWA’s Inference.js worker (`VITE_ROBOFLOW_INFERENCE_MODEL` / `_VERSION`),
 * via the hosted detect endpoint (per-frame network inference — publishable key only).
 */
export async function runRoboflowHostedDetect(
  jpegBase64WithoutDataUrlPrefix: string,
): Promise<RoboflowHostedPrediction[]> {
  const apiKey = appConfig.roboflowPublishableKey.trim();
  if (!apiKey) {
    throw new Error('missing_roboflow_publishable_key');
  }

  const model = appConfig.roboflowInferenceModel.trim();
  const version = appConfig.roboflowInferenceVersion.trim();
  const url = `https://detect.roboflow.com/${encodeURIComponent(model)}/${encodeURIComponent(version)}?api_key=${encodeURIComponent(apiKey)}&format=json`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: jpegBase64WithoutDataUrlPrefix.replace(/^data:image\/\w+;base64,/, ''),
  });

  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`roboflow_invalid_json:${response.status}`);
  }

  if (!response.ok) {
    const detail = typeof data === 'object' && data && 'message' in data ? String((data as { message: unknown }).message) : text.slice(0, 200);
    throw new Error(`roboflow_http_${response.status}:${detail}`);
  }

  const predictions = extractPredictionsArray(data);
  return predictions;
}

function extractPredictionsArray(data: unknown): RoboflowHostedPrediction[] {
  if (Array.isArray(data)) {
    return data.filter(isPredictionShape) as RoboflowHostedPrediction[];
  }
  if (!data || typeof data !== 'object') return [];
  const root = data as Record<string, unknown>;
  if (Array.isArray(root.predictions)) {
    return root.predictions.filter(isPredictionShape) as RoboflowHostedPrediction[];
  }
  if (root.predictions && typeof root.predictions === 'object') {
    const inner = root.predictions as Record<string, unknown>;
    if (Array.isArray(inner.predictions)) {
      return inner.predictions.filter(isPredictionShape) as RoboflowHostedPrediction[];
    }
  }
  return [];
}

function isPredictionShape(value: unknown): value is RoboflowHostedPrediction {
  if (!value || typeof value !== 'object') return false;
  const c = (value as { class?: unknown }).class;
  return typeof c === 'string' && c.length > 0;
}
