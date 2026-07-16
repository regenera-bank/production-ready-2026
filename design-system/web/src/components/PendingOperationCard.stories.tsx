import type { Meta, StoryObj } from '@storybook/react';
import { PendingOperationCard } from './PendingOperationCard';

const meta: Meta<typeof PendingOperationCard> = {
  title: 'Financial/PendingOperationCard',
  component: PendingOperationCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PendingOperationCard>;

export const PixPending: Story = {
  args: {
    title: 'Pix para Maria Silva',
    subtitle: 'Chave: maria@email.com',
    amountCents: '-25000',
    status: 'SENT',
    timestamp: 'Hoje, 14:32',
    correlationId: 'corr-a1b2c3d4-e5f6',
    onAction: () => undefined,
  },
};

export const UnknownState: Story = {
  args: {
    title: 'TED Banco Inter',
    subtitle: 'Ag 0001 • Cc 12345-6',
    amountCents: '-150000',
    status: 'UNKNOWN',
    timestamp: 'Ontem, 09:15',
    correlationId: 'corr-9f8e7d6c-5b4a',
    actionLabel: 'Iniciar reconciliação',
    onAction: () => undefined,
  },
};

export const Settled: Story = {
  args: {
    title: 'Pagamento de boleto',
    subtitle: 'Concessionária Energia',
    amountCents: '-18990',
    status: 'SETTLED',
    timestamp: '30/06, 08:00',
  },
};