import Link from "next/link";
import { Icon } from "@/src/shared/ui/icon";
import styles from "./Breadcrumbs.module.scss";

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav aria-label="Хлебные крошки" className={styles.breadcrumbs}><ol>{items.map((item, index) => <li key={`${item.label}:${index}`}>{index > 0 && <Icon name="chevron" />}{item.href ? <Link href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>;
}
