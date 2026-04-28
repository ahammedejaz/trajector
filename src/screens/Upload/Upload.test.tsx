import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Upload } from './Upload';
import { parseResume } from '../../lib/parseResume';

vi.mock('../../lib/parseResume', () => ({
  parseResume: vi.fn(),
}));

const mockParseResume = vi.mocked(parseResume);

beforeEach(() => {
  mockParseResume.mockResolvedValue({
    kind: 'pdf',
    filename: 'sample-resume.pdf',
    text: 'Senior Backend Engineer at Anthropic',
    byteSize: 1243,
  });
});

describe('Upload screen', () => {
  it('renders headline and reassurance copy', () => {
    render(<Upload onResumeParsed={() => {}} />);
    expect(screen.getByText(/drop your resume to begin/i)).toBeInTheDocument();
    expect(screen.getByText(/stays on your machine/i)).toBeInTheDocument();
    expect(screen.getByText(/no account/i)).toBeInTheDocument();
  });

  it('parses a PDF and calls onResumeParsed', async () => {
    const user = userEvent.setup();
    const onResumeParsed = vi.fn();
    const file = new File([new Uint8Array([1, 2, 3])], 'sample-resume.pdf', {
      type: 'application/pdf',
    });

    render(<Upload onResumeParsed={onResumeParsed} />);
    const input = screen.getByLabelText(/drop here/i);
    await user.upload(input, file);

    await waitFor(() => expect(onResumeParsed).toHaveBeenCalledTimes(1), { timeout: 10000 });
    const result = onResumeParsed.mock.calls[0][0];
    expect(result.kind).toBe('pdf');
    expect(result.text).toContain('Senior Backend Engineer at Anthropic');
  });

  it('shows error message when parse fails', async () => {
    mockParseResume.mockRejectedValueOnce(new Error('Unsupported file type'));

    const user = userEvent.setup({ applyAccept: false });
    render(<Upload onResumeParsed={() => {}} />);
    const file = new File([new Uint8Array([1, 2, 3])], 'broken.png', { type: 'image/png' });
    const input = screen.getByLabelText(/drop here/i);
    await user.upload(input, file);

    await waitFor(() =>
      expect(screen.getByText(/couldn't read this file/i)).toBeInTheDocument()
    );
  });

  it('shows an analyze error message when analyzeError prop is set', () => {
    render(
      <Upload
        onResumeParsed={() => {}}
        analyzeError="Couldn't analyze your resume. Check your OpenRouter key in Settings."
      />,
    );
    expect(
      screen.getByText(/couldn't analyze your resume/i),
    ).toBeInTheDocument();
  });
});
