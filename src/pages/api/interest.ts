import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
	let payload: { email?: unknown };
	try { payload = JSON.parse(await request.text()) as { email?: unknown }; } catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }
	const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return Response.json({ error: "Enter a valid email address" }, { status: 400 });
	const runtime = (locals as unknown as { runtime?: { env?: { DB?: D1Database } } }).runtime;
	const db = runtime?.env?.DB;
	if (!db) return Response.json({ error: "Database unavailable" }, { status: 503 });
	await db.prepare("CREATE TABLE IF NOT EXISTS interest_signups (email TEXT PRIMARY KEY, created_at TEXT NOT NULL, source TEXT NOT NULL)").run();
	await db.prepare("INSERT OR IGNORE INTO interest_signups (email, created_at, source) VALUES (?, ?, ?)").bind(email, new Date().toISOString(), "homepage").run();
	return Response.json({ ok: true });
};
