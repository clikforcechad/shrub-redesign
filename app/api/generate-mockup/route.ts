import OpenAI, { toFile } from "openai";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const {
      prompt,
      imageBase64,
      imageMimeType,
    }: { prompt: string; imageBase64: string; imageMimeType: string } =
      await req.json();

    const editPrompt = `${prompt} Maintain photorealistic quality matching the original photo's lighting, perspective, and style. Do not change the house, architecture, or background.`;

    // Convert base64 back to a File for the OpenAI edit endpoint
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const imageFile = await toFile(imageBuffer, "landscape.png", {
      type: imageMimeType,
    });

    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: editPrompt,
      n: 1,
      size: "1536x1024",
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image data returned from gpt-image-1");

    const imageUrl = `data:image/png;base64,${b64}`;
    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Mockup generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate mockup" },
      { status: 500 }
    );
  }
}
