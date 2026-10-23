import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import catalog from '../assets/content/bible-versions-index.json';
import { getInstalledTranslationIds, removeTranslation } from '@/src/database';
import { useDownloads, type DownloadJob } from '@/src/downloadManager';
import { useSettings } from '@/src/store';
import { usePalette, type AppPalette } from '@/src/theme';
import { PageHeader } from '@/src/ui';
import { versionSizeBytes } from '@/src/versionInstaller';
import { translationBadge, translationIdFor } from '@/src/versions';

type Entry = { name: string; abbreviation: string };
type Group = { language: string; versions: Entry[] };
type Section = { title: string; data: Array<Entry & { language: string }>; installedCount: number };

const megabytes = (bytes: number) => `${Math.max(0.1, bytes / 1_000_000).toFixed(bytes >= 10_000_000 ? 0 : 1)} MB`;
const percent = (job: DownloadJob) => Math.min(99, Math.round((job.received / Math.max(1, job.total)) * 100));

function ProgressBar({ value, palette }: { value: number; palette: AppPalette }) {
  return <View style={[styles.track, { backgroundColor: palette.border }]}><View style={[styles.fill, { backgroundColor: palette.accent, width: `${Math.max(2, Math.min(100, value * 100))}%` }]} /></View>;
}

/** One download with live progress and pause / resume / cancel. */
function JobCard({ job, palette }: { job: DownloadJob; palette: AppPalette }) {
  const { pause, resume, cancel, start, dismiss } = useDownloads.getState();
  const downloading = job.status === 'downloading';
  const paused = job.status === 'paused';
  const saving = job.status === 'saving';
  const failed = job.status === 'error';
  const progress = saving ? job.saved : job.received / Math.max(1, job.total);
  const detail = failed ? job.error ?? 'The download failed.'
    : saving ? `Saving to your device… ${Math.round(job.saved * 100)}%`
    : `${paused ? 'Paused · ' : ''}${megabytes(job.received)} of ${megabytes(job.total)} · ${percent(job)}%`;
  return <View style={[styles.job, { backgroundColor: palette.surface, borderColor: failed ? '#c0675c' : palette.border }]}>
    <View style={styles.jobTop}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.jobName, { color: palette.text }]} numberOfLines={1}>{job.name}</Text>
        <Text style={[styles.jobDetail, { color: failed ? '#e08b80' : palette.mutedText }]} numberOfLines={failed ? 3 : 1}>{detail}</Text>
      </View>
      {(downloading || paused) && <TouchableOpacity onPress={() => (downloading ? pause : resume)(job.abbreviation)} style={[styles.jobButton, { backgroundColor: palette.elevated }]} accessibilityLabel={downloading ? `Pause ${job.name}` : `Resume ${job.name}`}><Ionicons name={downloading ? 'pause' : 'play'} size={16} color={palette.accent} /></TouchableOpacity>}
      {(downloading || paused) && <TouchableOpacity onPress={() => cancel(job.abbreviation)} style={[styles.jobButton, { backgroundColor: palette.elevated }]} accessibilityLabel={`Cancel ${job.name}`}><Ionicons name="close" size={17} color={palette.text} /></TouchableOpacity>}
      {failed && <TouchableOpacity onPress={() => start(job.abbreviation, job.name)} style={[styles.jobTextButton, { backgroundColor: palette.accent }]}><Text style={[styles.jobTextButtonLabel, { color: palette.background }]}>Retry</Text></TouchableOpacity>}
      {failed && <TouchableOpacity onPress={() => dismiss(job.abbreviation)} style={[styles.jobButton, { backgroundColor: palette.elevated }]} accessibilityLabel="Dismiss"><Ionicons name="close" size={17} color={palette.text} /></TouchableOpacity>}
    </View>
    {!failed && <ProgressBar value={progress} palette={palette} />}
  </View>;
}

