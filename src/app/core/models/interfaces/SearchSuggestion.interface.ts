export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'service' | 'brand' | 'category';
  icon?: string;
}