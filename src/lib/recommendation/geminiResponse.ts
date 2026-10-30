import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const list = (maxLength: number, min: number, max = min) => z.array(text(maxLength))
  .min(min).max(max).refine(items => new Set(items).size === items.length, "Duplicate items");
const personalization = z.object({
  personalizedCareerDirection: text(150),
  nicheCareerPaths: list(72, 3),
  reason: text(240),
  aspirationReflection: text(300),
  pathwayAdvice: list(135, 3),
  cautions: list(240, 0, 2),
}).strict();

function narrativeSchema(ids: string[]) {
  const exactIds = <T extends z.ZodTypeAny>(item: T) => z.record(item).refine(
    value => Object.keys(value).length === ids.length && ids.every(id => Object.hasOwn(value, id)),
    "Expected exactly the recommended major IDs",
  );
  return z.object({
    summary: text(360),
    studentStrengths: list(150, 3),
    recommendationReasons: exactIds(list(220, 2, 3)),
    careerPersonalizations: exactIds(personalization),
  }).strict();
}

export type GeminiNarrativePayload = z.infer<ReturnType<typeof narrativeSchema>>;

export function validateGeminiNarrative(value: unknown, ids: string[]): GeminiNarrativePayload {
  const result = narrativeSchema(ids).safeParse(value);
  if (!result.success) {
    // Record only a known top-level field; arbitrary model keys may echo student data.
    const root = String(result.error.issues[0]?.path[0] ?? "root");
    const path = ["summary", "studentStrengths", "recommendationReasons", "careerPersonalizations"].includes(root) ? root : "root";
    throw new Error(`Gemini narrative schema invalid at ${path}; complete required fields are needed.`);
  }
  return result.data;
}

export function parseGeminiNarrative(text: string, ids: string[]) {
  let value: unknown;
  try { value = JSON.parse(text); }
  catch { throw new Error("Gemini narrative is not valid JSON; retry with a complete structured response."); }
  return validateGeminiNarrative(value, ids);
}

export function getGeminiRequestConfig() {
  const bounded = (value: string | undefined, fallback: number, min: number) => {
    const parsed = value?.trim() ? Number(value) : NaN;
    return Number.isFinite(parsed) ? Math.min(fallback, Math.max(min, Math.round(parsed))) : fallback;
  };
  return {
    timeoutMs: bounded(process.env.GEMINI_TIMEOUT_MS, 25_000, 1_000),
    maxOutputTokens: bounded(process.env.GEMINI_MAX_OUTPUT_TOKENS, 5_200, 512),
  };
}

/** One deadline covers fetch and body consumption; retries belong to the queue. */
export async function withGeminiDeadline<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number) {
  const signal = AbortSignal.timeout(timeoutMs);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Gemini request timeout: complete narrative was not received within the configured deadline.")), timeoutMs);
  });
  try { return await Promise.race([operation(signal), deadline]); }
  catch (error) {
    if (signal.aborted) throw new Error("Gemini request timeout: complete narrative was not received within the configured deadline.");
    throw error;
  }
  finally { clearTimeout(timer); }
}

// Provider schema shapes output; the stricter runtime schema above is authoritative.
export function geminiResponseSchema(ids: string[]) {
  const string = { type: "STRING" };
  const array = (minItems: number, maxItems = minItems) => ({ type: "ARRAY", items: string, minItems, maxItems });
  const object = (properties: Record<string, unknown>) => ({ type: "OBJECT", properties, required: Object.keys(properties) });
  const perMajor = (schema: unknown) => object(Object.fromEntries(ids.map(id => [id, schema])));
  return object({
    summary: string,
    studentStrengths: array(3),
    recommendationReasons: perMajor(array(2, 3)),
    careerPersonalizations: perMajor(object({
      personalizedCareerDirection: string, nicheCareerPaths: array(3), reason: string,
      aspirationReflection: string, pathwayAdvice: array(3), cautions: array(0, 2),
    })),
  });
}
