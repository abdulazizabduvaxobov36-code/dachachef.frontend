// Chakra v2 color mode
export function ColorModeProvider({ children }) {
  return children;
}
export function useColorMode() {
  return { colorMode: 'light', toggleColorMode: () => {} };
}
