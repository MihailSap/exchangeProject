import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const session = { accessToken: "access", refreshToken: "refresh", user: { id: 1, email: "user@example.com", name: "Имя", status: "ACTIVE" } };

function environment(fetch = async () => new Response(null, { status: 204 })) {
  const storage = new Map();
  const cache = new Map();
  const events = [];
  const window = {
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    },
    dispatchEvent: (event) => events.push(event.type),
  };
  function load(name, parent = root) {
    const base = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(parent, name);
    const filename = [base, `${base}.ts`, path.join(base, "index.ts")].find((candidate) => existsSync(candidate) && candidate.endsWith(".ts"));
    if (!filename) throw new Error(`Cannot load ${name}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const compiled = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(compiled, { module, exports: module.exports, require: (request) => load(request, path.dirname(filename)), window, fetch, Headers, Response, DOMException, Event, atob, FormData, Blob, URL, process: { env: {} } }, { filename });
    return module.exports;
  }
  return { load, storage, events };
}

test("forms validate required fields, password match and maximum lengths", () => {
  const { validate, INITIAL_VALUES } = environment().load("@/src/features/auth/model/auth-validation");
  assert.equal(Object.keys(validate(INITIAL_VALUES, "register")).length, 4);
  const valid = { name: "Имя", email: "user@example.com", password: "password123", repeatPassword: "password123" };
  assert.equal(Object.keys(validate(valid, "register")).length, 0);
  assert.ok(validate({ ...valid, repeatPassword: "different" }, "reset").repeatPassword);
  assert.ok(validate({ ...valid, name: "a".repeat(81) }, "register").name);
  assert.ok(validate({ ...valid, password: "a".repeat(129) }, "login").password);
  assert.ok(validate({ ...valid, email: `${"a".repeat(250)}@test.com` }, "forgot").email);
});

test("stored session rejects malformed user data and notifies on changes", () => {
  const env = environment();
  const model = env.load("@/src/entities/session/model/session");
  model.writeSession(session);
  assert.equal(model.readSession().user.id, 1);
  env.storage.set("exchange.auth.session", JSON.stringify({ ...session, user: { name: 42 } }));
  assert.equal(model.readSession(), null);
  env.storage.set("exchange.auth.session", "{broken");
  assert.equal(model.readSession(), null);
  model.clearSession();
  assert.equal(env.events.length, 2);
});

for (const payload of [{ error: { message: "Ошибка сервера" } }, { error: { details: [{ message: "Ошибка поля" }] } }, { error: { message: 42, details: [null] } }]) {
  test(`API handles error payload ${JSON.stringify(payload)}`, async () => {
    const { apiRequest } = environment(async () => Response.json(payload, { status: 400 })).load("@/src/shared/api/client");
    const expected = payload.error.message === "Ошибка сервера" ? "Ошибка сервера" : payload.error.details?.[0]?.message ?? "Fallback";
    await assert.rejects(apiRequest("/example", { fallbackMessage: "Fallback" }), (error) => error.message === expected && error.status === 400);
  });
}

test("API converts network errors into UI fallback and accepts 204", async () => {
  const failed = environment(async () => { throw new TypeError("Failed to fetch"); }).load("@/src/shared/api/client");
  await assert.rejects(failed.apiRequest("/example", { fallbackMessage: "Повторите позже" }), (error) => error.message === "Повторите позже" && error.status === 0);
  const empty = environment().load("@/src/shared/api/client");
  assert.equal(await empty.apiRequest("/example"), undefined);
});

test("late token renewal cannot restore a signed out session", async () => {
  let release;
  const env = environment(async (url) => {
    if (url.endsWith("/auth/token")) return new Promise((resolve) => { release = () => resolve(Response.json({ data: { accessToken: "new-access" } })); });
    return new Response(null, { status: 401 });
  });
  const model = env.load("@/src/entities/session/model/session");
  model.writeSession(session);
  const { apiRequest } = env.load("@/src/shared/api/client");
  const request = apiRequest("/example", { authenticated: true });
  while (!release) await new Promise((resolve) => setImmediate(resolve));
  model.clearSession();
  release();
  await assert.rejects(request, (error) => error.status === 401);
  assert.equal(model.readSession(), null);
});

test("profile requests share one in-flight response and validate DTO", async () => {
  let requests = 0;
  const env = environment(async () => {
    requests += 1;
    return Response.json({ data: { ...session.user, email_confirmed: true, avatar_url: null, reviews_count: 2 } });
  });
  const model = env.load("@/src/entities/session/model/session");
  model.writeSession(session);
  const { updateSessionProfile } = env.load("@/src/entities/session/api/profile");
  const first = updateSessionProfile();
  assert.equal(first, updateSessionProfile());
  const user = await first;
  assert.equal(requests, 1);
  assert.equal(user.emailConfirmed, true);
  assert.equal(model.readSession().user.reviewsCount, 2);
});

test("invalid profile response is rejected without overwriting the session", async () => {
  const env = environment(async () => Response.json({ data: { id: "invalid", email_confirmed: true } }));
  const model = env.load("@/src/entities/session/model/session");
  model.writeSession(session);
  const { updateSessionProfile } = env.load("@/src/entities/session/api/profile");
  await assert.rejects(updateSessionProfile(), (error) => error.status === 502);
  assert.equal(model.readSession().user.name, session.user.name);
});

test("401 after token rotation clears the rotated session", async () => {
  const env = environment(async (url) => {
    if (url.endsWith("/auth/token")) return Response.json({ data: { accessToken: "new-access" } });
    if (url.endsWith("/auth/refresh")) return Response.json({ data: { accessToken: "rotated-access", refreshToken: "rotated-refresh" } });
    return new Response(null, { status: 401 });
  });
  const model = env.load("@/src/entities/session/model/session");
  model.writeSession(session);
  const { apiRequest } = env.load("@/src/shared/api/client");
  await assert.rejects(apiRequest("/example", { authenticated: true }), (error) => error.status === 401);
  assert.equal(model.readSession(), null);
});


test("profile 401 renews tokens and retries once with the new access", async () => {
  const calls = [];
  const env = environment(async (url, options) => {
    calls.push(url.split("/api/v1")[1]);
    if (url.endsWith("/auth/token")) return Response.json({ data: { accessToken: "new-access" } });
    if (url.endsWith("/auth/refresh")) return Response.json({ data: { accessToken: "rotated-access", refreshToken: "rotated" } });
    if (options.headers.get("Authorization") === "Bearer access") return new Response(null, { status: 401 });
    assert.equal(options.headers.get("Authorization"), "Bearer rotated-access");
    return Response.json({ data: { ...session.user, email_confirmed: true } });
  });
  const model = env.load("@/src/entities/session/model/session");
  model.writeSession(session);
  const user = await env.load("@/src/entities/session/api/profile").updateSessionProfile();
  assert.equal(user.id, 1);
  assert.deepEqual(calls, ["/users/me", "/auth/token", "/auth/refresh", "/users/me"]);
});

test("parallel 401 responses share token renewal", async () => {
  let renewals = 0;
  let rotations = 0;
  let retries = 0;
  const env = environment(async (url, options) => {
    if (url.endsWith("/auth/token")) {
      renewals += 1;
      return Response.json({ data: { accessToken: "new-access" } });
    }
    if (url.endsWith("/auth/refresh")) {
      rotations += 1;
      return Response.json({ data: { accessToken: "rotated-access", refreshToken: "rotated" } });
    }
    if (options.headers.get("Authorization") === "Bearer access") return new Response(null, { status: 401 });
    retries += 1;
    return Response.json({ data: true });
  });
  env.load("@/src/entities/session/model/session").writeSession(session);
  const { apiRequest } = env.load("@/src/shared/api/client");
  await Promise.all([apiRequest("/first", { authenticated: true }), apiRequest("/second", { authenticated: true })]);
  assert.equal(renewals, 1);
  assert.equal(rotations, 1);
  assert.equal(retries, 2);
});

for (const status of [403, 404]) {
  test(`HTTP ${status} never triggers refresh or clears the session`, async () => {
    let calls = 0;
    const env = environment(async () => {
      calls += 1;
      return Response.json({ error: { message: "Server error" } }, { status });
    });
    const model = env.load("@/src/entities/session/model/session");
    model.writeSession(session);
    const { apiRequest } = env.load("@/src/shared/api/client");
    await assert.rejects(apiRequest("/example", { authenticated: true }), (error) => error.status === status);
    assert.equal(calls, 1);
    assert.ok(model.readSession());
  });
}

test("late 401 reuses the completed rotation without losing the session", async () => {
  let release;
  let renewals = 0;
  const env = environment(async (url, options) => {
    if (url.endsWith("/auth/token")) {
      renewals += 1;
      return Response.json({ data: { accessToken: "new-access" } });
    }
    if (url.endsWith("/auth/refresh")) return Response.json({ data: { accessToken: "rotated-access", refreshToken: "rotated" } });
    if (options.headers.get("Authorization") === "Bearer access") {
      if (url.endsWith("/slow")) return new Promise((resolve) => { release = () => resolve(new Response(null, { status: 401 })); });
      return new Response(null, { status: 401 });
    }
    assert.equal(options.headers.get("Authorization"), "Bearer rotated-access");
    return Response.json({ data: true });
  });
  const model = env.load("@/src/entities/session/model/session");
  model.writeSession(session);
  const { apiRequest } = env.load("@/src/shared/api/client");
  const slow = apiRequest("/slow", { authenticated: true });
  await apiRequest("/fast", { authenticated: true });
  release();
  await slow;
  assert.equal(renewals, 1);
  assert.equal(model.readSession().refreshToken, "rotated");
});


test("profile settings allow empty contacts and still validate field limits and region", () => {
  const { validateProfile, validateAvatar } = environment().load("@/src/features/profile-settings/model/validation");
  const initial = { name: "User", region: "Москва", contacts: "Telegram" };
  assert.equal(Object.keys(validateProfile(initial, ["Москва"])).length, 0);
  assert.equal(Object.keys(validateProfile({ ...initial, contacts: "" }, ["Москва"])).length, 0);
  assert.equal(Object.keys(validateProfile({ ...initial, contacts: "  " }, ["Москва"])).length, 0);
  const errors = validateProfile({ name: "x", region: "unknown", contacts: "" }, ["Москва"]);
  assert.ok(errors.name && errors.region);
  assert.equal(errors.contacts, undefined);
  assert.ok(validateProfile({ ...initial, contacts: "x".repeat(501) }, ["Москва"]).contacts);
  assert.ok(validateAvatar({ type: "image/svg+xml", size: 100 }));
  assert.ok(validateAvatar({ type: "image/png", size: 11 * 1024 * 1024 }));
  assert.equal(validateAvatar({ type: "image/jpeg", size: 1024 }), undefined);
});

test("demo lots match transport fields, ratings average all reviews and reviews are newest first", () => {
  const env = environment();
  const { createDemoLots } = env.load("@/src/entities/lot/model/fixtures");
  const { DEMO_REVIEWS, DEMO_EXCHANGES, ratingOf, latestReviews } = env.load("@/src/_pages/profile/model/demo-data");
  const lots = createDemoLots(1, "User", "Москва");
  assert.equal(lots.filter((lot) => lot.status === "ACTIVE").length, 4);
  assert.equal(lots.filter((lot) => lot.status === "MODERATION").length, 2);
  assert.equal(lots.filter((lot) => lot.status === "ARCHIVED").length, 2);
  assert.equal(ratingOf([]), null);
  assert.equal(ratingOf(DEMO_REVIEWS), 14 / 3);
  const shuffled = [...DEMO_REVIEWS].reverse();
  assert.equal(latestReviews(shuffled)[0].id, 1);
  assert.equal(shuffled[0].id, 3);
  assert.ok(DEMO_EXCHANGES.every((exchange) => lots.some((lot) => lot.id === exchange.lotId && lot.status === "COMPLETED")));
  assert.equal(lots[0].wants[0].want_type, "KEYWORDS");
  assert.ok(lots[0].category.name);
});

test("multipart profile update preserves boundary headers and synchronizes the saved avatar", async () => {
  const data = new FormData();
  data.append("region", "Москва");
  let sent = false;
  const env = environment(async (url, options) => {
    assert.ok(url.endsWith("/users/me"));
    assert.equal(options.method, "PATCH");
    assert.equal(options.body, data);
    assert.equal(options.headers.has("Content-Type"), false);
    assert.equal(options.headers.get("Authorization"), "Bearer access");
    sent = true;
    return Response.json({ data: { ...session.user, region: "Москва", avatar_url: "new-avatar.png", email_confirmed: true } });
  });
  const model = env.load("@/src/entities/session/model/session");
  model.writeSession(session);
  const saved = await env.load("@/src/entities/session/api/profile").saveSessionProfile(data);
  assert.equal(sent, true);
  assert.equal(saved.avatarUrl, "new-avatar.png");
  assert.equal(model.readSession().user.avatarUrl, "new-avatar.png");
});

test("public profile response is validated and does not expose an email", async () => {
  const env = environment(async () => Response.json({ data: { id: 2, name: "Public User", email: "private@example.com", email_confirmed: false, region: "Москва", created_at: "2025-01-01T00:00:00Z" } }));
  const profile = await env.load("@/src/entities/profile/api/profile-api").getPublicProfile(2);
  assert.equal(profile.id, 2);
  assert.equal("email" in profile, false);
  await assert.rejects(env.load("@/src/entities/profile/api/profile-api").getPublicProfile(3), (error) => error.status === 502);
});

test("notification events group messages, expire after seven days and keep newest first", () => {
  const model = environment().load("@/src/features/notifications/model/notifications");
  const now = Date.now();
  const event = { id: "one", type: "CHAT_MESSAGE", chatId: 3, createdAt: new Date(now - 1000).toISOString() };
  assert.equal(model.isNotificationEvent(event), true);
  assert.equal(model.isNotificationEvent({ ...event, chatId: "3" }), false);
  assert.equal(model.isNotificationEvent({ ...event, createdAt: "invalid" }), false);
  let items = model.mergeNotification([], event);
  items = model.mergeNotification(items, { ...event, id: "two", createdAt: new Date(now).toISOString() });
  assert.equal(items.length, 1);
  assert.equal(items[0].count, 2);
  assert.equal(model.notificationText(items[0]).text, "Пришло несколько новых сообщений");
  assert.equal(model.mergeNotification(items, { ...event, id: "two" }).length, 1);
  assert.equal(model.notificationHref(items[0]), "/chats/3");
  assert.equal(model.notificationHref({ ...event, type: "NEW_OFFER", offerId: 8 }), "/offers/8");
  assert.equal(model.retainNotifications([{ ...items[0], createdAt: new Date(now - 8 * 86400_000).toISOString() }], now).length, 0);
  assert.equal(model.isImportant("LOT_APPROVED"), false);
  assert.equal(model.categoryOf("MODERATOR_WARNING"), null);
});

test("lot form rejects invalid fields, photos and serializes Spring multipart names", () => {
  const form = environment().load("@/src/_pages/lot/model/form");
  const values = { ...form.initialValues(null, "Москва"), title: "Камера", description: "Камера в хорошем состоянии", categoryId: "1", cost: "12000,50", wantTypes: ["KEYWORDS"], keywords: "Книги" };
  assert.equal(Object.keys(form.validateLotForm(values, ["Москва"], [1], 1)).length, 0);
  assert.ok(form.validateLotForm({ ...values, title: "x", cost: "-1", region: "Unknown", keywords: "" }, ["Москва"], [1], 0).photos);
  assert.equal(form.isFormValues({ ...values, type: "INVALID" }), false);
  assert.ok(form.validatePhotos([{ type: "image/svg+xml", size: 1 }]));
  assert.ok(form.validatePhotos([{ type: "image/png", size: 11 * 1024 * 1024 }]));
  const body = form.toMultipart(values, []);
  assert.equal(body.get("categoryId"), "1");
  assert.equal(body.get("estimatedCost"), "12000.50");
  assert.equal(body.get("wants[0].wantType"), "KEYWORDS");
  assert.equal(body.get("wants[0].keywords"), "Книги");
  assert.equal(body.has("category_id"), false);
});

test("lot API validates nullable dates, caches per session and sends text updates without appending wants", async () => {
  let calls = 0;
  const env = environment(async (_url, options) => {
    calls++;
    if (options.method === "PATCH") {
      const body = JSON.parse(options.body);
      assert.equal(body.title, "Обновлённая камера");
      assert.equal("photos" in body, false);
      assert.equal("wants" in body, false);
    }
    return Response.json({ data: lot });
  });
  const model = env.load("@/src/entities/session/model/session"); model.writeSession(session);
  const lot = { ...env.load("@/src/entities/lot/model/fixtures").createDemoLots(1, "User", "Москва")[0], id: 42, published_at: null, expires_at: null };
  const api = env.load("@/src/entities/lot/api/lot-api");
  await api.getLot(42); await api.getLot(42); assert.equal(calls, 1);
  model.writeSession({ ...session, refreshToken: "another" }); await api.getLot(42); assert.equal(calls, 2);
  await api.updateLot(lot, { title: "Обновлённая камера", description: lot.description, category_id: 1, region: lot.region, type: lot.type, delivery_method: lot.delivery_method, estimated_cost: 1000 }, lot.wants);
  assert.equal(calls, 3);
  await api.getLot(42); assert.equal(calls, 4);
  assert.equal(env.load("@/src/entities/lot/model/validation").isLot({ ...lot, owner: null }), false);
});

test("fixture changes persist across reads, isolate owners and never send fixture ids to backend", async () => {
  let calls = 0;
  const env = environment(async () => { calls++; throw new Error("Unexpected network call"); });
  const fixtures = env.load("@/src/entities/lot/model/fixtures");
  const first = fixtures.initializeFixtureLots(1, "First", "Москва");
  const second = fixtures.initializeFixtureLots(2, "Second", "Москва");
  assert.notEqual(first[0].id, second[0].id);
  const api = env.load("@/src/entities/lot/api/lot-api");
  const archived = await api.archiveLot(first[0]);
  assert.equal(archived.status, "ARCHIVED");
  assert.equal(fixtures.initializeFixtureLots(1, "First", "Москва")[0].status, "ARCHIVED");
  assert.equal(fixtures.getFixtureLot(second[0].id).status, "ACTIVE");
  const published = await api.republishLot(archived); assert.equal(published.id, first[0].id);
  await api.deleteLot(published); assert.equal(fixtures.getFixtureLot(published.id).status, "DELETED");
  assert.equal(calls, 0);
});

test("header selects only the current FAQ or owned lot workspace", () => {
  const { headerSelection } = environment().load("@/src/widgets/site-chrome/model/navigation");
  assert.equal(headerSelection("/login", null, false, false).faq, false);
  assert.equal(headerSelection("/register", null, false, false).faq, false);
  assert.equal(headerSelection("/faq", null, true, false).faq, true);
  assert.equal(headerSelection("/profile", null, true, false).lots, true);
  assert.equal(headerSelection("/profile", "settings", true, false).lots, false);
  assert.equal(headerSelection("/profile", "reviews", true, false).lots, false);
  assert.equal(headerSelection("/users/3", null, true, false).lots, false);
  assert.equal(headerSelection("/lots/43", null, true, false).lots, false);
  assert.equal(headerSelection("/lots/42", null, true, true).lots, true);
  assert.equal(headerSelection("/lots/42/edit", null, true, true).lots, true);
  assert.equal(headerSelection("/lots/new", null, true, false).lots, true);
});

test("lot progression validates only the current step and edits require meaningful changes", () => {
  const form = environment().load("@/src/_pages/lot/model/form");
  const initial = { ...form.initialValues(null, "Москва"), title: "Камера", description: "Камера в хорошем состоянии", categoryId: "1", cost: "12000", wantTypes: ["ANY"] };
  assert.equal(form.canContinueLotStep(1, true, false), true);
  assert.equal(form.canContinueLotStep(2, true, false), false);
  assert.equal(form.canContinueLotStep(1, false, true), false);
  assert.equal(form.hasFormChanges(initial, initial), false);
  assert.equal(form.hasFormChanges({ ...initial, title: "  Камера ", cost: "12000,00", keywords: "Неактивное поле" }, initial), false);
  assert.equal(form.hasFormChanges({ ...initial, description: "Другое описание камеры" }, initial), true);
  assert.equal(form.hasFormChanges({ ...initial, wantTypes: ["KEYWORDS"], keywords: "Книги" }, initial), true);
});

test("lot photo selection detects additions, removal and cover changes", () => {
  const env = environment();
  const model = env.load("@/src/_pages/lot/model/photos");
  const lot = env.load("@/src/entities/lot/model/fixtures").createDemoLots(1, "User", "Москва")[0];
  const photos = model.initialPhotos(lot);
  assert.equal(model.photosChanged(lot, photos), false);
  assert.equal(model.photosChanged(lot, photos.slice(1)), true);
  assert.equal(model.photosChanged(lot, [...photos].reverse()), true);
  assert.equal(model.photosChanged(lot, [...photos, { kind: "file", key: "new", file: {} }]), true);
});

test("server photo changes fail before sending an incompatible PATCH", async () => {
  let calls = 0;
  const env = environment(async () => { calls++; return new Response(null, { status: 204 }); });
  const lot = { ...env.load("@/src/entities/lot/model/fixtures").createDemoLots(1, "User", "Москва")[0], id: 42 };
  const api = env.load("@/src/entities/lot/api/lot-api");
  await assert.rejects(api.updateLot(lot, {}, lot.wants, []), (error) => error.message.includes("фотографий"));
  assert.equal(calls, 0);
});

test("estimate marker stays within the scale and verdict follows the entered price", () => {
  const estimate = environment().load("@/src/_pages/lot/model/estimate");
  assert.equal(estimate.LOT_ESTIMATE.recommended, 27500);
  assert.equal(estimate.priceVerdict(28000), "Ваша оценка в рынке");
  assert.equal(estimate.priceVerdict(1000), "Ваша оценка ниже рынка");
  assert.equal(estimate.priceVerdict(50000), "Ваша оценка выше рынка");
  assert.equal(estimate.pricePosition(1), 2);
  assert.equal(estimate.pricePosition(99999999), 98);
  assert.ok(estimate.pricePosition(24000) < estimate.pricePosition(31000));
});

test("administrative menu role comes from token claims instead of editable user storage", () => {
  const env = environment();
  const model = env.load("@/src/entities/session/model/session");
  const token = (role) => `header.${Buffer.from(JSON.stringify({ role, exp: 2_000_000_000 })).toString("base64url")}.signature`;
  model.writeSession({ ...session, accessToken: token("USER"), user: { ...session.user, role: "ADMIN" } });
  assert.equal(model.readSession().user.role, "USER");
  model.writeSession({ ...session, accessToken: token("ADMIN") });
  assert.equal(model.readSession().user.role, "ADMIN");
  const { accessTokenRole } = env.load("@/src/entities/session/model/role");
  assert.equal(accessTokenRole("malformed"), undefined);
  assert.equal(accessTokenRole(token("SUPERADMIN")), undefined);
  assert.equal(accessTokenRole("h.eyJyb2xlIjoiQURNSU4ifQ.s"), undefined);
});

test("admin user pagination validates transport fields and rejects duplicate identifiers", () => {
  const { parseUsersPage } = environment().load("@/src/features/administration/model/contracts");
  const user = { id: 2, name: "Анна", email: "anna@example.com", role: "USER", status: "FROZEN", email_confirmed: true, avatar_url: null, createdAt: "2026-10-20T10:00:00Z" };
  const page = { content: [user], totalElements: 1, totalPages: 1, page: 0, size: 20 };
  assert.equal(parseUsersPage(page).content[0].emailConfirmed, true);
  assert.throws(() => parseUsersPage({ ...page, content: [{ ...user, role: "ROOT" }] }));
  assert.throws(() => parseUsersPage({ ...page, content: [user, user], totalElements: 2 }));
  assert.throws(() => parseUsersPage({ ...page, page: -1 }));
  assert.throws(() => parseUsersPage({ ...page, content: [{ ...user, createdAt: "wrong" }] }));
});

test("lot categories show each category once when backend repeats child nodes", async () => {
  const leaf = { id: 3, name: "Фото", children: [] };
  const child = { id: 2, name: "Камеры", children: [leaf] };
  const parent = { id: 1, name: "Техника", children: [child] };
  const env = environment(async () => Response.json({ data: [leaf, child, parent] }));
  const categories = await env.load("@/src/entities/lot/api/lot-api").getLotCategories();
  assert.deepEqual(Array.from(categories, (category) => category.id), [3, 2, 1]);
  assert.equal(categories.find((category) => category.id === 3).name, "Фото");
});

test("admin categories flatten duplicated backend tree and prevent descendant parenting", () => {
  const { parseCategories, allowedParents } = environment().load("@/src/features/administration/model/contracts");
  const leaf = { id: 3, name: "Фото", slug: "photo", children: [] };
  const child = { id: 2, name: "Камеры", slug: "cameras", children: [leaf] };
  const parent = { id: 1, name: "Техника", slug: "tech", children: [child] };
  const categories = parseCategories({ data: [leaf, child, parent] });
  assert.equal(categories.length, 3);
  assert.equal(categories.find((item) => item.id === 3).parentId, 2);
  assert.equal(allowedParents(categories, 1).length, 0);
  assert.deepEqual(Array.from(allowedParents(categories, 2), (item) => item.id), [1]);
  assert.throws(() => parseCategories({ data: [{ ...leaf, id: "3" }] }));
});

test("administrative forms require a freeze reason and explicit category visibility", () => {
  const { reasonError, categoryErrors } = environment().load("@/src/features/administration/model/contracts");
  assert.ok(reasonError("  "));
  assert.ok(reasonError("x".repeat(501)));
  assert.equal(reasonError("Нарушение правил сервиса"), undefined);
  assert.ok(categoryErrors("Техника", "tech", "").visibility);
  assert.ok(categoryErrors("Техника", "Bad Slug", "true").slug);
  assert.ok(Object.values(categoryErrors("Техника", "tech-2", "false")).every((error) => !error));
});

test("admin freeze and category mutations use real protected API contracts", async () => {
  const requests = [];
  const env = environment(async (url, options) => { requests.push({ url, ...options }); return new Response(null, { status: 204 }); });
  env.load("@/src/entities/session/model/session").writeSession(session);
  const api = env.load("@/src/features/administration/api/admin-api");
  await api.setUserFrozen(2, true, "  Причина  ");
  await api.setUserFrozen(2, false, "");
  await api.saveAdminCategory(3, { name: "Техника", slug: "tech", parentId: null, isActive: false });
  assert.ok(requests[0].url.endsWith("/admin/users/2/freeze"));
  assert.equal(requests[0].method, "PATCH");
  assert.equal(requests[0].headers.get("Authorization"), "Bearer access");
  assert.deepEqual(JSON.parse(requests[0].body), { reason: "Причина" });
  assert.ok(requests[1].url.endsWith("/admin/users/2/unfreeze"));
  assert.equal(requests[1].body, undefined);
  assert.equal(requests[2].method, "PUT");
  assert.equal(JSON.parse(requests[2].body).isActive, false);
});


test("protected avatar URLs survive remounts and are isolated between sessions", async () => {
  let requests = 0;
  const env = environment(async () => { requests += 1; return new Response(new Blob(["image"], { type: "image/png" })); });
  const sessionModel = env.load("@/src/entities/session/model/session");
  sessionModel.writeSession(session);
  const images = env.load("@/src/shared/api/files");
  assert.equal(images.getCachedProtectedImageUrl("avatar.png"), null);
  const [first, parallel] = await Promise.all([images.getProtectedImageUrl("avatar.png"), images.getProtectedImageUrl("avatar.png")]);
  assert.equal(first, parallel);
  assert.equal(requests, 1);
  assert.equal(images.getCachedProtectedImageUrl("avatar.png"), first);
  assert.equal(await images.getProtectedImageUrl("avatar.png"), first);
  sessionModel.writeSession({ ...session, refreshToken: "another-session" });
  assert.equal(images.getCachedProtectedImageUrl("avatar.png"), null);
  const second = await images.getProtectedImageUrl("avatar.png");
  assert.notEqual(second, first);
  assert.equal(requests, 2);
  sessionModel.clearSession();
  assert.equal(images.getCachedProtectedImageUrl("avatar.png"), null);
  await assert.rejects(images.getProtectedImageUrl("avatar.png"));
});

test("avatar URL cache evicts and revokes old entries without keeping failed downloads", async () => {
  let fail = true;
  const env = environment(async () => fail ? new Response(null, { status: 500 }) : new Response(new Blob(["image"], { type: "image/png" })));
  env.load("@/src/entities/session/model/session").writeSession(session);
  const images = env.load("@/src/shared/api/files");
  await assert.rejects(images.getProtectedImageUrl("first.png"));
  assert.equal(images.getCachedProtectedImageUrl("first.png"), null);
  fail = false;
  const first = await images.getProtectedImageUrl("first.png");
  for (let index = 0; index < 20; index++) await images.getProtectedImageUrl(`avatar-${index}.png`);
  assert.equal(images.getCachedProtectedImageUrl("first.png"), null);
  await assert.rejects(fetch(first));
});

test("exchange choices serialize every selected lot, category, free text and ANY independently", () => {
  const form = environment().load("@/src/_pages/lot/model/form");
  const values = { ...form.initialValues(null, "Москва"), title: "Камера", description: "Камера в хорошем состоянии", categoryId: "1", cost: "12000", wantTypes: ["ANY", "KEYWORDS", "CATEGORY", "LOT"], keywords: " Велосипед или самокат ", targetCategoryIds: ["2", "3"], targetLots: ["42", "https://example.com/lots/43"] };
  assert.equal(Object.keys(form.validateLotForm(values, ["Москва"], [1, 2, 3], 1)).length, 0);
  const body = form.toMultipart(values, []);
  assert.deepEqual(Array.from({ length: 6 }, (_, index) => body.get(`wants[${index}].wantType`)), ["LOT", "LOT", "CATEGORY", "CATEGORY", "KEYWORDS", "ANY"]);
  assert.equal(body.get("wants[1].targetLot"), "43");
  assert.equal(body.get("wants[3].targetCategoryId"), "3");
  assert.equal(body.get("wants[4].keywords"), "Велосипед или самокат");
  assert.equal(body.has("wants[5].targetCategoryId"), false);
  const onlyAny = form.toMultipart({ ...values, wantTypes: ["ANY"] }, []);
  assert.deepEqual([...onlyAny.keys()].filter((key) => key.startsWith("wants")), ["wants[0].wantType"]);
  assert.ok(form.validateLotForm({ ...values, wantTypes: [] }, ["Москва"], [1, 2, 3], 1).wantTypes);
  const invalid = form.validateLotForm({ ...values, keywords: "", targetCategoryIds: [], targetLots: ["42", "/lots/42"] }, ["Москва"], [1, 2, 3], 1);
  assert.ok(invalid.keywords && invalid.targetCategoryIds && invalid.targetLots);
});

test("exchange drafts migrate a single legacy choice and preserve new multiple choices", () => {
  const form = environment().load("@/src/_pages/lot/model/form");
  const base = form.initialValues(null, "Москва");
  delete base.wantTypes; delete base.targetLots; delete base.targetCategoryIds;
  const migrated = form.readFormValues({ ...base, wantType: "LOT", targetCategoryId: "", targetLot: "/lots/42" });
  assert.deepEqual(Array.from(migrated.wantTypes), ["LOT"]);
  assert.deepEqual(Array.from(migrated.targetLots), ["42"]);
  assert.equal("wantType" in migrated, false);
  const multiple = { ...base, wantTypes: ["CATEGORY", "KEYWORDS", "ANY"], targetCategoryIds: ["2", "3"], targetLots: [] };
  assert.equal(form.readFormValues(multiple), multiple);
  assert.equal(form.readFormValues({ ...multiple, wantTypes: ["CATEGORY", "CATEGORY"] }), null);
  assert.equal(form.readFormValues({ ...multiple, targetLots: [null] }), null);
});

test("existing lot restores every exchange choice and dirty state ignores selection order", () => {
  const form = environment().load("@/src/_pages/lot/model/form");
  const wants = [{ want_type: "CATEGORY", target_category: { id: 2, name: "Книги" } }, { want_type: "CATEGORY", target_category: { id: 3, name: "Спорт" } }, { want_type: "LOT", target_lot: "42" }, { want_type: "LOT", target_lot: "43" }, { want_type: "KEYWORDS", keywords: "Велосипед" }, { want_type: "ANY" }];
  const values = form.initialValues({ category: { id: 1 }, estimated_cost: 12000, wants }, "Москва");
  assert.equal(form.formWants(values, []).length, 6);
  const reordered = { ...values, wantTypes: [...values.wantTypes].reverse(), targetCategoryIds: ["3", "2"], targetLots: ["/lots/43", "42"] };
  assert.equal(form.hasFormChanges(reordered, values), false);
  assert.equal(form.hasFormChanges({ ...values, wantTypes: ["ANY"] }, values), true);
  assert.equal(form.hasFormChanges({ ...values, wantTypes: ["ANY"] }, values, false), false);
  assert.equal(form.hasFormChanges({ ...values, wantTypes: ["ANY"], keywords: "Скрытый текст" }, { ...values, wantTypes: ["ANY"] }), false);
});

test("target lot references accept only positive safe identifiers and supported links", () => {
  const form = environment().load("@/src/_pages/lot/model/form");
  for (const value of ["42", " /lots/42/ ", "https://example.com/lots/42"]) assert.equal(form.parseTargetLot(value), "42");
  for (const value of ["0", "-1", "1.5", "text", "https://example.com/profile/42", "9007199254740992"]) assert.equal(form.parseTargetLot(value), null);
});
