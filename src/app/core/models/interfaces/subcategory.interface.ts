export interface SubCategory {
  data: Datum[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Datum {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string; //lalalalal
  displayOrder: number;
  color: Color;
  icon: Icon;
  category?: Datum;
  categoryId?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: Image;
}

export enum Color {
  Ff6B6B = "#FF6B6B",
  The4Ecdc4 = "#4ECDC4",
}

export enum Icon {
  HairCare = "hair-care",
  ShampooBottle = "shampoo-bottle",
}

export enum Image {
  ImageMjp = "image.mjp",
}

// Interfaces adicionales para el servicio
export interface SubCategoryFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  includeProducts?: boolean;
}

export interface CreateSubCategoryRequest {
  name: string;
  description: string;
  slug?: string;
  categoryId: string;
  displayOrder?: number;
  color?: Color;
  icon?: Icon;
  image?: string;
}

export interface UpdateSubCategoryRequest {
  name?: string;
  description?: string;
  slug?: string;
  categoryId?: string;
  displayOrder?: number;
  color?: Color;
  icon?: Icon;
  image?: string;
  isActive?: boolean;
}

export interface ReorderSubCategoryRequest {
  id: string;
  displayOrder: number;
}

export interface SubCategoryStatistics {
  totalSubCategories: number;
  totalActiveSubCategories: number;
  totalInactiveSubCategories: number;
  totalProducts: number;
  averageProductsPerSubCategory: number;
  subCategoriesWithMostProducts: Array<{
    subCategory: Datum;
    productCount: number;
  }>;
  subCategoriesByCategory: Array<{
    categoryName: string;
    subCategoryCount: number;
  }>;
}

export interface SubCategoryError {
  message: string;
  statusCode: number;
  error?: string;
}