type RowProps = { item: Entry & { language: string }; installed: boolean; selected: boolean; job?: DownloadJob; palette: AppPalette; onUse: () => void; onDownload: () => void; onRemove: () => void };
const VersionRow = memo(function VersionRow({ item, installed, selected, job, palette, onUse, onDownload, onRemove }: RowProps) {
  const translationId = translationIdFor(item.abbreviation);
  const busy = !!job && job.status !== 'error';
  return <View style={[styles.row, { borderBottomColor: palette.border }, selected && { backgroundColor: palette.surface }]}>
    <View style={[styles.badge, { backgroundColor: palette.elevated }]}><Text style={[styles.badgeText, { color: palette.accent }]} numberOfLines={1}>{translationBadge(translationId).slice(0, 6)}</Text></View>
    <View style={{ flex: 1 }}>
      <Text style={[styles.name, { color: palette.text }]} numberOfLines={2}>{item.name}</Text>
      <Text style={[styles.meta, { color: palette.mutedText }]}>{installed ? 'On this device' : megabytes(versionSizeBytes(item.abbreviation))}{job?.status === 'paused' ? ' · paused' : ''}</Text>
    </View>
    {busy ? <View style={styles.busy}>
      <Text style={[styles.busyText, { color: palette.accent }]}>{job.status === 'saving' ? 'Saving' : `${percent(job)}%`}</Text>
      {job.status !== 'saving' && <TouchableOpacity onPress={() => (job.status === 'paused' ? useDownloads.getState().resume : useDownloads.getState().pause)(job.abbreviation)} style={styles.tiny} accessibilityLabel={job.status === 'paused' ? 'Resume download' : 'Pause download'}><Ionicons name={job.status === 'paused' ? 'play' : 'pause'} size={15} color={palette.text} /></TouchableOpacity>}
    </View>
    : installed ? <View style={styles.actions}>
      {selected ? <View style={[styles.pill, { backgroundColor: palette.accent }]}><Ionicons name="checkmark" size={13} color={palette.background} /><Text style={[styles.pillText, { color: palette.background }]}>In use</Text></View>
        : <TouchableOpacity onPress={onUse} style={[styles.pill, { backgroundColor: palette.elevated }]} accessibilityLabel={`Use ${item.name}`}><Text style={[styles.pillText, { color: palette.text }]}>Use</Text></TouchableOpacity>}
      {translationId !== 'KJV' && <TouchableOpacity onPress={onRemove} style={styles.tiny} accessibilityLabel={`Remove ${item.name} from this device`}><Ionicons name="trash-outline" size={16} color={palette.mutedText} /></TouchableOpacity>}
    </View>
    : <TouchableOpacity onPress={onDownload} style={[styles.pill, { backgroundColor: palette.elevated }]} accessibilityLabel={`Download ${item.name}`}><Ionicons name="cloud-download-outline" size={14} color={palette.accent} /><Text style={[styles.pillText, { color: palette.text }]}>Get</Text></TouchableOpacity>}
  </View>;
});

