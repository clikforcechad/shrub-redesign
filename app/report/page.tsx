"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RedesignReport, PlantRecommendation } from "@/lib/types";
import { reportStore } from "@/lib/store";

function formatUSD(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function PlantCard({ plant }: { plant: PlantRecommendation }) {
  return (
    <div className="border border-stone-200 rounded-xl p-5 bg-white space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-stone-800">{plant.name}</h3>
          <p className="text-sm text-stone-400 italic">{plant.scientificName}</p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 whitespace-nowrap">
          Qty: {plant.quantity}
        </span>
      </div>
      <p className="text-sm text-stone-600">{plant.description}</p>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="bg-stone-100 text-stone-600 rounded-full px-2 py-0.5">
          {plant.sunlightNeeds.replace("-", " ")}
        </span>
        <span className="bg-stone-100 text-stone-600 rounded-full px-2 py-0.5">
          {plant.maintenanceLevel} maintenance
        </span>
      </div>
    </div>
  );
}

function CostTable({
  plants,
  type,
}: {
  plants: PlantRecommendation[];
  type: "wholesale" | "retail";
}) {
  const priceKey =
    type === "wholesale" ? "wholesalePricePerUnit" : "retailPricePerUnit";
  const total = plants.reduce(
    (sum, p) => sum + p[priceKey] * p.quantity,
    0
  );

  return (
    <div>
      <h3 className="font-semibold text-stone-700 mb-3 capitalize">
        {type} Cost Breakdown
      </h3>
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500">
            <tr>
              <th className="text-left px-4 py-3">Plant</th>
              <th className="text-right px-4 py-3">Qty</th>
              <th className="text-right px-4 py-3">Unit Price</th>
              <th className="text-right px-4 py-3">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {plants.map((p) => (
              <tr key={p.name} className="bg-white">
                <td className="px-4 py-3 text-stone-800">{p.name}</td>
                <td className="px-4 py-3 text-right text-stone-600">
                  {p.quantity}
                </td>
                <td className="px-4 py-3 text-right text-stone-600">
                  {formatUSD(p[priceKey])}
                </td>
                <td className="px-4 py-3 text-right font-medium text-stone-800">
                  {formatUSD(p[priceKey] * p.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-green-50">
            <tr>
              <td colSpan={3} className="px-4 py-3 font-semibold text-stone-800">
                Total ({type})
              </td>
              <td className="px-4 py-3 text-right font-bold text-green-700 text-base">
                {formatUSD(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState<RedesignReport | null>(null);
  const [originalImage, setOriginalImage] = useState<string>("");
  const [mockupImageUrl, setMockupImageUrl] = useState<string>("");

  useEffect(() => {
    if (!reportStore.report) {
      router.replace("/");
      return;
    }
    setReport(reportStore.report);
    setOriginalImage(reportStore.originalImage);
    setMockupImageUrl(reportStore.mockupImageUrl);
  }, [router]);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="bg-green-700 text-white px-6 py-12 text-center">
        <h1 className="text-3xl font-bold">Your Landscape Redesign Report</h1>
        <p className="mt-2 text-green-100 max-w-xl mx-auto">{report.summary}</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-12">
        {/* Before / After */}
        <section>
          <h2 className="text-xl font-semibold text-stone-800 mb-4">
            Before &amp; After
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">
                Current
              </p>
              {originalImage ? (
                <img
                  src={originalImage}
                  alt="Current landscape"
                  className="w-full rounded-xl object-cover max-h-72 border border-stone-200"
                />
              ) : (
                <div className="w-full h-48 bg-stone-200 rounded-xl flex items-center justify-center text-stone-400">
                  No image
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wide mb-2">
                AI Mockup
              </p>
              {mockupImageUrl ? (
                <img
                  src={mockupImageUrl}
                  alt="AI redesign mockup"
                  className="w-full rounded-xl object-cover max-h-72 border border-stone-200"
                />
              ) : (
                <div className="w-full h-48 bg-stone-200 rounded-xl flex items-center justify-center text-stone-400">
                  Mockup unavailable
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Existing landscape analysis */}
        <section className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">
            Current Landscape Analysis
          </h2>
          <p className="text-stone-600">{report.existingLandscapeDescription}</p>
          {report.recommendBorder && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm font-medium text-amber-800">
                Border Recommendation
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {report.borderDescription}
              </p>
            </div>
          )}
        </section>

        {/* Plant recommendations */}
        <section>
          <h2 className="text-xl font-semibold text-stone-800 mb-4">
            Recommended Plants
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {report.plants.map((plant) => (
              <PlantCard key={plant.name} plant={plant} />
            ))}
          </div>
        </section>

        {/* Cost tables */}
        <section className="space-y-8">
          <h2 className="text-xl font-semibold text-stone-800">
            Cost Estimates
          </h2>
          <CostTable plants={report.plants} type="retail" />
          <CostTable plants={report.plants} type="wholesale" />

          {/* Summary bar */}
          <div className="bg-green-700 text-white rounded-2xl px-6 py-5 flex flex-wrap gap-6 items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">Retail Total</p>
              <p className="text-2xl font-bold">
                {formatUSD(report.totalRetailCost)}
              </p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Wholesale Total</p>
              <p className="text-2xl font-bold">
                {formatUSD(report.totalWholesaleCost)}
              </p>
            </div>
            <div>
              <p className="text-green-200 text-sm">Potential Savings</p>
              <p className="text-2xl font-bold">
                {formatUSD(report.totalRetailCost - report.totalWholesaleCost)}
              </p>
            </div>
          </div>
        </section>

        {/* Start over */}
        <div className="text-center pb-8">
          <button
            onClick={() => {
              reportStore.report = null;
              reportStore.originalImage = "";
              reportStore.mockupImageUrl = "";
              router.push("/");
            }}
            className="bg-stone-800 text-white px-8 py-3 rounded-full font-medium hover:bg-stone-700 transition-colors"
          >
            Start a New Redesign
          </button>
        </div>
      </div>
    </div>
  );
}
