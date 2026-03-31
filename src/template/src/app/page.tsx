import Link from "next/link";
import * as fs from "fs";
import * as path from "path";

function getScreens(): string[] {
  const screensDir = path.join(process.cwd(), "src/app/screens");
  if (!fs.existsSync(screensDir)) return [];
  return fs.readdirSync(screensDir).filter((d: string) =>
    fs.existsSync(path.join(screensDir, d, "page.tsx"))
  );
}

export default function Home() {
  const screens = getScreens();
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-2">Design Preview</h1>
      <p className="text-muted-foreground mb-6">{screens.length} screen{screens.length !== 1 ? "s" : ""}</p>
      {screens.length === 0 ? (
        <p className="text-muted-foreground">No screens yet. Use create_screen to add one.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {screens.map((s) => (
            <Link
              key={s}
              href={`/screens/${s}`}
              className="block rounded-lg border border-border bg-card p-4 text-center hover:shadow-md transition-shadow"
            >
              {s}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
