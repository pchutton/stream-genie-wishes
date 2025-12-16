import { createContext, useContext, useState, ReactNode } from 'react';

export type SearchMode = 'media' | 'live';

interface SearchModeContextType {
  searchMode: SearchMode;
  setSearchMode: (mode: SearchMode) => void;
}

const SearchModeContext = createContext<SearchModeContextType | undefined>(undefined);

export function SearchModeProvider({ children }: { children: ReactNode }) {
  const [searchMode, setSearchMode] = useState<SearchMode>('media');
  
  return (
    <SearchModeContext.Provider value={{ searchMode, setSearchMode }}>
      {children}
    </SearchModeContext.Provider>
  );
}

export function useSearchMode() {
  const context = useContext(SearchModeContext);
  if (context === undefined) {
    throw new Error('useSearchMode must be used within a SearchModeProvider');
  }
  return context;
}
