import type { Meta, StoryObj } from '@storybook/react';
import { MoneyDisplay } from './MoneyDisplay';

const meta: Meta<typeof MoneyDisplay> = {
  title: 'Financial/MoneyDisplay',
  component: MoneyDisplay,
  tags: ['autodocs'],
  argTypes: {
    amountCents: { control: 'text' },
    size: { control: 'select', options: ['sm', 'md', 'lg', 'hero'] },
    variant: { control: 'select', options: ['default', 'credit', 'debit', 'masked'] },
  },
};

export default meta;
type Story = StoryObj<typeof MoneyDisplay>;

export const HeroBalance: Story = {
  args: { amountCents: '12543050', size: 'hero' },
};

export const Credit: Story = {
  args: { amountCents: '150000', variant: 'credit', showSign: true },
};

export const Debit: Story = {
  args: { amountCents: '-45990', variant: 'debit', showSign: true },
};

export const Masked: Story = {
  args: { amountCents: '12543050', masked: true },
};