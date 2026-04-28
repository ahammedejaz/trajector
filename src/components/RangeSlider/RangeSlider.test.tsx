import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RangeSlider } from './RangeSlider';

describe('RangeSlider', () => {
  it('renders the current value', () => {
    render(<RangeSlider min={0} max={100} value={42} onChange={() => {}} ariaLabel="Min score" />);
    expect(screen.getByRole('slider', { name: 'Min score' })).toHaveValue('42');
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('calls onChange with the new numeric value', () => {
    const onChange = vi.fn();
    render(<RangeSlider min={0} max={100} value={0} onChange={onChange} ariaLabel="Min score" />);
    fireEvent.change(screen.getByRole('slider', { name: 'Min score' }), { target: { value: '75' } });
    expect(onChange).toHaveBeenCalledWith(75);
  });
});
