import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterGroup } from './FilterGroup';

describe('FilterGroup', () => {
  it('renders the title and children', () => {
    render(<FilterGroup title="Tier"><span>child</span></FilterGroup>);
    expect(screen.getByText('Tier')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
