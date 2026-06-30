import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { HomeScreen } from '../features/banking/ui/HomeScreen';
import { useStore } from '../shared/lib/store';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom') as any;
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../shared/api/generated/default/default', () => ({
  useGetCoreDashboard: () => ({
    data: {
      globalBalanceCents: 150000,
      monthlyYield: 1.25,
      creditScore: 920,
      account: 'RG-2098233287',
      recentTransactions: [
        { id: '1', description: 'Pix Recebido', amountCents: 50000, type: 'INBOUND', timestamp: '2026-06-08T12:00:00Z' }
      ]
    },
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('../shared/ui/AppLayout', () => ({
  AppLayout: ({ children }: any) => <div data-testid="app-layout">{children}</div>
}));

describe('Dashboard (HomeScreen)', () => {
  it('renders welcome message and balance information', () => {
    useStore.setState({
      user: { name: 'Paulo Ricardo', email: 'paulo@regenerabank.app', tier: 'Premium', id: '123' },
      globalBalanceCents: 150000,
    });

    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>
    );

    expect(screen.getByText(/Paulo Ricardo/i)).toBeInTheDocument();
  });

  it('can hide/show balance when clicking eye icon', () => {
    useStore.setState({
      user: { name: 'Paulo Ricardo', email: 'paulo@regenerabank.app', tier: 'Premium', id: '123' },
      globalBalanceCents: 150000,
    });

    render(
      <MemoryRouter>
        <HomeScreen />
      </MemoryRouter>
    );

    expect(screen.getByText(/1\.500,00/)).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    const eyeButton = buttons.find(b => b.querySelector('.lucide-eye') || b.querySelector('.lucide-eye-off'))!;
    
    fireEvent.click(eyeButton);
    expect(screen.queryByText(/1\.500,00/)).not.toBeInTheDocument();
    expect(screen.getByText('R$ •••••')).toBeInTheDocument();
  });
});
