import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Settings } from './Settings';

beforeEach(() => { localStorage.clear(); });

describe('Settings screen', () => {
  it('renders the API key input', () => {
    render(<Settings onDone={() => {}} />);
    expect(screen.getByLabelText('OpenRouter API key')).toBeInTheDocument();
  });

  it('renders the model select', () => {
    render(<Settings onDone={() => {}} />);
    expect(screen.getByLabelText('Model')).toBeInTheDocument();
  });

  it('calls onDone when Done is clicked', async () => {
    const onDone = vi.fn();
    render(<Settings onDone={onDone} />);
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('masks the API key by default', () => {
    render(<Settings onDone={() => {}} />);
    const input = screen.getByLabelText('OpenRouter API key') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('reveals the API key when Show is clicked', async () => {
    render(<Settings onDone={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Show' }));
    const input = screen.getByLabelText('OpenRouter API key') as HTMLInputElement;
    expect(input.type).toBe('text');
  });

  it('persists the API key to localStorage on change', async () => {
    const user = userEvent.setup();
    render(<Settings onDone={() => {}} />);
    await user.type(screen.getByLabelText('OpenRouter API key'), 'sk-or-v1-test');
    const stored = JSON.parse(localStorage.getItem('trajector_settings') ?? '{}') as { openRouterKey: string };
    expect(stored.openRouterKey).toBe('sk-or-v1-test');
  });

  it('renders source toggle checkboxes', () => {
    render(<Settings onDone={() => {}} />);
    expect(screen.getByRole('checkbox', { name: /greenhouse/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /ashby/i })).toBeInTheDocument();
  });

  it('toggles a source off and persists it', async () => {
    render(<Settings onDone={() => {}} />);
    await userEvent.click(screen.getByRole('checkbox', { name: /greenhouse/i }));
    const stored = JSON.parse(localStorage.getItem('trajector_settings') ?? '{}') as { sources: Record<string, boolean> };
    expect(stored.sources.greenhouse).toBe(false);
  });
});
