import { Tooltip as ChakraTooltip } from '@chakra-ui/react';
import * as React from 'react';

export const Tooltip = React.forwardRef(function Tooltip(props, ref) {
  const { children, content, disabled, ...rest } = props;
  if (disabled) return children;
  return (
    <ChakraTooltip label={content} {...rest}>
      {children}
    </ChakraTooltip>
  );
});
