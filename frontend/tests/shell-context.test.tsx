import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ShellProvider, useShell } from '@/lib/shell-context';
import { DEFAULT_CAPITAL, DEFAULT_HOME_LOCATION } from '@/lib/constants';

// ─── Test harness ─────────────────────────────────────────────────────────────

/**
 * Renders a component that exposes ShellContext values via data-testid
 * attributes so we can assert on them without querying computed styles.
 */
function ShellDisplay(): React.JSX.Element {
  const ctx = useShell();
  return (
    <div>
      <span data-testid="drawerOpen">{String(ctx.drawerOpen)}</span>
      <span data-testid="homeLocation">{ctx.homeLocation}</span>
      <span data-testid="browsingLocation">{ctx.browsingLocation}</span>
      <span data-testid="isAwayFromHome">{String(ctx.isAwayFromHome)}</span>
      <span data-testid="capital">{ctx.capital}</span>
      <span data-testid="compareCount">{ctx.compareCount}</span>
      <span data-testid="language">{ctx.language}</span>
      <span data-testid="savedCount">{ctx.savedCategories.length}</span>
      <span data-testid="isDairySaved">{String(ctx.isCategorySaved('Dairy'))}</span>
      <button data-testid="openDrawer" onClick={ctx.openDrawer}>open</button>
      <button data-testid="closeDrawer" onClick={ctx.closeDrawer}>close</button>
      <button data-testid="setBrowsing" onClick={() => ctx.setBrowsingLocation('Mathura')}>browse</button>
      <button data-testid="setHome" onClick={() => ctx.setHomeLocation('Fatehabad')}>setHome</button>
      <button data-testid="resetHome" onClick={ctx.resetToHomeLocation}>reset</button>
      <button data-testid="setCapital" onClick={() => ctx.setCapital(200_000)}>cap</button>
      <button data-testid="setCompare" onClick={() => ctx.setCompareCount(3)}>compare</button>
      <button data-testid="setLang" onClick={() => ctx.setLanguage('hi')}>lang</button>
      <button data-testid="toggleDairy" onClick={() => ctx.toggleSaveCategory('Dairy')}>toggleDairy</button>
      <button data-testid="toggleNew" onClick={() => ctx.toggleSaveCategory('Pottery')}>toggleNew</button>
    </div>
  );
}

function renderShell(): void {
  render(
    <ShellProvider>
      <ShellDisplay />
    </ShellProvider>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ShellContext — default state', () => {
  beforeEach(() => {
    localStorage.clear();
    renderShell();
  });

  it('drawer is closed by default', () => {
    expect(screen.getByTestId('drawerOpen').textContent).toBe('false');
  });

  it('homeLocation defaults to constant', () => {
    expect(screen.getByTestId('homeLocation').textContent).toBe(DEFAULT_HOME_LOCATION);
  });

  it('browsingLocation equals homeLocation on init', () => {
    expect(screen.getByTestId('browsingLocation').textContent).toBe(DEFAULT_HOME_LOCATION);
  });

  it('isAwayFromHome is false on init', () => {
    expect(screen.getByTestId('isAwayFromHome').textContent).toBe('false');
  });

  it('capital defaults to constant', () => {
    expect(screen.getByTestId('capital').textContent).toBe(String(DEFAULT_CAPITAL));
  });

  it('compareCount defaults to 0', () => {
    expect(screen.getByTestId('compareCount').textContent).toBe('0');
  });

  it('language defaults to en', () => {
    expect(screen.getByTestId('language').textContent).toBe('en');
  });
});

describe('ShellContext — drawer state', () => {
  beforeEach(() => {
    localStorage.clear();
    renderShell();
  });

  it('openDrawer sets drawerOpen to true', async () => {
    await userEvent.click(screen.getByTestId('openDrawer'));
    expect(screen.getByTestId('drawerOpen').textContent).toBe('true');
  });

  it('closeDrawer sets drawerOpen to false after open', async () => {
    await userEvent.click(screen.getByTestId('openDrawer'));
    await userEvent.click(screen.getByTestId('closeDrawer'));
    expect(screen.getByTestId('drawerOpen').textContent).toBe('false');
  });
});

