import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  it('renders body and footer slots', () => {
    render(
      <Sidebar footer={<button>New scan</button>}>
        <p>filter content</p>
      </Sidebar>,
    );
    expect(screen.getByText('filter content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New scan' })).toBeInTheDocument();
  });

  it('renders without footer', () => {
    render(<Sidebar><p>only body</p></Sidebar>);
    expect(screen.getByText('only body')).toBeInTheDocument();
  });
});
