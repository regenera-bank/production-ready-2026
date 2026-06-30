import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GlobalErrorBoundary } from '../app/ErrorBoundary';

const ThrowError = ({ message }: { message: string }) => {
  throw new Error(message);
};

describe('GlobalErrorBoundary Component', () => {
  let originalLocation: any;
  let consoleErrorMock: any;

  beforeEach(() => {
    originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
    consoleErrorMock.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <GlobalErrorBoundary>
        <div>Safe Content</div>
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('catches error and renders the fallback UI', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError message="Generic crash" />
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('Sincronizando Protocolos')).toBeInTheDocument();
    expect(screen.getByText(/Recarregando módulos neurais/i)).toBeInTheDocument();
  });

  it('triggers window reload on clicking Reiniciar Manualmente', () => {
    render(
      <GlobalErrorBoundary>
        <ThrowError message="Generic crash" />
      </GlobalErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /Reiniciar Manualmente/i });
    fireEvent.click(button);

    expect(window.location.reload).toHaveBeenCalled();
  });
});
