import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Reveal } from './Reveal';

describe('Reveal', () => {
  let originalIO: typeof IntersectionObserver | undefined;

  beforeEach(() => {
    originalIO = globalThis.IntersectionObserver;
    // Stub IntersectionObserver to fire visible immediately on observe()
    class MockIO {
      callback: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.callback = cb;
      }
      observe(target: Element) {
        this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
      }
      disconnect() {}
      unobserve() {}
      takeRecords() { return []; }
      root = null;
      rootMargin = '';
      thresholds = [];
    }
    globalThis.IntersectionObserver = MockIO as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    if (originalIO) globalThis.IntersectionObserver = originalIO;
    else delete (globalThis as Record<string, unknown>).IntersectionObserver;
    vi.restoreAllMocks();
  });

  it('renders children', () => {
    render(
      <Reveal>
        <p>hello</p>
      </Reveal>,
    );
    expect(screen.getByText('hello')).toBeInTheDocument();
  });

  it('applies the visible class when intersection fires', () => {
    const { container } = render(
      <Reveal>
        <p>hi</p>
      </Reveal>,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/visible/);
  });

  it('respects the as prop to render a different element', () => {
    const { container } = render(
      <Reveal as="section">
        <p>x</p>
      </Reveal>,
    );
    expect(container.firstChild?.nodeName).toBe('SECTION');
  });
});
