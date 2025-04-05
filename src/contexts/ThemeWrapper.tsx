import { createContext, ReactNode } from 'react';
import {
  createTheme,
  MantineColorsTuple,
  MantineProvider,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';

const ThemeContext = createContext<string | null>(null);

// Provide custom colors to the MantineProvider with 10 shades
// https://mantine.dev/theming/colors/#adding-extra-colors
// https://mantine.dev/colors-generator/?color=744c39
const primaryColor: MantineColorsTuple = [
  '#f8f4f1',
  '#eae6e4',
  '#d7c9c3',
  '#c4ab9e',
  '#b59180',
  '#ac806c',
  '#a87861',
  '#936650',
  '#845a46',
  '#744c39', // This is --color-primary
];

const theme = createTheme({
  // HACK Keep in synch with Palette in src/index.css
  primaryColor: 'primaryColor',
  colors: { primaryColor },
});

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={null}>
      <MantineProvider defaultColorScheme='auto' theme={theme}>
        <Notifications limit={10} autoClose={6000} position='top-right' />
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  );
}
