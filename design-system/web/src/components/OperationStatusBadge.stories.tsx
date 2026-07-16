import type { Meta, StoryObj } from '@storybook/react';
import { OperationStatusBadge } from './OperationStatusBadge';

const meta: Meta<typeof OperationStatusBadge> = {
  title: 'Financial/OperationStatusBadge',
  component: OperationStatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: [
        'CREATED',
        'AUTHORIZED',
        'SENT',
        'SETTLED',
        'UNKNOWN',
        'FAILED',
        'RECONCILED',
        'PROCESSING',
        'BLOCKED',
        'STEP_UP_REQUIRED',
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof OperationStatusBadge>;

export const Settled: Story = { args: { status: 'SETTLED' } };
export const Unknown: Story = { args: { status: 'UNKNOWN' } };
export const Processing: Story = { args: { status: 'PROCESSING' } };
export const Failed: Story = { args: { status: 'FAILED' } };

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxWidth: 320 }}>
      {(
        [
          'CREATED',
          'AUTHORIZED',
          'PROCESSING',
          'SENT',
          'SETTLED',
          'UNKNOWN',
          'FAILED',
          'RECONCILED',
          'BLOCKED',
          'STEP_UP_REQUIRED',
        ] as const
      ).map((status) => (
        <OperationStatusBadge key={status} status={status} />
      ))}
    </div>
  ),
};