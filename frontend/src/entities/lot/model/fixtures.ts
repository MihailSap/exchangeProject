import type { Lot, LotStatus } from "./lot";
import { isLot } from "./validation";

export function createDemoLots(ownerId: number, name: string, region: string): Lot[] {
  const entries: { title: string; cost: number; image: string; status: LotStatus; category: string; description: string }[] = [
    { title: "Камера Fujifilm X-T30", cost: 28000, image: "camera.svg", status: "ACTIVE", category: "Электроника", description: "Бережно использовал камеру для путешествий. В комплекте аккумулятор, зарядное устройство и ремень. Обменяю на объектив или другую фототехнику." },
    { title: "Кресло в скандинавском стиле", cost: 12500, image: "chair.png", status: "MODERATION", category: "Дом и уют", description: "Уютное кресло с деревянными ножками и мягким сиденьем. Отлично подойдёт для чтения. Самовывоз по договорённости." },
    { title: "Кофемашина De’Longhi", cost: 24000, image: "coffee.svg", status: "ARCHIVED", category: "Электроника", description: "Компактная кофемашина для дома. Регулярно обслуживалась, все функции работают. Ищу что-нибудь для обустройства дома." },
    { title: "Плёночная камера Зенит", cost: 6000, image: "camera.svg", status: "ACTIVE", category: "Фототехника", description: "Рабочая плёночная камера с объективом. Подойдёт для знакомства с аналоговой фотографией." },
    { title: "Кресло для рабочего уголка", cost: 8500, image: "chair.png", status: "ACTIVE", category: "Дом и уют", description: "Удобное кресло для домашнего кабинета. Состояние хорошее, обивка без повреждений." },
    { title: "Кофеварка для хорошего утра", cost: 4500, image: "coffee.svg", status: "ACTIVE", category: "Электроника", description: "Простая и надёжная кофеварка. Обменяю на книги, настольные игры или предметы для дома." },
    { title: "Фотоаппарат для начинающих", cost: 9000, image: "camera.svg", status: "MODERATION", category: "Фототехника", description: "Лёгкая камера для первых фотографий. Зарядное устройство в комплекте." },
    { title: "Винтажное кресло", cost: 7000, image: "chair.png", status: "ARCHIVED", category: "Дом и уют", description: "Винтажное кресло после восстановления. Хочется найти ему новый дом." },
    { title: "Камера моментальной печати", cost: 7500, image: "camera.svg", status: "COMPLETED", category: "Фототехника", description: "Камера уже нашла нового владельца благодаря обмену." },
    { title: "Кресло для чтения", cost: 10000, image: "chair.png", status: "COMPLETED", category: "Дом и уют", description: "Обмен завершён. Теперь это кресло радует другого участника." },
    { title: "Кофемашина для эспрессо", cost: 18000, image: "coffee.svg", status: "COMPLETED", category: "Электроника", description: "Обмен завершён, обе стороны остались довольны." },
  ];
  return entries.map((entry, index) => ({ id: 90001 + index + Math.max(0, ownerId - 1) * 100, title: entry.title, description: entry.description, type: "PRODUCT", delivery_method: "BOTH", estimated_cost: entry.cost,
    category: { id: entry.category === "Дом и уют" ? 2 : 1, name: entry.category }, region,
    photos: index === 0 ? ["camera-front.png", "camera-back.png", "camera-kit.png"].map((photo, order) => ({ order, name: `/images/lots/${photo}` })) : [{ order: 0, name: `/images/profile/${entry.image}` }], owner: { id: ownerId, name, rating: 14 / 3 },
    wants: [{ want_type: "KEYWORDS", keywords: "Фототехника, книги или вещи для дома", target_category: null, target_lot: null }], status: entry.status,
    published_at: "2026-10-15T10:00:00Z", expires_at: "2026-11-14T10:00:00Z" }));
}


const fixtureKey = "exchange.lot-fixtures.v1";
function readFixtureLots(): Lot[] {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(fixtureKey) || "[]");
    return Array.isArray(value) ? value.filter(isLot) : [];
  } catch { return []; }
}
export function saveFixtureLot(lot: Lot): void {
  const next = [...readFixtureLots().filter((item) => item.id !== lot.id), lot];
  try { window.localStorage.setItem(fixtureKey, JSON.stringify(next)); } catch { throw new Error("Не удалось сохранить изменения лота на устройстве"); }
}
export function initializeFixtureLots(ownerId: number, name: string, region: string): Lot[] {
  const stored = readFixtureLots();
  const lots = createDemoLots(ownerId, name, region).map((lot) => stored.find((item) => item.id === lot.id && item.owner.id === ownerId) ?? lot);
  try { window.localStorage.setItem(fixtureKey, JSON.stringify([...stored.filter((lot) => lot.owner.id !== ownerId), ...lots])); } catch { return lots; }
  return lots;
}
export function getFixtureLot(id: number): Lot | undefined { return readFixtureLots().find((lot) => lot.id === id); }
