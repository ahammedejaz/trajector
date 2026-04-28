import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoPreview } from './DemoPreview';

describe('DemoPreview', () => {
  it('renders the demo profile summary', () => {
    render(<DemoPreview />);
    expect(screen.getByText(/Senior Backend Engineer · senior · United States/)).toBeInTheDocument();
  });

  it('renders demo job titles', () => {
    render(<DemoPreview />);
    expect(screen.getByText('Staff Backend Engineer, Edge Runtime')).toBeInTheDocument();
    expect(screen.getByText('Senior Backend Engineer')).toBeInTheDocument();
  });

  it('opens a SideSheet when a card is clicked', async () => {
    const user = userEvent.setup();
    render(<DemoPreview />);
    await user.click(screen.getByRole('button', { name: /Staff Backend Engineer/i }));
    expect(screen.getByText(/Own the Edge Runtime/)).toBeVisible();
    expect(screen.getByText(/why this score/i)).toBeVisible();
  });
});
