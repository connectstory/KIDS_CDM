import { useEffect, useRef, useState } from "react";
import { createPopper } from "@popperjs/core";

interface Step {
  target: React.RefObject<HTMLElement | null>;
  content: string;
}

interface StepGuideProps {
  steps: Step[];
  onFinish?: () => void;
}

export default function StepGuide({ steps, onFinish }: StepGuideProps) {
  const [current, setCurrent] = useState(0);
  const [rect, setRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const popperRef = useRef<HTMLDivElement>(null);
  const popperInstance = useRef<any>(null);

  const step = current < steps.length ? steps[current] : null;

  /* ESC 종료 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCurrent(steps.length);
        onFinish?.();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onFinish, steps.length]);

  /* Popper Tooltip 위치 */
  useEffect(() => {
    if (!step?.target?.current || !popperRef.current) return;

    popperInstance.current?.destroy();
    popperInstance.current = createPopper(step.target.current, popperRef.current, {
      placement: "bottom",
      modifiers: [
        { name: "offset", options: { offset: [0, 12] } },
        { name: "preventOverflow", options: { padding: 8 } },
      ],
    });

    return () => popperInstance.current?.destroy();
  }, [current, step]);

  /* Highlight rect 계산 */
  useEffect(() => {
    const el = step?.target?.current;
    if (!el) return;

    const updateRect = () => {
      const r = el.getBoundingClientRect();
      setRect({
        x: r.left - 8,
        y: r.top - 8,
        width: r.width + 16,
        height: r.height + 16,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [current, step]);

  // 마지막이면 guide 제거
  if (current >= steps.length || !step) return null;

  /* 정확한 clip-path spotlight */
  const maskStyle = rect
    ? {
        WebkitMask: `
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0)
    `,
        WebkitMaskComposite: "xor",

        mask: `
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0)
    `,
        maskComposite: "exclude",

        padding: `${rect.y}px ${window.innerWidth - rect.x - rect.width}px ${
          window.innerHeight - rect.y - rect.height
        }px ${rect.x}px`,
        transition: "all 0.3s ease-out",
      }
    : {};

  const next = () => {
    if (current === steps.length - 1) {
      setCurrent(steps.length);
      onFinish?.();
    } else {
      setCurrent((c) => c + 1);
    }
  };

  const prev = () => setCurrent((c) => Math.max(c - 1, 0));

  const finish = () => {
    setCurrent(steps.length);
    onFinish?.();
  };

  return (
    <>
      {/* Backdrop with spotlight hole */}
      <div
        className="fixed inset-0 bg-black/70 z-[9990] pointer-events-none"
        style={maskStyle}
      />

      {/* Highlight border */}
      {/* {rect && (
        <div
          className="fixed z-[9991] pointer-events-none border-4 border-white rounded-lg 1shadow-[0_0_20px_8px_rgba(255,255,255,0.6)] transition-all "
          style={{
            top: `${rect.y}px`,
            left: `${rect.x}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            borderRadius: `${15}px`,
          }}
        />
      )} */}

      {/* Tooltip */}
      <div
        ref={popperRef}
        className="z-[9992] bg-white text-gray-900 p-4 rounded-lg shadow-2xl max-w-sm"
      >
        <div className="mb-3">
          <p className="font-semibold text-sm text-gray-500 mb-1">
            Step {current + 1} / {steps.length}
          </p>
          <p className="text-base">{step.content}</p>
        </div>

        <div className="flex justify-between items-center gap-2">
          <button
            onClick={prev}
            disabled={current === 0}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            이전
          </button>

          {current === steps.length - 1 ? (
            <button
              onClick={finish}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
            >
              완료
            </button>
          ) : (
            <button
              onClick={next}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm font-medium"
            >
              다음
            </button>
          )}
        </div>
      </div>
    </>
  );
}
