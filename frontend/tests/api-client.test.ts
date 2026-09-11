import { describe, it, expect } from 'vitest';
import { fetchInsights, fetchAssessment } from '@/lib/api-client';

describe('api-client — fetchInsights', () => {
  it('resolves with the correct location echoed back', async () => {
    const result = await fetchInsights('Kheragarh');
    expect(result.location).toBe('Kheragarh');
  });

  it('resolves with a categories array', async () => {
    const result = await fetchInsights('Kheragarh');
    expect(Array.isArray(result.categories)).toBe(true);
  });
});

describe('api-client — fetchAssessment', () => {
  it('resolves with a fitScore number', async () => {
    const result = await fetchAssessment('Kheragarh', 'Dairy', 100_000);
    expect(typeof result.fitScore).toBe('number');
  });

  it('resolves with a valid confidence level', async () => {
    const result = await fetchAssessment('Kheragarh', 'Dairy', 100_000);
    expect(['Low', 'Medium', 'High']).toContain(result.confidence);
  });

  it('resolves with a recommendation string', async () => {
    const result = await fetchAssessment('Kheragarh', 'Dairy', 100_000);
    expect(typeof result.recommendation).toBe('string');
  });
});
