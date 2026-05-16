import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { typeScale } from '@/constants/design-tokens';

interface TextLinkProps extends Omit<PressableProps, 'children'> {
  label: string;
}

/** Tertiary CTA — gold label with underline (tabs use `UnderlineTabRow` / dock instead). */
export function TextLink({ label, style, ...props }: TextLinkProps) {
  return (
    <Pressable
      {...props}
      accessibilityRole="link"
      hitSlop={10}
      style={(state) => [
        styles.hit,
        typeof style === 'function' ? style(state) : style,
      ]}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  label: typeScale.tertiaryLink,
});
