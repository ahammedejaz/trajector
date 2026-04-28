import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DropZone } from './DropZone';

describe('DropZone', () => {
  it('renders idle copy by default', () => {
    render(<DropZone state="idle" onFileSelected={() => {}} />);
    expect(screen.getByText(/drop here/i)).toBeInTheDocument();
    expect(screen.getByText(/click to browse/i)).toBeInTheDocument();
  });

  it('renders reading copy when state is reading', () => {
    render(<DropZone state="reading" onFileSelected={() => {}} />);
    expect(screen.getByText(/reading your resume/i)).toBeInTheDocument();
  });

  it('renders error message when state is error', () => {
    render(
      <DropZone state="error" errorMessage="Couldn't read this file." onFileSelected={() => {}} />
    );
    expect(screen.getByText(/couldn't read this file/i)).toBeInTheDocument();
  });

  it('calls onFileSelected when a file is picked via the input', async () => {
    const user = userEvent.setup();
    const onFileSelected = vi.fn();
    render(<DropZone state="idle" onFileSelected={onFileSelected} />);
    const file = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/drop here/i);
    await user.upload(input, file);
    expect(onFileSelected).toHaveBeenCalledWith(file);
  });
});
