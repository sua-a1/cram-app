import type { Meta, StoryObj } from '@storybook/react';
import { TicketFeedbackPrompt } from './ticket-feedback-prompt';
import { expect, within, userEvent } from '@storybook/test';

const meta = {
  title: 'Tickets/TicketFeedbackPrompt',
  component: TicketFeedbackPrompt,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TicketFeedbackPrompt>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ticketId: '123',
    userId: '456',
    hasFeedback: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the prompt is visible
    const prompt = canvas.getByText('Help us improve! Share your feedback about this ticket.');
    expect(prompt).toBeInTheDocument();

    // Verify the button is present and clickable
    const button = canvas.getByRole('button', { name: /provide feedback/i });
    expect(button).toBeInTheDocument();

    // Click the button and verify the dialog opens
    await userEvent.click(button);
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeInTheDocument();
  },
};

export const WithExistingFeedback: Story = {
  args: {
    ticketId: '123',
    userId: '456',
    hasFeedback: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the prompt is not visible when feedback exists
    const prompt = canvas.queryByText('Help us improve! Share your feedback about this ticket.');
    expect(prompt).not.toBeInTheDocument();
  },
}; 
