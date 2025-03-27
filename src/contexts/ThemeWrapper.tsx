import { createContext, ReactNode } from 'react';
import { MantineProvider } from '@mantine/core';

const ThemeContext = createContext<string | null>(null);

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={null}>
      <MantineProvider defaultColorScheme='auto'>{children}</MantineProvider>
    </ThemeContext.Provider>
  );
}
