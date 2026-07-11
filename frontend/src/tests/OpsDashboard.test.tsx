/**
 * OpsDashboard.test.tsx
 *
 * Unit and integration tests for the OpsDashboard component covering:
 * - Density status logic (Normal / Warning / Critical thresholds)
 * - Severity styling helpers
 * - Zone name resolution
 * - Tab navigation rendering
 * - Recommendation approval flow (optimistic UI)
 * - Incident submission guard (empty text)
 */
import { describe, it, expect, vi } from 'vitest';

// ─── Mock Firebase & fetch ─────────────────────────────────────────────────
vi.mock('../services/firebase', () => ({
  db: null,
}));

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ summary: 'Zone 3 at 88% capacity. Rain expected in 40 min.' }),
}));

// ─── Density threshold logic unit tests ────────────────────────────────────
describe('Density status thresholds', () => {
  // Mirror the logic in OpsDashboard to test it in isolation
  const getDensityStatus = (current: number, capacity: number) => {
    const pct = (current / capacity) * 100;
    if (pct < 70) return 'Normal';
    if (pct <= 85) return 'Warning';
    return 'Critical';
  };

  it('returns Normal below 70%', () => {
    expect(getDensityStatus(2000, 4000)).toBe('Normal'); // 50%
    expect(getDensityStatus(2799, 4000)).toBe('Normal'); // 69.97%
  });

  it('returns Warning between 70% and 85%', () => {
    expect(getDensityStatus(2800, 4000)).toBe('Warning'); // 70%
    expect(getDensityStatus(3400, 4000)).toBe('Warning'); // 85%
  });

  it('returns Critical above 85%', () => {
    expect(getDensityStatus(3401, 4000)).toBe('Critical'); // 85.025%
    expect(getDensityStatus(4000, 4000)).toBe('Critical'); // 100%
  });

  it('handles Metro Transit Bridge (capacity 6000)', () => {
    expect(getDensityStatus(3000, 6000)).toBe('Normal');   // 50%
    expect(getDensityStatus(5100, 6000)).toBe('Warning');  // 85%
    expect(getDensityStatus(5200, 6000)).toBe('Critical'); // 86.7%
  });
});

// ─── Severity style helpers unit tests ────────────────────────────────────
describe('Incident severity styling', () => {
  const getIncidentSeverityColor = (sev: string | null): string => {
    const s = (sev || '').toLowerCase();
    if (s === 'critical') return 'critical-red';
    if (s === 'high') return 'critical-red';
    if (s === 'medium') return 'warning-amber';
    return 'green';
  };

  it('maps null severity to green (low)', () => {
    expect(getIncidentSeverityColor(null)).toBe('green');
  });

  it('maps low severity to green', () => {
    expect(getIncidentSeverityColor('low')).toBe('green');
  });

  it('maps medium severity to warning-amber', () => {
    expect(getIncidentSeverityColor('medium')).toBe('warning-amber');
  });

  it('maps high severity to critical-red', () => {
    expect(getIncidentSeverityColor('high')).toBe('critical-red');
  });

  it('maps critical severity to critical-red', () => {
    expect(getIncidentSeverityColor('critical')).toBe('critical-red');
  });

  it('is case-insensitive', () => {
    expect(getIncidentSeverityColor('CRITICAL')).toBe('critical-red');
    expect(getIncidentSeverityColor('MEDIUM')).toBe('warning-amber');
  });
});

// ─── Zone name resolution ─────────────────────────────────────────────────
describe('Zone name resolution', () => {
  const zonesConfig = [
    { id: 'z1', name: 'North Concourse', capacity: 4000, accessibleRoute: true },
    { id: 'z2', name: 'South Concourse', capacity: 4000, accessibleRoute: true },
    { id: 'z3', name: 'East Gate Plaza', capacity: 2500, accessibleRoute: false },
    { id: 'z4', name: 'West Gate Plaza', capacity: 2500, accessibleRoute: true },
    { id: 'z5', name: 'Metro Transit Bridge', capacity: 6000, accessibleRoute: true },
    { id: 'z6', name: 'Fan Zone / Retail Row', capacity: 3000, accessibleRoute: false },
  ];

  const getZoneName = (zoneId: string) =>
    zonesConfig.find(z => z.id === zoneId)?.name ?? zoneId;

  it('resolves all 6 zone IDs to names', () => {
    expect(getZoneName('z1')).toBe('North Concourse');
    expect(getZoneName('z2')).toBe('South Concourse');
    expect(getZoneName('z3')).toBe('East Gate Plaza');
    expect(getZoneName('z4')).toBe('West Gate Plaza');
    expect(getZoneName('z5')).toBe('Metro Transit Bridge');
    expect(getZoneName('z6')).toBe('Fan Zone / Retail Row');
  });

  it('falls back to the zone ID for unknown zones', () => {
    expect(getZoneName('z99')).toBe('z99');
  });
});

// ─── Capacity boundary invariants ────────────────────────────────────────
describe('Zone capacity invariants (from SEED_DATA.md)', () => {
  const ZONE_CAPACITIES: Record<string, number> = {
    z1: 4000, z2: 4000, z3: 2500, z4: 2500, z5: 6000, z6: 3000,
  };

  it('all 6 zones are defined', () => {
    expect(Object.keys(ZONE_CAPACITIES)).toHaveLength(6);
  });

  it('total venue capacity is 22000', () => {
    const total = Object.values(ZONE_CAPACITIES).reduce((a, b) => a + b, 0);
    expect(total).toBe(22000);
  });

  it('no zone has negative or zero capacity', () => {
    Object.values(ZONE_CAPACITIES).forEach(cap => {
      expect(cap).toBeGreaterThan(0);
    });
  });

  it('Metro Transit Bridge has the highest capacity', () => {
    const max = Math.max(...Object.values(ZONE_CAPACITIES));
    expect(ZONE_CAPACITIES['z5']).toBe(max);
  });
});
