import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { themeArt } from './art';
import { useSettings } from './store';
import { usePalette } from './theme';

export const withAlpha = (hex: string, alpha: number) => {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};

/** The theme's picture, framed so the glow and hills show, with a soft fade into the page background. */
export function ThemedArt({ flip, height }: { flip?: boolean; height: number }) {
  const palette = usePalette();
  const appearance = useSettings((state) => state.appearance);
  const { width } = useWindowDimensions();
  const artWidth = Math.max(width, (height * 1080) / 780);
  const artHeight = (artWidth * 780) / 1080;
  const top = Math.min(0, Math.max(height - artHeight, height / 2 - 0.56 * artHeight));
  return <>
    <Image source={themeArt[appearance]} resizeMode="cover" style={{ position: 'absolute', width: artWidth, height: artHeight, top, left: (width - artWidth) / 2, transform: flip ? [{ scaleX: -1 }] : undefined }} />
    <LinearGradient pointerEvents="none" style={StyleSheet.absoluteFill} locations={[0, 0.28, 0.7, 1]} colors={[withAlpha(palette.background, 0.4), withAlpha(palette.background, 0), withAlpha(palette.background, 0.35), palette.background]} />
  </>;
}

/** Full-width page header that extends under the status bar, so the app fills the whole screen. */
export function Hero({ kicker, title, subtitle, height = 168, flip, left, right, children }: { kicker?: string; title: string; subtitle?: string; height?: number; flip?: boolean; left?: ReactNode; right?: ReactNode; children?: ReactNode }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  return <View style={{ height: height + insets.top, overflow: 'hidden', backgroundColor: palette.background }}>
    <ThemedArt flip={flip} height={height + insets.top} />
    <View style={[styles.heroContent, { paddingTop: insets.top + 10 }]}>
      <View style={styles.heroTop}><View>{left}</View><View style={styles.heroRight}>{right}</View></View>
      <View>
        {kicker ? <Text style={[styles.kicker, { color: palette.text, opacity: 0.8 }]}>{kicker}</Text> : null}
        <Text style={[styles.heroTitle, { color: palette.text }]}>{title}</Text>
        {subtitle ? <Text style={[styles.heroSub, { color: palette.text, opacity: 0.85 }]}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  </View>;
}

/** Compact header for inner pages and modals, with a back (or close) button. */
export function PageHeader({ title, subtitle, onBack, close, right }: { title: string; subtitle?: string; onBack?: () => void; close?: boolean; right?: ReactNode }) {
  const palette = usePalette();
  const insets = useSafeAreaInsets();
  return <View style={{ height: 92 + insets.top, overflow: 'hidden', backgroundColor: palette.background }}>
    <ThemedArt flip height={92 + insets.top} />
    <View style={[styles.pageRow, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onBack ?? (() => router.back())} style={[styles.roundButton, { backgroundColor: withAlpha(palette.background, 0.55), borderColor: palette.border }]} accessibilityLabel={close ? 'Close' : 'Go back'}>
        <Ionicons name={close ? 'close' : 'chevron-back'} size={21} color={palette.text} />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pageTitle, { color: palette.text }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[styles.pageSub, { color: palette.text, opacity: 0.8 }]} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.pageRight}>{right}</View>
    </View>
  </View>;
}

/** Round translucent icon button used on top of artwork. */
export function IconButton({ icon, onPress, label }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string }) {
  const palette = usePalette();
  return <TouchableOpacity onPress={onPress} accessibilityLabel={label} style={[styles.roundButton, { backgroundColor: withAlpha(palette.background, 0.55), borderColor: palette.border }]}><Ionicons name={icon} size={20} color={palette.text} /></TouchableOpacity>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  return <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }, style]}>{children}</View>;
}

export function SectionLabel({ children, style }: { children: string; style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  return <Text style={[styles.sectionLabel, { color: palette.mutedText }, style as never]}>{children}</Text>;
}

/** Friendly empty state used instead of a blank page. */
export function EmptyState({ icon, title, body, action }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; action?: ReactNode }) {
  const palette = usePalette();
  return <View style={styles.empty}>
    <View style={[styles.emptyIcon, { backgroundColor: palette.elevated }]}><Ionicons name={icon} size={26} color={palette.accent} /></View>
    <Text style={[styles.emptyTitle, { color: palette.text }]}>{title}</Text>
    <Text style={[styles.emptyBody, { color: palette.mutedText }]}>{body}</Text>
    {action}
  </View>;
}

export function PrimaryButton({ label, onPress, icon, disabled, style }: { label: string; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const palette = usePalette();
  return <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.85} style={[styles.primary, { backgroundColor: palette.accent, opacity: disabled ? 0.5 : 1 }, style]} accessibilityRole="button">
    {icon ? <Ionicons name={icon} size={17} color={palette.background} /> : null}
    <Text style={[styles.primaryText, { color: palette.background }]}>{label}</Text>
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  heroContent: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, paddingHorizontal: 21, paddingBottom: 14, justifyContent: 'space-between' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroRight: { flexDirection: 'row', gap: 8 },
  kicker: { fontSize: 10, fontWeight: '700', letterSpacing: 1.6 },
  heroTitle: { fontSize: 31, fontWeight: '700', marginTop: 3 },
  heroSub: { fontSize: 13, marginTop: 4 },
  pageRow: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  roundButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { fontSize: 19, fontWeight: '700' },
  pageSub: { fontSize: 11, marginTop: 2 },
  pageRight: { minWidth: 40, alignItems: 'flex-end' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginTop: 22, marginBottom: 10 },
  empty: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 48 },
  emptyIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 14 },
  emptyBody: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  primary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20 },
  primaryText: { fontSize: 14, fontWeight: '700' },
});
