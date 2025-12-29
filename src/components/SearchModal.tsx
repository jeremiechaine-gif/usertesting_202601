import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Clock, Zap, Calendar, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRoutines, type Routine } from '@/lib/routines';
import { getCurrentUserId } from '@/lib/users';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  type: 'search' | 'routine';
  routineId?: string;
}

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (page: string) => void;
  onRoutineClick?: (routineId: string) => void;
}

const MAX_HISTORY_ITEMS = 50;
const HISTORY_STORAGE_KEY = 'pelico-search-history';

const getSearchHistory = (): SearchHistoryItem[] => {
  try {
    const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid data, return empty array
  }
  return [];
};

const saveSearchHistory = (history: SearchHistoryItem[]) => {
  try {
    // Keep only the most recent items
    const limited = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limited));
  } catch {
    // Storage full or error, ignore
  }
};

const addToHistory = (item: Omit<SearchHistoryItem, 'id' | 'timestamp'>) => {
  const history = getSearchHistory();
  const newItem: SearchHistoryItem = {
    ...item,
    id: `history-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
  };
  // Remove duplicates (same query and type)
  const filtered = history.filter(
    (h) => !(h.query === newItem.query && h.type === newItem.type && h.routineId === newItem.routineId)
  );
  const updated = [newItem, ...filtered];
  saveSearchHistory(updated);
};

const getHistoryByPeriod = (history: SearchHistoryItem[]) => {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  return {
    recent: history.filter((h) => h.timestamp >= oneDayAgo),
    lastWeek: history.filter((h) => h.timestamp >= oneWeekAgo && h.timestamp < oneDayAgo),
    lastMonth: history.filter((h) => h.timestamp >= oneMonthAgo && h.timestamp < oneWeekAgo),
    older: history.filter((h) => h.timestamp < oneMonthAgo),
  };
};

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onOpenChange,
  onNavigate,
  onRoutineClick,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);

  useEffect(() => {
    if (open) {
      setHistory(getSearchHistory());
      setSearchQuery('');
    }
  }, [open]);

  const historyByPeriod = useMemo(() => {
    return getHistoryByPeriod(history);
  }, [history]);

  const routines = useMemo(() => {
    return getRoutines();
  }, []);

  const filteredRoutines = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return routines.filter(
      (r) =>
        r.name.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query)
    );
  }, [searchQuery, routines]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      addToHistory({ query: query.trim(), type: 'search' });
      setHistory(getSearchHistory());
      // TODO: Implement actual search functionality
    }
  };

  const handleRoutineClick = (routine: Routine) => {
    addToHistory({
      query: routine.name,
      type: 'routine',
      routineId: routine.id,
    });
    setHistory(getSearchHistory());
    onRoutineClick?.(routine.id);
    onOpenChange(false);
  };

  const handleHistoryItemClick = (item: SearchHistoryItem) => {
    if (item.type === 'routine' && item.routineId) {
      const routine = routines.find((r) => r.id === item.routineId);
      if (routine) {
        handleRoutineClick(routine);
      }
    } else {
      setSearchQuery(item.query);
      handleSearch(item.query);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const hasHistory = history.length > 0;
  const hasResults = filteredRoutines.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search routines, views, and more..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleSearch(searchQuery);
                }
              }}
              className="pl-9 pr-20"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-muted-foreground">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
                {navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'}
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">K</kbd>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6 pb-6">
          {!searchQuery.trim() ? (
            // Show history when no search query
            <div className="space-y-6">
              {hasHistory ? (
                <>
                  {historyByPeriod.recent.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Recent</h3>
                      </div>
                      <div className="space-y-1">
                        {historyByPeriod.recent.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start gap-3 h-auto py-2 px-3"
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            {item.type === 'routine' ? (
                              <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="flex-1 text-left text-sm">{item.query}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(item.timestamp)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {historyByPeriod.lastWeek.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Last Week</h3>
                      </div>
                      <div className="space-y-1">
                        {historyByPeriod.lastWeek.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start gap-3 h-auto py-2 px-3"
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            {item.type === 'routine' ? (
                              <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="flex-1 text-left text-sm">{item.query}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(item.timestamp)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {historyByPeriod.lastMonth.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Last Month</h3>
                      </div>
                      <div className="space-y-1">
                        {historyByPeriod.lastMonth.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start gap-3 h-auto py-2 px-3"
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            {item.type === 'routine' ? (
                              <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="flex-1 text-left text-sm">{item.query}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(item.timestamp)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {historyByPeriod.older.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">Older</h3>
                      </div>
                      <div className="space-y-1">
                        {historyByPeriod.older.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className="w-full justify-start gap-3 h-auto py-2 px-3"
                            onClick={() => handleHistoryItemClick(item)}
                          >
                            {item.type === 'routine' ? (
                              <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="flex-1 text-left text-sm">{item.query}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatTime(item.timestamp)}
                            </span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No search history yet. Start searching to see your recent activity.
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Show search results when query is entered
            <div className="space-y-4">
              {hasResults ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">Routines</h3>
                    <span className="text-xs text-muted-foreground">
                      ({filteredRoutines.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {filteredRoutines.map((routine) => (
                      <Button
                        key={routine.id}
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-2 px-3"
                        onClick={() => handleRoutineClick(routine)}
                      >
                        <Zap className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium">{routine.name}</div>
                          {routine.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {routine.description}
                            </div>
                          )}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No results found for &quot;{searchQuery}&quot;
                  </p>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};


