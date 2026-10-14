// GET /api/play-cricket?type=matches|results&season=2027
// Fetches fixtures/results from Play-Cricket on the server, so the API token
// stays secret (it lives in the PLAY_CRICKET_TOKEN environment variable).
// Responses are cached by Vercel for 15 minutes to keep the site fast.
const SITE_ID = "3758";
const ENDPOINTS: Record<string, string> = {
  matches: "matches.json",
  results: "result_summary.json",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "";
  const season = url.searchParams.get("season") ?? String(new Date().getFullYear());
  const token = process.env.PLAY_CRICKET_TOKEN;

  if (!ENDPOINTS[type] || !/^\d{4}$/.test(season)) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!token) {
    return Response.json({ error: "Play-Cricket isn't connected yet" }, { status: 503 });
  }

  try {
    const upstream = await fetch(
      `https://play-cricket.com/api/v2/${ENDPOINTS[type]}?site_id=${SITE_ID}&season=${season}&api_token=${encodeURIComponent(token)}`,
    );
    if (!upstream.ok) throw new Error(`Play-Cricket returned ${upstream.status}`);
    const data = await upstream.json();
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    });
  } catch (err) {
    console.error("Play-Cricket fetch failed", err);
    return Response.json({ error: "Couldn't reach Play-Cricket" }, { status: 502 });
  }
}
