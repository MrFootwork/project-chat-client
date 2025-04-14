import { createContext, ReactNode, useEffect, useState } from 'react';
import {
  createTheme,
  MantineColorsTuple,
  MantineProvider,
} from '@mantine/core';
import { Notifications } from '@mantine/notifications';

type ThemeContextType = {
  isMobile: boolean;
  showButtonContainer: boolean;
  toggleButtonContainer: () => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  isMobile: true,
  showButtonContainer: false,
  toggleButtonContainer: () => {},
});

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

// breakpoint for mobile is 620px
const BREAKPOINT_MOBILE = 620;

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  // Mobile
  const [isMobile, setIsMobile] = useState<boolean>(true);

  const handleResize = () => {
    setIsMobile(window.innerWidth <= BREAKPOINT_MOBILE);
    return window.innerWidth <= BREAKPOINT_MOBILE;
  };

  useEffect(() => {
    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Show Button Container
  const [showButtonContainer, setShowButtonContainer] = useState(false);

  function toggleButtonContainer() {
    setShowButtonContainer(prev => !prev);
  }

  return (
    <ThemeContext.Provider
      value={{ isMobile, showButtonContainer, toggleButtonContainer }}
    >
      <MantineProvider defaultColorScheme='auto' theme={theme}>
        <Notifications limit={10} autoClose={4000} position='top-right' />
        {children}
      </MantineProvider>
    </ThemeContext.Provider>
  );
}
