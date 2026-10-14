// Fixtures and results come through our own /api/play-cricket endpoint,
// which keeps the Play-Cricket API token off the website.
export async function fetchPlayCricket(type: "matches" | "results", season: string | number) {
  const res = await fetch(`/api/play-cricket?type=${type}&season=${season}`);
  if (!res.ok) throw new Error("Couldn't load match data");
  return res.json();
}
