import { useEffect } from 'react';

/**
 * Hook to prevent accidental navigation/reload when a form is dirty.
 * @param shouldPrevent - boolean indicating if navigation should be prevented
 */
export function usePreventNavigation(shouldPrevent: boolean) {
  useEffect(() => {
    if (!shouldPrevent) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Included for legacy support, e.g. Chrome/Edge < 119
      event.returnValue = true;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldPrevent]);
}
