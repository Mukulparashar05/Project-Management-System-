import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Orbit` : 'Orbit · Project Management';
  }, [title]);
}
