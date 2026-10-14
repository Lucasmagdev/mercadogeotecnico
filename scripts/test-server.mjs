// Exercise the compiled HTTP endpoints, not only extracted policy helpers.
// No hosted database or paid provider is contacted. Run after `bun run build`.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { toJSON } from "seroval";

const assets = new URL("../dist/server/assets/", import.meta.url);
const filename = (await readdir(assets)).find((name) => /^ai-listing-.*\.js$/.test(name));
assert.ok(filename, "Build server artifacts before running HTTP tests");
const source = await readFile(new URL(filename, assets), "utf8");
const ids = new Map(
  [...source.matchAll(/createServerRpc\(\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g)].map(
    ([, id, name]) => [name, id],
  ),
);
assert.equal(ids.size, 3, "All three AI endpoints must be present in the server artifact");

let externalCalls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  externalCalls++;
  throw new Error("Unexpected network request during unauthorized HTTP test");
};
const { default: server } = await import("../dist/server/server.js");
const calls = [
  [
    "generateListingDraft",
    {
      images: [],
      note: "Bomba declarada pelo vendedor",
      categories: [{ slug: "pecas", name: "Peças" }],
    },
  ],
  ["suggestSpecFields", { categoryName: "Peças", itemName: "Bomba" }],
  [
    "transcribeVoiceNote",
    {
      mediaType: "audio/webm",
      base64: Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0]).toString("base64"),
    },
  ],
];
const results = [];
const originalInfo = console.info;
const originalWarn = console.warn;
const originalError = console.error;
const events = [];
try {
  for (const [name, data] of calls) {
    const response = await server.fetch(
      new Request(`http://localhost/_serverFn/${ids.get(name)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tsr-serverFn": "true" },
        body: JSON.stringify(toJSON({ data })),
      }),
    );
    assert.equal(response.status, 401, `${name} must reject anonymous HTTP requests`);
    results.push({ endpoint: name, status: response.status });
  }
  assert.equal(externalCalls, 0, "Anonymous requests must never touch Auth, quota or paid AI");
  const anonymousExternalCalls = externalCalls;

  // Synthetic Auth/PostgREST/provider responses test the compiled integration and
  // SDK telemetry without sending a prompt or credential to any remote service.
  process.env.SUPABASE_URL = "https://auth.test.invalid";
  process.env.SUPABASE_ANON_KEY = "test-anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-server";
  process.env.OPENAI_API_KEY = "test-provider";
  process.env.AI_MODEL_PRICES_JSON = JSON.stringify({
    "gpt-5.6-luna": { inputUsdPerMillion: 2, outputUsdPerMillion: 8 },
  });
  console.info = (line) => events.push(JSON.parse(line));
  console.warn = (line) => events.push(JSON.parse(line));
  console.error = (line) => events.push(JSON.parse(line));
  let scenario = "expired";
  let providerCalls = 0;
  const finished = [];
  const json = (value, status = 200) =>
    new Response(JSON.stringify(value), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    if (url.hostname === "auth.test.invalid") {
      if (url.pathname === "/auth/v1/user") {
        assert.equal(request.headers.get("Authorization"), "Bearer valid.jwt.token");
        return scenario === "expired"
          ? json({ message: "invalid token" }, 401)
          : json({ id: "owner-fixture" });
      }
      assert.equal(request.headers.get("apikey"), "test-server");
      if (url.pathname === "/rest/v1/companies") {
        assert.equal(url.searchParams.get("owner_id"), "eq.owner-fixture");
        assert.equal(url.searchParams.get("status"), "eq.approved");
        return json(scenario === "pending" ? [] : [{ id: "company-fixture" }]);
      }
      const payload = await request.json();
      if (url.pathname === "/rest/v1/rpc/reserve_ai_request") {
        assert.deepEqual(payload, { p_user_id: "owner-fixture", p_operation: "specs" });
        return scenario === "quota"
          ? json({ code: "P0001", message: "AI_QUOTA" }, 400)
          : json("request-fixture");
      }
      if (url.pathname === "/rest/v1/rpc/finish_ai_request") {
        finished.push(payload);
        return new Response(null, { status: 204 });
      }
    }
    if (url.hostname === "api.openai.com" && url.pathname === "/v1/responses") {
      providerCalls++;
      const payload = await request.json();
      assert.equal(payload.max_output_tokens, 1200);
      if (scenario === "provider-failure")
        return json({ error: { message: "synthetic outage", type: "server_error" } }, 500);
      return json({
        id: "response-fixture",
        object: "response",
        status: "completed",
        model: "gpt-5.6-luna",
        output: [
          {
            type: "message",
            role: "assistant",
            status: "completed",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  specs: [{ label: "Pressão", placeholder: "Ex.: 200 bar" }],
                }),
                annotations: [],
              },
            ],
          },
        ],
        usage: {
          input_tokens: 100,
          output_tokens: 20,
          total_tokens: 120,
          input_tokens_details: { cached_tokens: 0 },
        },
      });
    }
    throw new Error("Unexpected external destination in controlled HTTP test");
  };
  const authorizedResults = [];
  for (const [name, expectedStatus] of [
    ["expired", 401],
    ["pending", 403],
    ["quota", 429],
    ["approved", 200],
    ["provider-failure", 502],
  ]) {
    scenario = name;
    const response = await server.fetch(
      new Request(`http://localhost/_serverFn/${ids.get("suggestSpecFields")}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tsr-serverFn": "true",
          Authorization: "Bearer valid.jwt.token",
        },
        body: JSON.stringify(toJSON({ data: { categoryName: "Peças", itemName: "Bomba" } })),
      }),
    );
    assert.equal(response.status, expectedStatus, `Controlled HTTP scenario ${name}`);
    authorizedResults.push({ scenario: name, status: response.status });
  }
  assert.equal(
    providerCalls,
    2,
    "Only approved reservations may reach provider; automatic retries are disabled",
  );
  assert.equal(finished.length, 2);
  assert.equal(finished[0].p_status, "succeeded");
  assert.equal(finished[0].p_input_tokens, 100);
  assert.equal(finished[0].p_output_tokens, 20);
  assert.ok(Math.abs(finished[0].p_estimated_cost_usd - 0.00036) < 1e-10);
  assert.equal(finished[1].p_status, "failed");
  assert.equal(finished[1].p_estimated_cost_usd, null);
  assert.ok(events.some((event) => event.event === "ai_provider_usage" && event.durationMs >= 0));
  const companyFixture = {
    id: "b0000000-0000-4000-8000-000000000002",
    owner_id: "b1111111-1111-4111-8111-111111111111",
    name: "Empresa sintética de QA",
    slug: "empresa-sintetica-qa",
    cnpj: null,
    phone: null,
    whatsapp: null,
    site: null,
    city: "Belo Horizonte",
    state: "MG",
    description: "Descrição de teste para compartilhamento.",
    services: [],
    status: "approved",
    verified: false,
    years_on_market: 0,
    rating: 0,
    reviews: 0,
    logo_path: null,
    banner_path: null,
    created_at: "2026-10-14T12:00:00Z",
  };
  const equipmentFixture = {
    id: "b0000000-0000-4000-8000-000000000003",
    company_id: companyFixture.id,
    companies: companyFixture,
    slug: "bomba-sintetica-qa",
    title: "Bomba sintética de QA",
    description: "Peça sintética usada somente no teste isolado.",
    brand: "Marca QA",
    model: "QA",
    category_slug: "pecas",
    price: 100,
    mode: "venda",
    rental_period: null,
    condition: "Usado",
    year: 2020,
    hours: 0,
    city: "Belo Horizonte",
    state: "MG",
    image_key: null,
    images: ["synthetic-qa/foto.jpg"],
    specs: [],
    compatible_with: [],
    has_invoice: false,
    has_calibration_cert: false,
    maintenance_history_informed: false,
    status: "active",
    views: 0,
    created_at: "2026-10-14T12:00:00Z",
  };
  globalThis.fetch = async (input, init) => {
    const request = new Request(input, init),
      url = new URL(request.url);
    if (url.pathname === "/rest/v1/equipment_public") return json([equipmentFixture]);
    if (url.pathname === "/rest/v1/companies_public") return json([companyFixture]);
    throw new Error("Unexpected network request during isolated SSR test");
  };
  const previews = [];
  for (const [path, expectedTitle] of [
    ["/pecas/bomba-sintetica-qa", equipmentFixture.title],
    ["/empresas/empresa-sintetica-qa", companyFixture.name],
  ]) {
    const response = await server.fetch(new Request(`https://mercadogeotecnico.com${path}`));
    assert.equal(response.status, 200, "SSR page must render from the public projection");
    const html = await response.text();
    assert.ok(
      html.includes(`property="og:title" content="${expectedTitle}`),
      "Shared title must exist in the server HTML before JavaScript",
    );
    assert.ok(html.includes(`property="og:url" content="https://mercadogeotecnico.com${path}"`));
    if (path.startsWith("/pecas"))
      assert.ok(
        html.includes("synthetic-qa/foto.jpg"),
        "Listing photo must be present in server metadata",
      );
    previews.push({ path, status: response.status, serverMetadata: true });
  }
  console.log(
    JSON.stringify({
      status: "PASS",
      unauthorizedHttpEndpoints: results,
      anonymousExternalCalls,
      controlledIntegration: authorizedResults,
      simulatedProviderCalls: providerCalls,
      persistentTelemetryWrites: finished.length,
      isolatedSsrPreviews: previews,
      remoteRequests: 0,
    }),
  );
} finally {
  globalThis.fetch = originalFetch;
  console.info = originalInfo;
  console.warn = originalWarn;
  console.error = originalError;
}
