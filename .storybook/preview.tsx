import React from 'react';
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/',
        push: async () => {},
        replace: async () => {},
      }
    }
  },
  decorators: [
    (Story) => (
      <div id="root">
        <Story />
      </div>
    ),
  ],
};

export default preview; 
