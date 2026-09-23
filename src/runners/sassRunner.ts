export async function compileSCSS(source: string): Promise<string> {
  if (!source.trim()) {
    throw new Error("styles.scss is empty — nothing to compile.");
  }
  const { compileStringAsync } = await import("sass");
  try {
    const result = await compileStringAsync(source, { style: "expanded" });
    return result.css;
  } catch (err) {
    const message =
      err && typeof err === "object" && "message" in err && err.message
        ? String(err.message)
        : String(err);
    throw new Error(message);
  }
}
