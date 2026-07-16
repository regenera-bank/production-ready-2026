import type { Preview } from '@storybook/react';
import '../src/tokens/regenera.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'regenera-deep',
      values: [
        { name: 'regenera-deep', value: '#020617' },
        { name: 'regenera-mid', value: '#0f172a' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;