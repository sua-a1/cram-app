import type { Meta, StoryObj } from '@storybook/react';
import { TicketFeedbackDialog } from './ticket-feedback-dialog';
import { expect, within, userEvent } from '@storybook/test';

const meta = {
  title: 'Tickets/TicketFeedbackDialog',
  component: TicketFeedbackDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onOpenChange: { action: 'onOpenChange' },
  },
} satisfies Meta<typeof TicketFeedbackDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    open: true,
    ticketId: '123',
    userId: '456',
    onOpenChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify dialog title and description
    expect(canvas.getByText('Ticket Feedback')).toBeInTheDocument();
    expect(canvas.getByText(/please rate your experience/i)).toBeInTheDocument();

    // Verify star rating buttons
    const starButtons = canvas.getAllByRole('button');
    expect(starButtons).toHaveLength(7); // 5 stars + Submit + Cancel

    // Click a star rating
    await userEvent.click(starButtons[2]); // Click 3rd star

    // Enter feedback text
    const textarea = canvas.getByPlaceholderText(/additional comments/i);
    await userEvent.type(textarea, 'Great service!');
    expect(textarea).toHaveValue('Great service!');

    // Verify submit button is enabled after rating
    const submitButton = canvas.getByRole('button', { name: /submit feedback/i });
    expect(submitButton).toBeEnabled();
  },
};

export const Closed: Story = {
  args: {
    open: false,
    ticketId: '123',
    userId: '456',
    onOpenChange: () => {},
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify dialog is not visible
    const dialog = canvas.queryByRole('dialog');
    expect(dialog).not.toBeInTheDocument();
  },
}; 
