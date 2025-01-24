import type { Meta, StoryObj } from '@storybook/react';
import { OrgSignInForm } from './signin-form';
import { ToastProvider } from '@/components/ui/toast';
import { MockNextRouter } from '@/lib/test/mock-router';
import { MockSupabaseProvider } from '@/lib/test/supabase-context';

const meta: Meta<typeof OrgSignInForm> = {
  title: 'Auth/OrgSignInForm',
  component: OrgSignInForm,
  decorators: [
    (Story) => (
      <MockNextRouter>
        <MockSupabaseProvider>
          <ToastProvider>
            <Story />
          </ToastProvider>
        </MockSupabaseProvider>
      </MockNextRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        push: async () => {},
        replace: async () => {},
      }
    }
  },
};

export default meta;
type Story = StoryObj<typeof OrgSignInForm>;

export const Default: Story = {}; 
