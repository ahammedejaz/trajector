import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DotGrid } from './DotGrid';

describe('DotGrid', () => {
  it('renders an SVG element', () => {
    const { container } = render(<DotGrid />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('respects spacing prop', () => {
    const { container } = render(<DotGrid spacing={48} />);
    const pattern = container.querySelector('pattern');
    expect(pattern).toHaveAttribute('width', '48');
  });
});