export default function VersionsScreen() {
  const palette = usePalette();
  const [query, setQuery] = useState('');
  const [onlyInstalled, setOnlyInstalled] = useState(false);
  const [installed, setInstalled] = useState<Set<string>>(new Set(['KJV']));
  const jobs = useDownloads((state) => state.jobs);
  const tick = useDownloads((state) => state.installedTick);
  const startDownload = useDownloads((state) => state.start);
  const selected = useSettings((state) => state.selectedTranslation);
  const setSelected = useSettings((state) => state.setSelectedTranslation);

  const refresh = useCallback(async () => {
    try { setInstalled(new Set(['KJV', ...(await getInstalledTranslationIds())])); } catch { /* keep the last known list */ }
  }, []);
  useEffect(() => { void refresh(); }, [refresh, tick]);

  const sections = useMemo<Section[]>(() => {
    const term = query.trim().toLowerCase();
    return (catalog as Group[]).map((group) => {
      const list = group.versions
        .filter((version) => (!onlyInstalled || installed.has(translationIdFor(version.abbreviation))) && (!term || group.language.toLowerCase().includes(term) || version.name.toLowerCase().includes(term) || version.abbreviation.toLowerCase().includes(term)))
        .map((version) => ({ ...version, language: group.language }));
      return { title: group.language, data: list, installedCount: list.filter((version) => installed.has(translationIdFor(version.abbreviation))).length };
    }).filter((section) => section.data.length > 0);
  }, [query, onlyInstalled, installed]);

  const total = (catalog as Group[]).reduce((sum, group) => sum + group.versions.length, 0);
  const activeJobs = Object.values(jobs);

  const use = (abbreviation: string) => { setSelected(translationIdFor(abbreviation)); router.back(); };
  const download = (item: Entry) => Alert.alert(`Download ${item.name}?`, `${megabytes(versionSizeBytes(item.abbreviation))} will be downloaded once and kept on this device for offline reading. You can pause or cancel at any time.`, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Download', onPress: () => startDownload(item.abbreviation, item.name) },
  ]);
  const remove = (item: Entry) => Alert.alert(`Remove ${item.name}?`, 'The text is deleted from this device. You can download it again later. Your notes and bookmarks are kept.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Remove', style: 'destructive', onPress: async () => {
      try {
        const id = translationIdFor(item.abbreviation);
        await removeTranslation(id);
        if (useSettings.getState().selectedTranslation === id) setSelected('KJV');
        await refresh();
      } catch { Alert.alert('Unable to remove', 'Please try again.'); }
    } },
  ]);

  const header = <View>
    <View style={[styles.search, { backgroundColor: palette.surface, borderColor: palette.border }]}><Ionicons name="search" size={17} color={palette.mutedText} /><TextInput value={query} onChangeText={setQuery} placeholder="Search a language or version" placeholderTextColor={palette.mutedText} style={[styles.input, { color: palette.text }]} autoCorrect={false} />{query ? <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search"><Ionicons name="close-circle" size={17} color={palette.mutedText} /></TouchableOpacity> : null}</View>
    <View style={styles.chips}>{([['All languages', false], ['On this device', true]] as const).map(([label, value]) => <TouchableOpacity key={label} onPress={() => setOnlyInstalled(value)} style={[styles.chip, { borderColor: onlyInstalled === value ? palette.accent : palette.border, backgroundColor: onlyInstalled === value ? palette.surface : 'transparent' }]}><Text style={[styles.chipText, { color: onlyInstalled === value ? palette.accent : palette.mutedText }]}>{label}</Text></TouchableOpacity>)}</View>
    {activeJobs.length > 0 && <View style={styles.jobs}><Text style={[styles.jobsLabel, { color: palette.mutedText }]}>DOWNLOADS</Text>{activeJobs.map((job) => <JobCard key={job.abbreviation} job={job} palette={palette} />)}</View>}
  </View>;

  return <View style={[styles.safe, { backgroundColor: palette.background }]}>
    <PageHeader title="Bible versions" subtitle={`${total} versions · ${(catalog as Group[]).length} languages · ${installed.size} on this device`} close />
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.abbreviation}
      stickySectionHeadersEnabled
      ListHeaderComponent={header}
      contentContainerStyle={styles.list}
      initialNumToRender={20}
      keyboardShouldPersistTaps="handled"
      renderSectionHeader={({ section }) => <View style={[styles.section, { backgroundColor: palette.background, borderBottomColor: palette.accent }]}>
        <Text style={[styles.sectionTitle, { color: palette.text }]}>{section.title}</Text>
        <Text style={[styles.sectionCount, { color: palette.mutedText }]}>{section.data.length} {section.data.length === 1 ? 'version' : 'versions'}{section.installedCount ? ` · ${section.installedCount} downloaded` : ''}</Text>
      </View>}
      renderItem={({ item }) => {
        const id = translationIdFor(item.abbreviation);
        return <VersionRow item={item} installed={installed.has(id)} selected={selected === id} job={jobs[item.abbreviation]} palette={palette} onUse={() => use(item.abbreviation)} onDownload={() => download(item)} onRemove={() => remove(item)} />;
      }}
      ListEmptyComponent={<Text style={[styles.empty, { color: palette.mutedText }]}>{onlyInstalled ? 'Nothing matches on this device yet.' : 'No versions match your search.'}</Text>}
    />
  </View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, list: { paddingHorizontal: 16, paddingBottom: 34 },
  search: { height: 46, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 14, paddingHorizontal: 13, marginTop: 6 }, input: { flex: 1, fontSize: 13 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 4 }, chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 7 }, chipText: { fontSize: 11, fontWeight: '700' },
  jobs: { marginTop: 10 }, jobsLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8 }, job: { borderWidth: 1, borderRadius: 15, padding: 12, marginBottom: 9 }, jobTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobName: { fontSize: 12, fontWeight: '700' }, jobDetail: { fontSize: 10, marginTop: 4 }, jobButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, jobTextButton: { borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8 }, jobTextButtonLabel: { fontSize: 11, fontWeight: '700' },
  track: { height: 5, borderRadius: 3, marginTop: 10, overflow: 'hidden' }, fill: { height: 5, borderRadius: 3 },
  section: { paddingTop: 16, paddingBottom: 8, borderBottomWidth: 2, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 6 }, sectionTitle: { fontSize: 16, fontWeight: '700' }, sectionCount: { fontSize: 10 },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8, paddingHorizontal: 4 }, badge: { minWidth: 42, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }, badgeText: { fontSize: 10, fontWeight: '800' },
  name: { fontSize: 12, fontWeight: '600' }, meta: { fontSize: 10, marginTop: 3 }, actions: { flexDirection: 'row', alignItems: 'center', gap: 2 }, pill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 }, pillText: { fontSize: 11, fontWeight: '700' },
  tiny: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }, busy: { flexDirection: 'row', alignItems: 'center', gap: 2 }, busyText: { fontSize: 11, fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 34, fontSize: 12 },
});
