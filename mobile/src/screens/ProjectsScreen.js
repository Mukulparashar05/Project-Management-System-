import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { ProjectCard } from '../components/projects/ProjectCard';
import { Button } from '../components/ui/Button';
import { ChipGroup } from '../components/ui/Chips';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState, ErrorState, InlineMessage, LoadingState } from '../components/ui/StateViews';
import { Screen } from '../components/ui/Screen';
import { useApiResource } from '../hooks/useApiResource';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { projectService } from '../services/projectService';
import { colors, typography } from '../theme';
import { PROJECT_STATUS_OPTIONS, withAllOption } from '../utils/constants';

const STATUS_FILTERS = withAllOption(PROJECT_STATUS_OPTIONS);

function Separator() {
  return <View style={styles.separator} />;
}

export function ProjectsScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const search = useDebouncedValue(searchText.trim());
  const { data: projects, error, isLoading, isUpdating, refreshing, refresh, reload } = useApiResource(
    () => projectService.list({ search, status }),
    [search, status],
  );
  const hasFilters = Boolean(search || status);

  function clearFilters() {
    setSearchText('');
    setStatus('');
  }

  let emptyContent;
  if (isLoading) emptyContent = <LoadingState label="Loading projects…" />;
  else if (!projects) emptyContent = <ErrorState error={error} title="Couldn’t load projects" onRetry={reload} />;
  else if (hasFilters) {
    emptyContent = (
      <EmptyState
        icon="search-outline"
        title="No projects match"
        message="Try a different search or status."
        action={<Button title="Clear filters" variant="secondary" compact onPress={clearFilters} />}
      />
    );
  } else {
    emptyContent = (
      <EmptyState
        icon="folder-open-outline"
        title="No projects yet"
        message="Projects you create in the Orbit web app appear here. Pull down to refresh."
      />
    );
  }

  const header = (
    <View style={styles.header}>
      <Text style={typography.eyebrow}>WORKSPACE</Text>
      <Text style={[typography.title, styles.title]} accessibilityRole="header">
        Projects
      </Text>
      <SearchBar
        value={searchText}
        onChangeText={setSearchText}
        placeholder="Search projects"
        accessibilityLabel="Search projects by name"
      />
      <ChipGroup label="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
      <View style={styles.countRow}>
        {projects && (
          <Text style={typography.caption}>
            {projects.length} {projects.length === 1 ? 'project' : 'projects'}
          </Text>
        )}
        {isUpdating && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
      {projects && <InlineMessage message={error?.message} />}
    </View>
  );

  return (
    <Screen edges={['top']}>
      <FlatList
        data={projects ?? []}
        keyExtractor={(project) => project.id}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id, projectName: item.name })}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyContent}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        testID="projects-list"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primaryStrong]}
            progressBackgroundColor={colors.surfaceRaised}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 16, paddingBottom: 32 },
  header: { gap: 14, marginBottom: 16 },
  title: { marginTop: -8 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 20 },
  separator: { height: 12 },
});
