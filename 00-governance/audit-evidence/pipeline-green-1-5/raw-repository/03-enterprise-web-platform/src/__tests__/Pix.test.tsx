import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PixKeyForm } from '../features/pix/ui/PixKeyForm';

describe('PixKeyForm Component', () => {
  it('renders dropdown for selecting key type and input field', () => {
    render(<PixKeyForm />);

    expect(screen.getByText('Select Key Type')).toBeInTheDocument();
    expect(screen.getByText('Key Value')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Verify Receiver/i })).toBeInTheDocument();
  });

  it('allows selecting key type and typing in the value', () => {
    render(<PixKeyForm />);

    const select = screen.getByRole('combobox');
    const input = screen.getByPlaceholderText('000.000.000-00');

    fireEvent.change(select, { target: { value: 'E-mail' } });
    fireEvent.change(input, { target: { value: 'test@example.com' } });

    expect(select).toHaveValue('E-mail');
    expect(input).toHaveValue('test@example.com');
  });
});
