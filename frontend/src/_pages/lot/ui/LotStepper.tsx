import Image from "next/image";
import styles from "./LotForm.module.scss";

export function LotStepper({ step, submitted = false }: { step: number; submitted?: boolean }) {
  return <ol className={styles.stepper} aria-label="Этапы публикации">{["Информация", "Оценка и обмен", "Публикация"].map((label, index) => <li key={label} data-state={index + 1 < step ? "completed" : index + 1 === step ? "current" : "upcoming"} aria-current={step === index + 1 ? "step" : undefined}><span role={index + 1 < step ? "img" : undefined} aria-label={index + 1 < step ? `Этап ${index + 1} завершён` : undefined}>{index + 1 < step ? <Image src={submitted ? "/images/lot-moderation/completed-step.svg" : "/images/lot-stepper/completed.svg"} alt="" width={36} height={submitted ? 34.9143 : 36} /> : index + 1}</span><strong>{label}</strong></li>)}</ol>;
}
