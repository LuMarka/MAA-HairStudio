import { SearchSuggestion } from "./SearchSuggestion.interface";

export interface SearchResult {
  query: string;
  type: 'direct' | 'suggestion';
  suggestion?: SearchSuggestion;
}