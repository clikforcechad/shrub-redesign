import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { UserPreferences, RedesignReport } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set in environment" }, { status: 500 });
  }
  const client = new Anthropic({ apiKey });
  try {
    const prefs: UserPreferences = await req.json();

    const systemPrompt = `You are an expert landscape architect and horticulturist.
Analyze landscape images and provide detailed, accurate redesign plans with realistic pricing.
CRITICAL: Respond with raw JSON only. No markdown, no code fences, no backticks, no explanation. Start your response with { and end with }.`;

    const userPrompt = `Analyze the uploaded landscape image and create a complete redesign plan based on these preferences:

- Zip Code: ${prefs.zipCode}
- Budget: $${prefs.budget}
- Maintenance Level: ${prefs.maintenanceLevel}
- Sunlight: ${prefs.sunlightLevel}
- Style: ${prefs.style}

Return a JSON object matching this exact TypeScript type:
{
  summary: string,                          // 2-3 sentence overview of the redesign
  existingLandscapeDescription: string,     // what you see in the current image
  recommendBorder: boolean,                 // would a border improve curb appeal?
  borderDescription?: string,              // if recommendBorder is true, describe it
  plants: Array<{
    name: string,                           // common name
    scientificName: string,
    description: string,                    // 1-2 sentences on appearance and appeal
    quantity: number,
    wholesalePricePerUnit: number,          // USD, realistic for zip ${prefs.zipCode}
    retailPricePerUnit: number,             // USD, realistic for zip ${prefs.zipCode}
    maintenanceLevel: "low" | "medium" | "high",
    sunlightNeeds: "full-sun" | "partial-shade" | "full-shade",
    imageSearchQuery: string                // e.g. "Purple Coneflower Echinacea purpurea bloom"
  }>,
  totalWholesaleCost: number,
  totalRetailCost: number,
  mockupPrompt: string                      // An image EDITING instruction (not a generation prompt). Describe exactly what to remove and what to add to the existing photo. Be specific about plant names, placement, and colors. Always begin with: "Keep the house, architecture, driveway, walkway, sky, and background exactly as they are. " Then describe only what changes in the planting areas.
}

Important constraints:
- Keep total retail cost within or close to the $${prefs.budget} budget
- All plants must suit ${prefs.sunlightLevel} conditions
- All plants must match ${prefs.maintenanceLevel} maintenance preference
- Style must reflect ${prefs.style} aesthetic
- Recommend 4-8 plant varieties
- Use realistic current wholesale and retail pricing for zip code ${prefs.zipCode}`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: prefs.imageMimeType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: prefs.imageBase64,
              },
            },
            {
              type: "text",
              text: userPrompt,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const raw = content.text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    const report: RedesignReport = JSON.parse(raw);
    return NextResponse.json({ report });
  } catch (err) {
    console.error("Analyze error:", err);
    return NextResponse.json(
      { error: "Failed to analyze landscape" },
      { status: 500 }
    );
  }
}
