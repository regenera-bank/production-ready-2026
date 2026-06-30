import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../features/auth/ui/LoginPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSetAuthenticated = vi.fn();
const mockShowFeedback = vi.fn();
vi.mock('../shared/lib/store', () => ({
  useStore: (selector?: (state: any) => any) => {
    const state = {
      isAuthenticated: false,
      setAuthenticated: mockSetAuthenticated,
      showFeedback: mockShowFeedback,
    };
    if (selector) return selector(state);
    return state;
  },
}));

vi.mock('../core/api/client', () => ({
  api: {
    url: vi.fn().mockReturnThis(),
    post: vi.fn().mockReturnThis(),
    json: vi.fn().mockResolvedValue({ status: 'success', key: 'mock-key' }),
    res: vi.fn().mockResolvedValue({}),
  },
}));

const mockLogin = vi.fn();
const mockSignup = vi.fn();
vi.mock('../features/auth/api/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    signup: mockSignup,
    loading: false,
    error: null,
  }),
}));

beforeAll(() => {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
    writable: true,
  });
});

describe('LoginPage Component', () => {
  it('renders biometric mode by default and displays HUD elements', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText('ESCANEANDO ÍRIS...')).toBeInTheDocument();
    expect(screen.getByText('PROTOCOLO NEURAL — SYNCING...')).toBeInTheDocument();
  });

  it('switches to email mode and submits form', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailTab = screen.getByRole('button', { name: /EMAIL/i });
    fireEvent.click(emailTab);

    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Senha');
    const submitBtn = screen.getByRole('button', { name: /Acessar Sistema/i });

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    mockLogin.mockResolvedValueOnce({});

    fireEvent.click(submitBtn);

    expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'password123');
  });

  it('switches to register mode and validates empty fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const registerTab = screen.getByRole('button', { name: /CRIAR/i });
    fireEvent.click(registerTab);

    expect(screen.getByPlaceholderText(/Nome completo/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/CPF/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Ativar Protocolo/i });
    const form = submitBtn.closest('form')!;
    fireEvent.submit(form);

    expect(screen.getByText('Informe seu nome completo.')).toBeInTheDocument();
  });
});
