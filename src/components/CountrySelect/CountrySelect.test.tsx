import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CountrySelect } from './CountrySelect';

describe('CountrySelect', () => {
  it('renders the current value', () => {
    render(<CountrySelect value="Canada" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('Canada');
  });

  it('shows null value as empty string', () => {
    render(<CountrySelect value={null} onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('opens a list of suggestions when typing', async () => {
    const user = userEvent.setup();
    render(<CountrySelect value={null} onChange={() => {}} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('Uni');
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
    expect(screen.getByRole('option', { name: 'United States' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'United Kingdom' })).toBeInTheDocument();
  });

  it('calls onChange when an option is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountrySelect value={null} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('Cana');
    await user.click(screen.getByRole('option', { name: 'Canada' }));
    expect(onChange).toHaveBeenCalledWith('Canada');
  });

  it('clears value when input is cleared', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<CountrySelect value="Canada" onChange={onChange} />);
    await user.clear(screen.getByRole('combobox'));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