describe('ShellContext — location state', () => {
  beforeEach(() => {
    localStorage.clear();
    renderShell();
  });

  it('setBrowsingLocation changes browsingLocation', async () => {
    await userEvent.click(screen.getByTestId('setBrowsing'));
    expect(screen.getByTestId('browsingLocation').textContent).toBe('Mathura');
  });

  it('isAwayFromHome becomes true when browsing location differs', async () => {
    await userEvent.click(screen.getByTestId('setBrowsing'));
    expect(screen.getByTestId('isAwayFromHome').textContent).toBe('true');
  });

  it('resetToHomeLocation reverts browsingLocation', async () => {
    await userEvent.click(screen.getByTestId('setBrowsing'));
    await userEvent.click(screen.getByTestId('resetHome'));
    expect(screen.getByTestId('browsingLocation').textContent).toBe(DEFAULT_HOME_LOCATION);
  });

  it('isAwayFromHome is false after reset', async () => {
    await userEvent.click(screen.getByTestId('setBrowsing'));
    await userEvent.click(screen.getByTestId('resetHome'));
    expect(screen.getByTestId('isAwayFromHome').textContent).toBe('false');
  });

  it('setHomeLocation updates homeLocation and persists to localStorage', async () => {
    await userEvent.click(screen.getByTestId('setHome'));
    expect(screen.getByTestId('homeLocation').textContent).toBe('Fatehabad');
    expect(localStorage.getItem('saksham_home_location')).toBe('Fatehabad');
  });
});

describe('ShellContext — capital state', () => {
  beforeEach(() => {
    localStorage.clear();
    renderShell();
  });

  it('setCapital updates capital value', async () => {
    await userEvent.click(screen.getByTestId('setCapital'));
    expect(screen.getByTestId('capital').textContent).toBe('200000');
  });

  it('setCapital persists to localStorage', async () => {
    await userEvent.click(screen.getByTestId('setCapital'));
    expect(localStorage.getItem('saksham_capital')).toBe('200000');
  });
});

describe('ShellContext — compare and language', () => {
  beforeEach(() => {
    localStorage.clear();
    renderShell();
  });

  it('setCompareCount updates compareCount', async () => {
    await userEvent.click(screen.getByTestId('setCompare'));
    expect(screen.getByTestId('compareCount').textContent).toBe('3');
  });

  it('setLanguage updates language', async () => {
    await userEvent.click(screen.getByTestId('setLang'));
    expect(screen.getByTestId('language').textContent).toBe('hi');
  });
});

describe('ShellContext — saved categories', () => {
  beforeEach(() => {
    localStorage.clear();
    renderShell();
  });

  it('initializes with default saved categories count', () => {
    expect(Number(screen.getByTestId('savedCount').textContent)).toBeGreaterThan(0);
    expect(screen.getByTestId('isDairySaved').textContent).toBe('true');
  });

  it('toggles existing category off and updates state', async () => {
    await userEvent.click(screen.getByTestId('toggleDairy'));
    expect(screen.getByTestId('isDairySaved').textContent).toBe('false');
  });

  it('adds a new category when toggled on', async () => {
    const initialCount = Number(screen.getByTestId('savedCount').textContent);
    await userEvent.click(screen.getByTestId('toggleNew'));
    expect(Number(screen.getByTestId('savedCount').textContent)).toBe(initialCount + 1);
  });
});

describe('ShellContext — useShell outside provider', () => {
  it('throws an error when called outside ShellProvider', () => {
    function BrokenComponent(): React.JSX.Element {
      useShell();
      return <div />;
    }
    // React will throw, but we need to suppress the console.error noise.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<BrokenComponent />)).toThrow(
      'useShell must be called inside <ShellProvider>'
    );
    spy.mockRestore();
  });
});

// Import vi for the last test
import { vi } from 'vitest';
