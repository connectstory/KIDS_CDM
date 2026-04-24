import styles from "./CdmPagination.module.css";

export default function CdmPagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = getPageWindow(page, totalPages, 5);
  const go = (p: number) => onChange(Math.min(totalPages, Math.max(1, p)));

  function getPageWindow(page: number, totalPages: number, windowSize = 5) {
    const size = Math.min(windowSize, totalPages);

    if (totalPages <= size) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(size / 2); // 2
    // page를 가운데로 두되, 양 끝에서 밀리지 않게 clamp
    let start = page - half;
    start = Math.max(1, start);
    start = Math.min(totalPages - size + 1, start);

    return Array.from({ length: size }, (_, i) => start + i);
  }

  return (
    <div className={styles.cdm_pagination}>
      <button
        className={styles.cdm_pagination_first}
        disabled={page === 1}
        onClick={() => go(1)}
      >
        <i className="fa-solid fa-angles-left"></i>
      </button>
      <button
        className={styles.cdm_pagination_prev}
        disabled={page === 1}
        onClick={() => go(page - 1)}
      >
        <i className="fa-solid fa-angle-left"></i>
      </button>

      {pages.map((p) => (
        <button
          key={p}
          className={`${styles.cdm_pagination_page} ${p === page ? styles.cdm_pagination_page_active : ""}`}
          onClick={() => go(p)}
        >
          {p}
        </button>
      ))}

      <button
        className={styles.cdm_pagination_next}
        disabled={page === totalPages}
        onClick={() => go(page + 1)}
      >
        <i className="fa-solid fa-angle-right"></i>
      </button>
      <button
        className={styles.cdm_pagination_last}
        disabled={page === totalPages}
        onClick={() => go(totalPages)}
      >
        <i className="fa-solid fa-angles-right"></i>
      </button>
    </div>
  );
}
