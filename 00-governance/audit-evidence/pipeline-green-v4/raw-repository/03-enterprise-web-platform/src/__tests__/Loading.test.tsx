import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Loading } from '../components/Loading';

describe('Loading Component', () => {
  it('renders with default status', () => {
    render(<Loading />);
    expect(screen.getByText('Sincronizando...')).toBeInTheDocument();
  });

  it('renders with custom status', () => {
    render(<Loading status="Carregando dados..." />);
    expect(screen.getByText('Carregando dados...')).toBeInTheDocument();
  });

  it('renders in full screen mode', () => {
    const { container } = render(<Loading fullScreen={true} />);
    expect(container.querySelector('.fixed')).toBeInTheDocument();
  });
});
