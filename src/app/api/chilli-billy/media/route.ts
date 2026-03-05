import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"];
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov"];

function scanDir(dirPath: string, kind: "IMAGE" | "VIDEO", publicPrefix: string) {
  const results: { kind: "IMAGE" | "VIDEO"; path: string; filename: string }[] = [];
  const absoluteDir = path.join(process.cwd(), "public", dirPath);

  if (!fs.existsSync(absoluteDir)) return results;

  const files = fs.readdirSync(absoluteDir);
  const extensions = kind === "IMAGE" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (extensions.includes(ext)) {
      results.push({
        kind,
        path: `/${publicPrefix}/${file}`,
        filename: file,
      });
    }
  }
  return results;
}

export async function GET(req: NextRequest) {
  const admin = await isAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const showUsed = req.nextUrl.searchParams.get("showUsed") === "true";

  // Scan filesystem
  const images = scanDir("chilli-billy/images", "IMAGE", "chilli-billy/images");
  const videos = scanDir("chilli-billy/videos", "VIDEO", "chilli-billy/videos");
  const allMedia = [...images, ...videos];

  // Get used paths from DB
  const usedMedia = await prisma.tripMedia.findMany({
    select: { path: true },
  });
  const usedPaths = new Set(usedMedia.map((m) => m.path));

  const result = allMedia.map((m) => ({
    ...m,
    used: usedPaths.has(m.path),
  }));

  if (showUsed) {
    return NextResponse.json(result);
  }

  return NextResponse.json(result.filter((m) => !m.used));
}
