import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagChips } from './TagChips';

describe('TagChips', () => {
  it('renders all provided chips', () => {
    render(<TagChips chips={['Go', 'Rust']} onRemove={() => {}} onAdd={() => {}} />);
    expect(screen.getByText('Go')).toBeInTheDocument();
    expect(screen.getByText('Rust')).toBeInTheDocument();
  });

  it('calls onRemove with the chip label when × is clicked', async () => {
    const onRemove = vi.fn();
    render(<TagChips chips={['Go']} onRemove={onRemove} onAdd={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove Go' }));
    expect(onRemove).toHaveBeenCalledWith('Go');
  });

  it('calls onAdd with trimmed value when Enter is pressed', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<TagChips chips={[]} onRemove={() => {}} onAdd={onAdd} />);
    await user.type(screen.getByRole('textbox'), '  TypeScript  {Enter}');
    expect(onAdd).toHaveBeenCalledWith('TypeScript');
  });

  it('clears the input after adding', async () => {
    const user = userEvent.setup();
    render(<TagChips chips={[]} onRemove={() => {}} onAdd={() => {}} />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    await user.type(input, 'Go{Enter}');
    expect(input.value).toBe('');
  });

  it('does not call onAdd when Enter is pressed with empty input', async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn();
    render(<TagChips chips={[]} onRemove={() => {}} onAdd={onAdd} />);
    await user.type(screen.getByRole('textbox'), '{Enter}');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('shows custom placeholder', () => {
    render(<TagChips chips={[]} onRemove={() => {}} onAdd={() => {}} placeholder="+ Add skill" />);
    expect(screen.getByPlaceholderText('+ Add skill')).toBeInTheDocument();
  });
});
