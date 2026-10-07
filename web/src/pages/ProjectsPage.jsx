import { AnimatePresence } from 'framer-motion';
import { FolderPlus, LoaderCircle, Plus, SearchX } from 'lucide-react';
import { useState } from 'react';
import { ProjectCard } from '../components/projects/ProjectCard.jsx';
import { ProjectFormModal } from '../components/projects/ProjectFormModal.jsx';
import { Button } from '../components/ui/Button.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { SegmentedControl } from '../components/ui/SegmentedControl.jsx';
import { useApiQuery } from '../hooks/useApiQuery.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useToast } from '../hooks/useToast.js';
import { projectService } from '../services/projectService.js';
import { PROJECT_STATUS_OPTIONS } from '../utils/constants.js';

const STATUS_FILTERS = [{ value: '', label: 'All' }, ...PROJECT_STATUS_OPTIONS];

function deleteDescription(project) {
  if (!project) return '';
  const { total } = project.taskCounts;
  const taskNote = total > 0 ? ` and its ${total} ${total === 1 ? 'task' : 'tasks'}` : '';
  return `“${project.name}”${taskNote} will be permanently deleted. This cannot be undone.`;
}

export default function ProjectsPage() {
  useDocumentTitle('Projects');
  const toast = useToast();
  const [searchText, setSearchText] = useState('');
  const [status, setStatus] = useState('');
  const search = useDebouncedValue(searchText.trim(), 300);

  const { data: projects, error, isLoading, isRefreshing, reload } = useApiQuery(
    ({ signal }) => projectService.list({ search, status }, { signal }),
    [search, status],
    { keepPreviousData: true, refetchOnFocus: true },
  );

  const [editor, setEditor] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const hasFilters = Boolean(search || status);

  function clearFilters() {
    setSearchText('');
    setStatus('');
  }

  function handleSaved(saved) {
    toast.success(editor?.project ? 'Project updated' : `Project “${saved.name}” created`);
    setEditor(null);
    reload();
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await projectService.remove(projectToDelete.id);
      toast.success(`Deleted “${projectToDelete.name}”`);
      setProjectToDelete(null);
      reload();
    } catch (deleteError) {
      toast.error(deleteError.message);
    } finally {
      setDeleting(false);
    }
  }

  let content;
  if (isLoading) {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading projects">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-60 rounded-2xl" />
        ))}
      </div>
    );
  } else if (error && !projects) {
    content = <ErrorState title="Couldn’t load projects" message={error.message} onRetry={reload} />;
  } else if (projects.length === 0) {
    content = hasFilters ? (
      <EmptyState
        icon={SearchX}
        title="No projects match your filters"
        description="Try a different search term or status."
        action={
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={FolderPlus}
        title="No projects yet"
        description="Create your first project to start organizing tasks."
        action={
          <Button icon={Plus} onClick={() => setEditor({})}>
            New project
          </Button>
        }
      />
    );
  } else {
    content = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout" initial={false}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(selected) => setEditor({ project: selected })}
              onDelete={setProjectToDelete}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace"
        title="Projects"
        description="Everything you’re working on, with live progress from your tasks."
        actions={
          <Button icon={Plus} onClick={() => setEditor({})}>
            New project
          </Button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          value={searchText}
          onChange={setSearchText}
          label="Search projects by name"
          placeholder="Search projects…"
          className="md:max-w-sm md:flex-1"
        />
        <SegmentedControl label="Filter by status" options={STATUS_FILTERS} value={status} onChange={setStatus} />
        <p className="flex items-center gap-2 text-xs text-zinc-500 md:ml-auto" aria-live="polite">
          {isRefreshing && <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />}
          {projects && `${projects.length} ${projects.length === 1 ? 'project' : 'projects'}`}
        </p>
      </div>

      {content}

      <ProjectFormModal
        open={editor !== null}
        project={editor?.project}
        onClose={() => setEditor(null)}
        onSaved={handleSaved}
      />
      <ConfirmDialog
        open={projectToDelete !== null}
        title="Delete project?"
        description={deleteDescription(projectToDelete)}
        confirmLabel="Delete project"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </>
  );
}
