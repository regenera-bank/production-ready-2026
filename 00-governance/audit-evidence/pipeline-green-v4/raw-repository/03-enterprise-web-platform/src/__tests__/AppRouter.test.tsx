import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { AppRouter } from '../AppRouter';

// Mocking dos componentes principais para isolar o Router
vi.mock('../features/auth/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('../features/dashboard/Dashboard', () => ({
  default: () => <div data-testid="dashboard-page">Dashboard Page</div>
}));

describe('AppRouter (Frontend)', () => {
  it('Deve renderizar a tela inicial na rota padrão "/"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText(/Regenera Bank/i)).toBeInTheDocument();
  });
});
