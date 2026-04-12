import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { userService } from '@/services/userService';
import type { SearchResults } from '@/types';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await userService.search({ query: q });
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  const clear = useCallback(() => {
    setQuery('');
    setResults(null);
  }, []);

  return { query, setQuery, results, isLoading, clear };
}
