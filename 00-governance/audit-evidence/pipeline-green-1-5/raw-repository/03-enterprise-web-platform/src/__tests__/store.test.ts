import { describe, it, expect, vi, beforeAll } from 'vitest';
import { useStore } from '../shared/lib/store';

describe('useStore actions', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      value: {
        replace: vi.fn(),
      },
      writable: true,
    });
  });

  it('setUser updates user profile', () => {
    useStore.getState().setUser({ name: 'Paulo Ricardo', email: 'paulo@regenerabank.app', tier: 'Premium', id: '123' });
    expect(useStore.getState().user?.name).toBe('Paulo Ricardo');
  });

  it('setAuthenticated updates auth state', () => {
    useStore.getState().setAuthenticated(true);
    expect(useStore.getState().isAuthenticated).toBe(true);
  });

  it('setTheme updates visual theme', () => {
    useStore.getState().setTheme('purple');
    expect(useStore.getState().theme).toBe('purple');
  });

  it('showToast triggers temporary success notification', () => {
    vi.useFakeTimers();
    useStore.getState().showToast('Transfer completed', 'success');
    expect(useStore.getState().toast?.message).toBe('Transfer completed');
    expect(useStore.getState().toast?.type).toBe('success');
    vi.runAllTimers();
    expect(useStore.getState().toast).toBeNull();
    vi.useRealTimers();
  });

  it('showFeedback triggers toast notification', () => {
    vi.useFakeTimers();
    useStore.getState().showFeedback('Done', 'security');
    expect(useStore.getState().toast?.message).toBe('Done');
    vi.runAllTimers();
    expect(useStore.getState().toast).toBeNull();
    vi.useRealTimers();
  });

  it('updateBalanceCents increments global balance', () => {
    useStore.setState({ globalBalanceCents: 1000 });
    useStore.getState().updateBalanceCents(500);
    expect(useStore.getState().globalBalanceCents).toBe(1500);
  });

  it('setSidebarOpen updates sidebar visibility state', () => {
    useStore.getState().setSidebarOpen(true);
    expect(useStore.getState().sidebarOpen).toBe(true);
  });

  it('toggleSidebar negates sidebar visibility', () => {
    useStore.setState({ sidebarOpen: false });
    useStore.getState().toggleSidebar();
    expect(useStore.getState().sidebarOpen).toBe(true);
  });

  it('logout cleans tokens, state and redirects', () => {
    sessionStorage.setItem('neural_token', 'test_token');
    useStore.getState().logout();
    expect(useStore.getState().user).toBeNull();
    expect(useStore.getState().isAuthenticated).toBe(false);
    expect(sessionStorage.getItem('neural_token')).toBeNull();
    expect(window.location.replace).toHaveBeenCalledWith('/login');
  });
});
