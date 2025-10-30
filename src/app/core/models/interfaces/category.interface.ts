export interface Category {
  data: DatumCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DatumCategory {
  id: string;
  name: string;
  description: string;
  slug: string | null;
  image?: string;
  icon: Icon;
  displayOrder: number;
  color: Color;
  createdAt: Date;
  updatedAt: Date;
  __subcategories__?: DatumCategory[];
  categoryId?: string;
  isActive?: boolean;
}

export enum Color {
  Ff6B6B = "#FF6B6B",
  The4Ecdc4 = "#4ECDC4",
}

export enum Icon {
  HairCare = "hair-care",
  ShampooBottle = "shampoo-bottle",
}

// Interfaces adicionales para el servicio
export interface CategoryFilters {
  page?: number;
  limit?: number;
  search?: string;
  includeSubcategories?: boolean;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  slug?: string;
  image?: string;
  icon?: Icon;
  displayOrder?: number;
  color?: Color;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  slug?: string;
  image?: string;
  icon?: Icon;
  displayOrder?: number;
  color?: Color;
  isActive?: boolean;
}

export interface ReorderCategoryRequest {
  categories: Array<{
    id: string;
    displayOrder: number;
  }>;
}

export interface CategoryStatistics {
  totalCategories: number;
  totalActiveCategories: number;
  totalInactiveCategories: number;
  totalProducts: number;
  averageProductsPerCategory: number;
  categoriesWithMostProducts: Array<{
    category: DatumCategory;
    productCount: number;
  }>;
}

export interface CategoryError {
  message: string;
  statusCode: number;
  error?: string;
}

