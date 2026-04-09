import React from 'react';
import { Pressable } from 'react-native';

export default function TooltipStub({ children, content, isVisible, onClose }) {
  const child = typeof children === 'function' ? children() : children;
  const title =
    isVisible && React.isValidElement(content) && typeof content.props?.children === 'string'
      ? content.props.children
      : undefined;

  return (
    <Pressable
      onHoverOut={onClose}
      {...(title ? { title } : {})}
      accessibilityRole="none"
    >
      {child}
    </Pressable>
  );
}
