/**
 * accessibility.test.tsx
 *
 * Automated accessibility checks using axe-core.
 * Tests ensure that GroundControl pages meet WCAG 2.1 AA requirements,
 * covering keyboard navigation, ARIA roles, and contrast-relevant structure.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import axe from 'axe-core';

// ─── Mock environment ────────────────────────────────────────────────────────

// Suppress fetch calls to backend in tests
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ illustrative: true, options: [], reasoning: null }),
}));

// Suppress localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Runs axe on the rendered element and asserts zero violations.
 * Returns the violations array for inspection in failure messages.
 */
async function expectNoAxeViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // Skip color-contrast since CSS vars are not resolved in jsdom
      'color-contrast': { enabled: false },
    },
  });
  const violations = results.violations;
  if (violations.length > 0) {
    const summary = violations
      .map(v => `[${v.id}] ${v.description}: ${v.nodes.map(n => n.html).join(', ')}`)
      .join('\n');
    expect(violations, `axe violations:\n${summary}`).toHaveLength(0);
  }
  expect(violations).toHaveLength(0);
}

// ─── TransportPanel accessibility ────────────────────────────────────────────

describe('TransportPanel accessibility', () => {
  it('renders with no axe violations — empty state', async () => {
    const { TransportPanel } = await import('../components/fan/TransportPanel');
    const { container } = render(
      <TransportPanel transportCompare={null} transportTitle="Eco-Transport Comparison" />
    );
    await expectNoAxeViolations(container);
  });

  it('renders with no axe violations — with transport options', async () => {
    const { TransportPanel } = await import('../components/fan/TransportPanel');
    const { container } = render(
      <TransportPanel
        transportTitle="Eco-Transport Comparison"
        transportCompare={{
          illustrative: true,
          reasoning: 'Rain incoming — metro recommended',
          options: [
            { mode: 'Metro/transit', estTime: '35 min', estCO2: '1.2' },
            { mode: 'Rideshare (shared)', estTime: '25 min', estCO2: '4.5' },
          ],
        }}
      />
    );
    await expectNoAxeViolations(container);
  });
});

// ─── VenueMap accessibility ───────────────────────────────────────────────────

describe('VenueMap accessibility', () => {
  it('renders with no axe violations', async () => {
    const { VenueMap } = await import('../components/fan/VenueMap');
    const zones = [
      { id: 'z1', name: 'North Stand', capacity: 4000, accessible: true },
      { id: 'z2', name: 'South Stand', capacity: 4000, accessible: true },
      { id: 'z3', name: 'East Plaza', capacity: 2500, accessible: false },
    ];
    const { container } = render(
      <VenueMap
        zones={zones}
        selectedZone={null}
        onSelectZone={() => {}}
        mapTitle="Interactive Venue Map"
        mapSelectZone="Select a zone"
      />
    );
    await expectNoAxeViolations(container);
  });

  it('shows zone details when a zone is selected with correct ARIA', async () => {
    const { VenueMap } = await import('../components/fan/VenueMap');
    const zones = [
      { id: 'z1', name: 'North Stand', capacity: 4000, accessible: true },
    ];
    const { container, getAllByText, getByText } = render(
      <VenueMap
        zones={zones}
        selectedZone="z1"
        onSelectZone={() => {}}
        mapTitle="Interactive Venue Map"
        mapSelectZone="Select a zone"
      />
    );
    expect(getAllByText('North Stand').length).toBeGreaterThan(0);
    expect(getByText('4000 fans')).toBeTruthy();
    expect(getByText('♿ Step-Free Accessible')).toBeTruthy();
    await expectNoAxeViolations(container);
  });

  it('calls onSelectZone when a zone is clicked or activated with Enter/Space', async () => {
    const { VenueMap } = await import('../components/fan/VenueMap');
    const onSelectZoneMock = vi.fn();
    const zones = [
      { id: 'z1', name: 'North Stand', capacity: 4000, accessible: true },
    ];
    const { getByRole } = render(
      <VenueMap
        zones={zones}
        selectedZone={null}
        onSelectZone={onSelectZoneMock}
        mapTitle="Interactive Venue Map"
        mapSelectZone="Select a zone"
      />
    );
    const zoneButton = getByRole('button', { name: /North Stand/i });
    
    // Test click
    fireEvent.click(zoneButton);
    expect(onSelectZoneMock).toHaveBeenCalledWith('z1');

    // Test Enter key
    fireEvent.keyDown(zoneButton, { key: 'Enter' });
    expect(onSelectZoneMock).toHaveBeenCalledTimes(2);

    // Test Space key
    fireEvent.keyDown(zoneButton, { key: ' ' });
    expect(onSelectZoneMock).toHaveBeenCalledTimes(3);
  });
});

// ─── ChatWindow accessibility ─────────────────────────────────────────────────

describe('ChatWindow accessibility', () => {
  it('renders with no axe violations — empty messages', async () => {
    const { ChatWindow } = await import('../components/fan/ChatWindow');
    const ref = { current: document.createElement('div') } as unknown as React.RefObject<HTMLDivElement>;
    const { container } = render(
      <ChatWindow
        messages={[{ sender: 'assistant', text: 'Welcome to GroundControl!' }]}
        isLoading={false}
        accessibilityNeeded={false}
        chatContainerRef={ref}
        teamAccent="#00E676"
        inputText=""
        setInputText={() => {}}
        isListening={false}
        onSend={() => {}}
        onVoiceInput={() => {}}
        onSpeak={() => {}}
        placeholder="Ask about gates, food..."
      />
    );
    await expectNoAxeViolations(container);
  });

  it('message log has aria-live region for screen readers', async () => {
    const { ChatWindow } = await import('../components/fan/ChatWindow');
    const ref = { current: document.createElement('div') } as unknown as React.RefObject<HTMLDivElement>;
    const { container } = render(
      <ChatWindow
        messages={[]}
        isLoading={false}
        accessibilityNeeded={true}
        chatContainerRef={ref}
        teamAccent="#00E676"
        inputText=""
        setInputText={() => {}}
        isListening={false}
        onSend={() => {}}
        onVoiceInput={() => {}}
        onSpeak={() => {}}
        placeholder="Ask..."
      />
    );
    // The message log must have aria-live for screen-reader announcements
    const liveRegion = container.querySelector('[aria-live]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
  });
});
