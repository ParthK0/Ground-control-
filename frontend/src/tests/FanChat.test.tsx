import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FanChat } from '../pages/FanChat';

// Mock Web Speech API
const mockSpeak = vi.fn();
const mockCancel = vi.fn();
vi.stubGlobal('speechSynthesis', {
  speak: mockSpeak,
  cancel: mockCancel,
  getVoices: () => [],
});

// Mock fetch API globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('FanChat Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "This is a mock assistant response.",
        translation: "Esta es una respuesta simulada del asistente."
      })
    });
  });

  const bypassSetup = () => {
    const launchButton = screen.getByRole('button', { name: /Launch Copilot/i });
    fireEvent.click(launchButton);
  };

  it('renders home page after setup and navigates to copilot chat', () => {
    render(<FanChat />);
    
    // Bypass initial preferences screen
    bypassSetup();

    // Check that we can navigate using the Copilot tab
    const copilotTab = screen.getByRole('button', { name: /💬 Copilot/i });
    expect(copilotTab).toBeInTheDocument();

    // Navigate to Copilot Chat
    fireEvent.click(copilotTab);

    // Verify welcome message is visible
    const welcome = screen.getByText(/Welcome to Northgate Stadium! I'm your Matchday Assistant/i);
    expect(welcome).toBeInTheDocument();

    // Check that input text box is rendered
    const input = screen.getByPlaceholderText(/Ask about gates, food, accessibility/i);
    expect(input).toBeInTheDocument();
  });

  it('allows user to switch language and updates welcome text', async () => {
    render(<FanChat />);
    
    // Select Spanish (es) from dropdown
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'es' } });

    bypassSetup();

    // Navigate to Chat
    const copilotTab = screen.getByRole('button', { name: /💬 Copilot/i });
    fireEvent.click(copilotTab);

    // Welcome message should update to Spanish translation
    const welcomeEs = await screen.findByText(/¡Bienvenido al Estadio Northgate!/i);
    expect(welcomeEs).toBeInTheDocument();
  });

  it('allows message input and submission', async () => {
    render(<FanChat />);
    
    bypassSetup();

    // Navigate to Chat
    const copilotTab = screen.getByRole('button', { name: /💬 Copilot/i });
    fireEvent.click(copilotTab);

    const input = screen.getByPlaceholderText(/Ask about gates, food, accessibility/i);
    
    // The send button has an aria-label. Let's find it by name.
    const sendButton = screen.getByRole('button', { name: /Send message/i }); 

    // Type a message
    fireEvent.change(input, { target: { value: 'How do I find Gate A?' } });
    expect(input).toHaveValue('How do I find Gate A?');

    // Click send button
    fireEvent.click(sendButton);

    // The user's query should appear in the message thread
    expect(screen.getByText('How do I find Gate A?')).toBeInTheDocument();
  });
});
