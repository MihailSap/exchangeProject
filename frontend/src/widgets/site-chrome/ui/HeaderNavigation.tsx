"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { headerSelection } from "../model/navigation";
import styles from "./SiteHeader.module.scss";

type Props = { authenticated: boolean; ownLot: boolean };
export function HeaderNavigationLinks({ authenticated, selected = { faq: false, lots: false } }: { authenticated: boolean; selected?: { faq: boolean; lots: boolean } }) {
  return <nav className={styles.nav} aria-label="Основная навигация"><span>Каталог</span>{authenticated ? <><Link href="/profile" data-label="Мои лоты" aria-current={selected.lots ? "page" : undefined}><span>Мои лоты</span></Link><span title="Раздел появится позже">Предложения</span><span title="Раздел появится позже">Чаты</span><Link href="/faq" data-label="FAQ" aria-current={selected.faq ? "page" : undefined}><span>FAQ</span></Link></> : <><Link href="/faq" data-label="FAQ" aria-current={selected.faq ? "page" : undefined}><span>FAQ</span></Link><span>Документация</span></>}</nav>;
}
export function HeaderNavigation({ authenticated, ownLot }: Props) {
  const pathname = usePathname();
  const search = useSearchParams();
  return <HeaderNavigationLinks authenticated={authenticated} selected={headerSelection(pathname, search.get("section"), authenticated, ownLot)} />;
}
