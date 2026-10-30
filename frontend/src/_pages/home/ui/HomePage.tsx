import Image from "next/image";
import Link from "next/link";

import { HomeDiscovery } from "./HomeDiscovery";
import styles from "./HomePage.module.scss";

import { Icon } from "@/src/shared/ui/icon";
import { SiteFooter, SiteHeader } from "@/src/widgets/site-chrome";

export function HomePage() {
  return (
    <div className="sitePage">
      <SiteHeader />
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-heading">
          <div className={styles.heroContent}>
            <span className={styles.eyebrow}>СООБЩЕСТВО ОБМЕНА</span>
            <h1 id="home-heading">
              У вещей есть
              <br />
              вторая жизнь.
            </h1>
            <p>
              Находите то, что давно искали —
              <br />
              и отдавайте то, чем готовы поделиться.
            </p>
            <Link className={styles.heroButton} href="/catalog">
              Найти свой обмен
              {" "}
              <Icon name="arrow" />
            </Link>
          </div>
          <Image
            className={styles.heroImage}
            src="/images/discovery/hero.png"
            alt=""
            width={571}
            height={322}
            preload
            sizes="(max-width: 600px) 100vw, 45vw"
          />
        </section>
        <HomeDiscovery />
      </main>
      <SiteFooter />
    </div>
  );
}
