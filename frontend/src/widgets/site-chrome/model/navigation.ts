export function headerSelection(pathname: string, section: string | null, authenticated: boolean, ownLot: boolean): { faq: boolean; lots: boolean } {
  return {
    faq: pathname === "/faq",
    lots: authenticated && (pathname === "/profile" && section !== "reviews" && section !== "settings" || pathname === "/lots/new" || ownLot && /^\/lots\/[1-9]\d*(\/edit)?$/.test(pathname)),
  };
}
