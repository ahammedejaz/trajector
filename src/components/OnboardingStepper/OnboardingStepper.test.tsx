import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OnboardingStepper } from './OnboardingStepper';

describe('OnboardingStepper', () => {
  it('renders four steps', () => {
    render(<OnboardingStepper currentStep="profile" completed={['resume']} />);
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Scan')).toBeInTheDocument();
    expect(screen.getByText('Results')).toBeInTheDocument();
  });

  it('marks current step with aria-current="step"', () => {
    render(<OnboardingStepper currentStep="profile" completed={['resume']} />);
    expect(screen.getByText('Profile').closest('[aria-current]')).toHaveAttribute('aria-current', 'step');
  });

  it('renders completed steps as buttons', () => {
    render(<OnboardingStepper currentStep="profile" completed={['resume']} onStepClick={() => {}} />);
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
  });

  it('calls onStepClick when a completed step is clicked', async () => {
    const user = userEvent.setup();
    const onStepClick = vi.fn();
    render(<OnboardingStepper currentStep="profile" completed={['resume']} onStepClick={onStepClick} />);
    await user.click(screen.getByRole('button', { name: /resume/i }));
    expect(onStepClick).toHaveBeenCalledWith('resume');
  });

  it('does not render upcoming steps as buttons', () => {
    render(<OnboardingStepper currentStep="profile" completed={['resume']} />);
    expect(screen.queryByRole('button', { name: /scan/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /results/i })).not.toBeInTheDocument();
  });
});
