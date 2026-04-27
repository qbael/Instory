import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './useDebounce';
import { userService } from '@/services/userService';
import type { SearchResults, SearchType } from '@/types';

export function useSearch(type: SearchType) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const search = useCallback(async (q: string, t: SearchType) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setIsLoading(true);
    try {
      if (t === 'people') {
        const { data } = await userService.searchUsers(q);
        setResults({ users: data, posts: [], hashtags: [] });
      } else if (t === 'posts') {
        const { data } = await userService.searchPosts(q);
        setResults({ users: [], posts: data, hashtags: [] });
      } else {
        const { data } = await userService.searchHashtags(q);
        setResults({ users: [], posts: [], hashtags: data });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    search(debouncedQuery, type);
  }, [debouncedQuery, type, search]);

  const clear = useCallback(() => {
    setQuery('');
    setResults(null);
  }, []);

  return { query, setQuery, results, isLoading, clear };
}
