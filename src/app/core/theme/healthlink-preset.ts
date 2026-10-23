import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Aura with a strong blue primary colour (close to the mockup buttons).
 * `primary.500` is the main button colour in light mode.
 */
export const HealthLinkPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#eff5ff',
      100: '#dbe7fe',
      200: '#bfd4fe',
      300: '#93b7fd',
      400: '#6090fa',
      500: '#2563eb',
      600: '#1d4fd8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#172b6b',
      950: '#0f1c45',
    },
  },
});
