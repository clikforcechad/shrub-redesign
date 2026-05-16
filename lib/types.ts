export type MaintenanceLevel = "low" | "medium" | "high";
export type SunlightLevel = "full-sun" | "partial-shade" | "full-shade";
export type LandscapeStyle = "native" | "modern" | "cottage" | "tropical";

export interface UserPreferences {
  zipCode: string;
  budget: number;
  maintenanceLevel: MaintenanceLevel;
  sunlightLevel: SunlightLevel;
  style: LandscapeStyle;
  imageBase64: string; // base64 encoded uploaded image
  imageMimeType: string;
}

export interface PlantRecommendation {
  name: string;
  scientificName: string;
  description: string;
  quantity: number;
  wholesalePricePerUnit: number;
  retailPricePerUnit: number;
  maintenanceLevel: MaintenanceLevel;
  sunlightNeeds: SunlightLevel;
  imageSearchQuery: string; // used to find a representative image
}

export interface RedesignReport {
  summary: string;
  existingLandscapeDescription: string;
  recommendBorder: boolean;
  borderDescription?: string;
  plants: PlantRecommendation[];
  totalWholesaleCost: number;
  totalRetailCost: number;
  mockupPrompt: string; // DALL-E prompt derived from the redesign
  mockupImageUrl?: string;
}

export interface AnalyzeResponse {
  report: RedesignReport;
}

export interface GenerateMockupResponse {
  imageUrl: string;
}
