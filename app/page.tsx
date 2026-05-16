"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPreferences,
  MaintenanceLevel,
  SunlightLevel,
  LandscapeStyle,
  RedesignReport,
} from "@/lib/types";
import { reportStore } from "@/lib/store";

const STEPS = [
  "Location",
  "Budget",
  "Maintenance",
  "Sunlight",
  "Style",
  "Photo",
  "Generating",
];

const defaultPrefs: UserPreferences = {
  zipCode: "",
  budget: 2000,
  maintenanceLevel: "low",
  sunlightLevel: "full-sun",
  style: "native",
  imageBase64: "",
  imageMimeType: "image/jpeg",
};

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<UserPreferences>(defaultPrefs);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  function next() {
    setError("");
    setStep((s) => s + 1);
  }
  function back() {
    setError("");
    setStep((s) => s - 1);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      // Resize so the longest side is at most 1920px, keeping aspect ratio
      const MAX = 1920;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width);
          width = MAX;
        } else {
          width = Math.round((width * MAX) / height);
          height = MAX;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);

      // Encode as JPEG at 85% quality — keeps quality high while staying under 5MB
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.split(",")[1];
      setPrefs((p) => ({ ...p, imageBase64: base64, imageMimeType: "image/jpeg" }));
      setImagePreview(dataUrl);
      URL.revokeObjectURL(objectUrl);
    };
    img.src = objectUrl;
  }

  async function handleSubmit() {
    setLoading(true);
    setStep(6); // show generating step
    setError("");

    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (!analyzeRes.ok) throw new Error("Analysis failed");
      const { report }: { report: RedesignReport } = await analyzeRes.json();

      const mockupRes = await fetch("/api/generate-mockup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: report.mockupPrompt,
          imageBase64: prefs.imageBase64,
          imageMimeType: prefs.imageMimeType,
        }),
      });

      if (mockupRes.ok) {
        const { imageUrl } = await mockupRes.json();
        reportStore.mockupImageUrl = imageUrl;
      } else {
        reportStore.mockupImageUrl = "";
      }

      reportStore.report = report;
      reportStore.originalImage = imagePreview;
      router.push("/report");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep(5);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stone-800">
            Landscape Redesign Assistant
          </h1>
          <p className="text-stone-500 mt-2">
            AI-powered redesign plans tailored to your space
          </p>
        </div>

        {/* Progress bar */}
        {step < 6 && (
          <div className="flex gap-1 mb-8">
            {STEPS.slice(0, 6).map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    i <= step ? "bg-green-600" : "bg-stone-200"
                  }`}
                />
                <p className="text-[10px] text-stone-400 mt-1 text-center hidden sm:block">
                  {label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {/* Step 0: Zip Code */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-800">
                  What is your zip code?
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  Used for climate-appropriate plant selection and local pricing.
                </p>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="e.g. 90210"
                value={prefs.zipCode}
                onChange={(e) =>
                  setPrefs((p) => ({ ...p, zipCode: e.target.value }))
                }
                className="w-full border border-stone-300 rounded-lg px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={next}
                disabled={prefs.zipCode.length !== 5}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 1: Budget */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-800">
                  What is your budget?
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  We will keep plant recommendations within your range.
                </p>
              </div>
              <div>
                <div className="flex justify-between text-sm text-stone-500 mb-2">
                  <span>$500</span>
                  <span className="text-green-700 font-semibold text-base">
                    ${prefs.budget.toLocaleString()}
                  </span>
                  <span>$20,000</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={20000}
                  step={250}
                  value={prefs.budget}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, budget: Number(e.target.value) }))
                  }
                  className="w-full accent-green-600"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={back}
                  className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={next}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Maintenance */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-800">
                  Preferred maintenance level?
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  How much time do you want to spend caring for your landscape?
                </p>
              </div>
              <div className="space-y-3">
                {(
                  [
                    {
                      value: "low",
                      label: "Low",
                      desc: "Minimal watering, pruning once or twice a year",
                    },
                    {
                      value: "medium",
                      label: "Medium",
                      desc: "Monthly attention, seasonal planting",
                    },
                    {
                      value: "high",
                      label: "High",
                      desc: "Weekly care, elaborate plantings",
                    },
                  ] as { value: MaintenanceLevel; label: string; desc: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setPrefs((p) => ({ ...p, maintenanceLevel: opt.value }));
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      prefs.maintenanceLevel === opt.value
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-stone-200 text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-sm text-stone-500 block">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={back}
                  className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={next}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Sunlight */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-800">
                  How much sunlight does the area get?
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  This determines which plants will thrive in your space.
                </p>
              </div>
              <div className="space-y-3">
                {(
                  [
                    {
                      value: "full-sun",
                      label: "Full Sun",
                      desc: "6+ hours of direct sunlight daily",
                    },
                    {
                      value: "partial-shade",
                      label: "Partial Shade",
                      desc: "3–6 hours of direct sunlight daily",
                    },
                    {
                      value: "full-shade",
                      label: "Full Shade",
                      desc: "Less than 3 hours of direct sunlight",
                    },
                  ] as { value: SunlightLevel; label: string; desc: string }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setPrefs((p) => ({ ...p, sunlightLevel: opt.value }))
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      prefs.sunlightLevel === opt.value
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-stone-200 text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-sm text-stone-500 block">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={back}
                  className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={next}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Style */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-800">
                  What style do you prefer?
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  Choose the aesthetic direction for your new landscape.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      value: "native",
                      label: "Native",
                      emoji: "🌿",
                      desc: "Local wildflowers and grasses",
                    },
                    {
                      value: "modern",
                      label: "Modern",
                      emoji: "🏛️",
                      desc: "Clean lines, ornamental grasses",
                    },
                    {
                      value: "cottage",
                      label: "Cottage",
                      emoji: "🌸",
                      desc: "Romantic, abundant blooms",
                    },
                    {
                      value: "tropical",
                      label: "Tropical",
                      emoji: "🌴",
                      desc: "Bold foliage, exotic flair",
                    },
                  ] as {
                    value: LandscapeStyle;
                    label: string;
                    emoji: string;
                    desc: string;
                  }[]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      setPrefs((p) => ({ ...p, style: opt.value }))
                    }
                    className={`text-left px-4 py-4 rounded-lg border transition-colors ${
                      prefs.style === opt.value
                        ? "border-green-600 bg-green-50 text-green-800"
                        : "border-stone-200 text-stone-700 hover:border-stone-400"
                    }`}
                  >
                    <span className="text-2xl block mb-1">{opt.emoji}</span>
                    <span className="font-medium block">{opt.label}</span>
                    <span className="text-xs text-stone-500">{opt.desc}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={back}
                  className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={next}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Image Upload */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-stone-800">
                  Upload a photo of your current landscape
                </h2>
                <p className="text-stone-500 text-sm mt-1">
                  Claude will analyze it and tailor recommendations to your
                  specific space.
                </p>
              </div>

              <label className="block">
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    imagePreview
                      ? "border-green-400 bg-green-50"
                      : "border-stone-300 hover:border-stone-400 bg-stone-50"
                  }`}
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Landscape preview"
                      className="mx-auto max-h-48 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📷</div>
                      <p className="text-stone-600 font-medium">
                        Click to upload photo
                      </p>
                      <p className="text-stone-400 text-sm">
                        JPG, PNG, WebP up to 20MB
                      </p>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {imagePreview && (
                <p className="text-green-700 text-sm text-center">
                  Photo uploaded. Ready to generate your redesign.
                </p>
              )}

              {error && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={back}
                  className="flex-1 border border-stone-300 text-stone-700 py-3 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!prefs.imageBase64 || loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Generate Redesign
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Generating */}
          {step === 6 && (
            <div className="text-center py-8 space-y-6">
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
                <div className="absolute inset-0 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-stone-800">
                  Designing your landscape...
                </h2>
                <p className="text-stone-500 text-sm mt-2">
                  Claude is analyzing your photo and selecting plants.
                  <br />
                  Then we will generate a visual mockup. This takes 30–60
                  seconds.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
