import { useLayoutEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { CONTENT_GAP } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import { useModal } from "@/hooks/useModal";
import { SpaceBox } from "@/components/SpaceBox";

interface TextWithLineLimitProps {
  title?: string;
  text: string | null | undefined;
  maxLines?: number;
  onShowMore?: (text: string) => void;
  variant?: "default" | "description" | "body1" | "body2" | "h6" | "h5" | "h4" | "h3" | "h2" | "h1";
  showMoreButtonText?: string;
}

export default function TextWithLineLimit({
  title,
  text,
  maxLines = 5,
  onShowMore,
  variant = "default",
  showMoreButtonText = "더보기",
}: TextWithLineLimitProps) {
  const textRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMoreButton, setShowMoreButton] = useState(false);
  const textViewModal = useModal(ModalNames.TextView);

  // 텍스트가 maxLines 이상인지 확인 - useLayoutEffect로 동기적으로 처리하여 깜빡임 방지
  useLayoutEffect(() => {
    if (!textRef.current || !containerRef.current || !text) {
      setShowMoreButton(false);
      return;
    }

    const textElement = textRef.current;
    const containerElement = containerRef.current;

    // 컨테이너 너비 가져오기
    const containerWidth = containerElement.offsetWidth;
    if (containerWidth === 0) {
      setShowMoreButton(false);
      return;
    }

    // 임시 측정용 요소 생성 (화면 밖에 배치하여 보이지 않게)
    const measureElement = document.createElement("pre");
    const computedStyle = window.getComputedStyle(textElement);

    // 스타일 복사
    measureElement.style.position = "fixed";
    measureElement.style.top = "-9999px";
    measureElement.style.left = "-9999px";
    measureElement.style.width = `${containerWidth}px`;
    measureElement.style.visibility = "hidden";
    measureElement.style.whiteSpace = "pre-wrap";
    measureElement.style.wordBreak = "break-word";
    measureElement.style.margin = "0";
    measureElement.style.padding = "0";
    measureElement.style.fontSize = computedStyle.fontSize;
    measureElement.style.fontFamily = computedStyle.fontFamily;
    measureElement.style.lineHeight = computedStyle.lineHeight;
    measureElement.textContent = text;

    document.body.appendChild(measureElement);

    // 높이 측정
    const fullHeight = measureElement.scrollHeight;
    const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.5;
    const maxHeight = lineHeight * maxLines;

    // 측정 요소 제거
    document.body.removeChild(measureElement);

    // maxLines를 넘으면 더보기 버튼 표시
    setShowMoreButton(fullHeight > maxHeight);
  }, [text, maxLines]);

  const handleShowMore = () => {
    if (text && onShowMore) {
      onShowMore(text);
    } else if (text) {
      textViewModal.open({
        title: title ? title : "더보기",
        message: text,
      });
    }
  };

  if (!text) {
    return null;
  }

  return (
    <Box ref={containerRef}>
      {/* 표시되는 텍스트 (maxLines 제한) */}
      <Typography
        component="pre"
        variant={variant}
        ref={textRef}
        sx={{
          margin: 0,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          display: "-webkit-box",
          WebkitLineClamp: maxLines,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {text}
      </Typography>
      {showMoreButton && (
        <>
          <SpaceBox gap={CONTENT_GAP.SMALL} />
          <Button variant="outlined" size="small" onClick={handleShowMore}>
            {showMoreButtonText}
          </Button>
        </>
      )}
    </Box>
  );
}
