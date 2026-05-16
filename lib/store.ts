import { RedesignReport } from "./types";

// In-memory store — persists across client-side navigation, no size limits
export const reportStore: {
  report: RedesignReport | null;
  originalImage: string;
  mockupImageUrl: string;
} = {
  report: null,
  originalImage: "",
  mockupImageUrl: "",
};
