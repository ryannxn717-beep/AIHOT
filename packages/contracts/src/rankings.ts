export interface RankedModel {
  name: string;
  organization: string;
  openWeights: boolean;
  scores: Record<string, number>;
}

export interface ModelRankings {
  source: { name: string; url: string; release: string; observedAt: string };
  metrics: Array<{ key: string; label: string }>;
  models: RankedModel[];
}

/** Rank the complete snapshot before filtering; equal published scores share a position. */
export function rankModels(models: RankedModel[], metric: string): Array<RankedModel & { rank: number }> {
  for (const model of models) if (!Number.isFinite(model.scores[metric])) throw new Error(`Missing score ${metric} for ${model.name}`);
  const sorted = [...models].sort((a, b) => b.scores[metric] - a.scores[metric]);
  let rank = 0;
  return sorted.map((model, index) => {
    if (index === 0 || model.scores[metric] !== sorted[index - 1].scores[metric]) rank = index + 1;
    return { ...model, rank };
  });
}
