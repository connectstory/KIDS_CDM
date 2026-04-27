/**
 * 댓글 컴포넌트
 * 연구과제에 대한 댓글을 표시하고 관리하는 컴포넌트
 *
 * 주요 기능:
 * - 댓글 목록 표시
 * - 댓글 작성
 * - 댓글 수정
 * - 댓글 삭제
 * - 대댓글 작성
 * - 대댓글에 대한 답글 작성 (3단계 이상 스레드 지원)
 */
import { useEffect, useRef, useState } from "react";
import { Stack } from "@mui/material";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useSelector } from "react-redux";
import { MSG } from "@/constants/string";
import { CONTENT_GAP } from "@/constants/types";
import { ModalNames } from "@/interfaces/modalInterface";
import type { ResearchCommentDto, ResearchPartnerResponse } from "@/interfaces/researchInterface";
import type { RootState } from "@/store";
import { isResearchCrudDisabled } from "@/utils/common";
import { formatDateTimeComma } from "@/utils/dateUtils";
import {
  useCreateResearchComment,
  useDeleteResearchComment,
  useUpdateResearchComment,
} from "@/hooks/research/useResearchMutations";
import { useResearchComments, useResearchDetail, useResearchMentionTargets } from "@/hooks/research/useResearchQueries";
import { useModal } from "@/hooks/useModal";
import { AppButton, AppTextField } from "@/components/ui";

type UiComment = {
  asmtCmntSn: number;
  upCmntAnsSn: number | null;
  instName: string;
  rgtrName: string;
  message: string;
  createdAt: string;
  isMy: boolean;
  children?: UiComment[];
};

function buildTree(list: ResearchCommentDto[], sessionMbrId?: string | null): UiComment[] {
  const map = new Map<number, UiComment>();
  const roots: UiComment[] = [];

  for (const c of list) {
    map.set(c.asmtCmntSn, {
      asmtCmntSn: c.asmtCmntSn,
      upCmntAnsSn: c.upCmntAnsSn ?? null,
      instName: c.instNm ?? c.deptNm ?? "알 수 없음",
      rgtrName: `${c.mbrNm ?? c.empNm ?? "알 수 없음"}`,
      message: c.cmntDtlCn,
      createdAt: formatDateTimeComma(c.regDt),
      isMy: !!sessionMbrId && c.rgtrId === sessionMbrId,
      children: [],
    });
  }

  for (const node of map.values()) {
    if (node.upCmntAnsSn && map.has(node.upCmntAnsSn)) {
      map.get(node.upCmntAnsSn)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  // 대댓글 영역: 대댓글과 답글을 같은 깊이로 펼쳐서 시간순 정렬
  const byCreatedAt = (a: UiComment, b: UiComment) => (a.createdAt === b.createdAt ? 0 : a.createdAt < b.createdAt ? -1 : 1);

  function flattenReplies(nodes: UiComment[]): UiComment[] {
    const out: UiComment[] = [];
    for (const node of nodes) {
      out.push(node);
      if (node.children?.length) out.push(...flattenReplies(node.children));
    }
    return out;
  }

  for (const root of roots) {
    if (root.children?.length) {
      root.children = flattenReplies(root.children).sort(byCreatedAt);
    }
    if (root.children?.length === 0) delete root.children;
  }
  roots.sort(byCreatedAt);
  return roots;
}

/**
 * 멘션(@기관명) 안에서 Backspace/Delete 시 해당 멘션 전체를 지우기 위한 범위 계산
 * @returns 제거할 범위 { start, end } 또는 null
 */
function getMentionRemovalRange(
  value: string,
  cursor: number,
  key: "Backspace" | "Delete"
): { start: number; end: number } | null {
  if (key === "Backspace") {
    if (cursor <= 0) return null;
    const charBefore = value[cursor - 1];
    if (charBefore === " " || charBefore === "\n") return null;
    let atIndex = -1;
    for (let i = cursor - 1; i >= 0; i--) {
      if (value[i] === " " || value[i] === "\n") break;
      if (value[i] === "@") {
        atIndex = i;
        break;
      }
    }
    if (atIndex === -1) return null;
    let end = atIndex + 1;
    while (end < value.length && value[end] !== " " && value[end] !== "\n") end++;
    return { start: atIndex, end };
  }
  // Delete
  if (cursor >= value.length) return null;
  if (value[cursor] === " " || value[cursor] === "\n") return null;
  let wordStart = cursor;
  while (wordStart > 0 && value[wordStart - 1] !== " " && value[wordStart - 1] !== "\n") wordStart--;
  if (wordStart === 0 || value[wordStart - 1] !== "@") return null;
  const mentionStart = wordStart - 1;
  let end = cursor + 1;
  while (end < value.length && value[end] !== " " && value[end] !== "\n") end++;
  return { start: mentionStart, end };
}

/** 댓글 메시지에서 @기관명을 멘션 칩으로 렌더링 */
function renderMessageWithMentions(message: string, targets: Array<{ instId: string; instNm: string | null }>) {
  const parts = message.split(/(@[^\s]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      const name = part.slice(1);
      const partner = targets.find((p) => (p.instNm ?? p.instId) === name);
      const label = "@" + (partner ? (partner.instNm ?? partner.instId) : part);
      // return <Chip key={i} label={label} size="small" sx={{ backgroundColor: "white" }} variant="outlined" />;
      return (
        <Typography component="span" variant="body2" key={i} color="primary">
          {label}
        </Typography>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * textarea의 insert 커서(캐럿) 위치 픽셀 좌표 반환 (뷰포트 기준)
 * @param value - 현재 텍스트 (controlled component 대응, 없으면 element.value 사용)
 */
function getCaretPixelPosition(
  element: HTMLTextAreaElement | HTMLInputElement,
  position: number,
  value?: string
): { left: number; top: number } {
  const doc = element.ownerDocument;
  const style = doc.defaultView?.getComputedStyle(element) ?? ({} as CSSStyleDeclaration);
  const text = (value !== undefined ? value : element.value).substring(0, position);

  const mirror = doc.createElement("div");
  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflow = "hidden";
  mirror.style.top = "0";
  mirror.style.left = "0";
  mirror.style.width = `${element.offsetWidth}px`;
  mirror.style.boxSizing = style.boxSizing ?? "border-box";
  mirror.style.padding = style.padding || "0";
  mirror.style.fontFamily = style.fontFamily || "inherit";
  mirror.style.fontSize = style.fontSize || "inherit";
  mirror.style.fontWeight = style.fontWeight || "inherit";
  mirror.style.lineHeight = style.lineHeight || "inherit";
  mirror.style.letterSpacing = style.letterSpacing || "normal";
  mirror.style.border = style.border || "none";
  mirror.setAttribute("aria-hidden", "true");
  doc.body.appendChild(mirror);
  mirror.textContent = text;
  const span = doc.createElement("span");
  span.textContent = "\u200b";
  mirror.appendChild(span);
  const spanRect = span.getBoundingClientRect();
  const mirrorRect = mirror.getBoundingClientRect();
  const textareaRect = element.getBoundingClientRect();
  doc.body.removeChild(mirror);

  const scrollTop = element.scrollTop ?? 0;
  const scrollLeft = element.scrollLeft ?? 0;
  const offsetX = spanRect.left - mirrorRect.left;
  const offsetY = spanRect.bottom - mirrorRect.top;
  return {
    left: textareaRect.left - scrollLeft + offsetX,
    top: textareaRect.top - scrollTop + offsetY,
  };
}

/** 멘션 팝업/표시용 항목 (과제 생성자 또는 참여기관, inst_id/brno·기관명) */
type MentionTarget = Pick<ResearchPartnerResponse, "asmtPtcpInstSn" | "instId" | "instNm">;

/** 멘션 팝업 (배경 클릭 시 닫힘, 커서 위치에 리스트 표시) */
function MentionPopup({
  cursorPixel,
  partners,
  onSelect,
  onSelectAll,
  onClose,
}: {
  cursorPixel: { left: number; top: number };
  partners: MentionTarget[];
  selectedIndex: number;
  onSelect: (target: MentionTarget) => void;
  onSelectAll?: () => void;
  onClose: () => void;
}) {
  const gap = 4;
  const maxW = 230;
  const maxH = 250;
  const showAll = !!onSelectAll;

  const leftClamp = Math.min(cursorPixel.left, typeof window !== "undefined" ? window.innerWidth - maxW - 8 : cursorPixel.left);
  const topClamp = Math.min(
    cursorPixel.top + gap,
    typeof window !== "undefined" ? window.innerHeight - maxH - 8 : cursorPixel.top + gap
  );

  return (
    <>
      <Box sx={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={onClose} aria-hidden />
      <Paper
        elevation={3}
        sx={{
          position: "fixed",
          left: Math.max(8, leftClamp),
          top: Math.max(8, topClamp),
          width: maxW,
          // height: maxH,
          maxWidth: maxW,
          maxHeight: maxH,
          minWidth: 120,
          zIndex: 10,
          borderRadius: 2,
          boxShadow: "0 0 20px 0 rgba(0, 0, 0, 0.2)",
          overflow: "auto",
        }}
      >
        <List dense disablePadding>
          {showAll && (
            <ListItemButton sx={{ height: 37 }} onClick={onSelectAll}>
              <Typography variant="body3">전체</Typography>
            </ListItemButton>
          )}
          {partners.map((p) => (
            <ListItemButton
              sx={{ height: 37 }}
              key={p.asmtPtcpInstSn}
              // selected={showAll ? selectedIndex === i + 1 : selectedIndex === i}
              onClick={() => onSelect(p)}
            >
              <Typography variant="body3">{p.instNm ?? p.instId}</Typography>
            </ListItemButton>
          ))}
        </List>
      </Paper>
    </>
  );
}

/** 멘션 드롭다운 표시 상태 */
type MentionState = {
  start: number;
  search: string;
  cursorPosition: number;
  /** 커서 픽셀 위치 (팝업 배치용) */
  cursorPixel: { left: number; top: number };
};

export default function ConcentComment({ asmtSn }: { asmtSn: number }) {
  const session = useSelector((state: RootState) => state.session);
  const { data: research } = useResearchDetail(asmtSn);
  const { data: commentDtos = [], refetch } = useResearchComments(asmtSn, !!asmtSn);
  const { creator, partners } = useResearchMentionTargets(asmtSn);
  const confirmModal = useModal(ModalNames.CONFIRM);
  const createMutation = useCreateResearchComment();
  const updateMutation = useUpdateResearchComment();
  const deleteMutation = useDeleteResearchComment();

  const comments = buildTree(commentDtos, session?.mbrId);

  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  /** @ 멘션: 드롭다운 표시 여부 및 검색어 */
  const [mentionState, setMentionState] = useState<MentionState | null>(null);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  /** 수정 중인 댓글 정보 (asmtCmntSn 기준, 재귀 렌더링 대응) */
  const [editing, setEditing] = useState<{
    asmtCmntSn: number;
    text: string;
  } | null>(null);

  /** 대댓글/답글 작성 대상 (상위 댓글 asmtCmntSn, 이름, 스레드 루트 asmtCmntSn) */
  const [replyingTo, setReplyingTo] = useState<{
    parentAsmtCmntSn: number;
    parentName: string;
    rootAsmtCmntSn: number;
  } | null>(null);

  /** 멘션 대상 목록: 과제 생성자(주관기관) + 참여기관 (생성자와 동일 instId 중복 제거) */
  const mentionTargetsList: MentionTarget[] = (() => {
    const list: MentionTarget[] = [];
    if (creator) {
      list.push({ asmtPtcpInstSn: 0, instId: creator.instId, instNm: creator.instNm });
    }
    const creatorInstId = creator?.instId;
    for (const p of partners) {
      if (p.instId !== creatorInstId) list.push({ asmtPtcpInstSn: p.asmtPtcpInstSn, instId: p.instId, instNm: p.instNm ?? null });
    }
    return list;
  })();

  /** 멘션 후보: 목록 중 검색어에 맞는 항목 */
  const filteredPartners = (() => {
    if (!mentionState) return [];
    const q = mentionState.search.trim().toLowerCase();
    if (!q) return mentionTargetsList.slice(0, 10);
    return mentionTargetsList.filter((p) => (p.instNm ?? p.instId).toLowerCase().includes(q)).slice(0, 10);
  })();

  /** 댓글 입력 변경 시 @ 멘션 감지 (textarea insert 커서 위치에 팝업 배치) */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? value.length;
    setInputText(value);

    const textBeforeCursor = value.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf("@");
    if (lastAt !== -1) {
      const afterAt = textBeforeCursor.slice(lastAt + 1);
      if (!/\s/.test(afterAt)) {
        let cursorPixel = { left: 0, top: 0 };
        const el = e.target as HTMLTextAreaElement | HTMLInputElement;
        try {
          cursorPixel = getCaretPixelPosition(el, cursor, value);
        } catch {
          const rect = el.getBoundingClientRect();
          cursorPixel = { left: rect.left, top: rect.bottom };
        }
        setMentionState({ start: lastAt, search: afterAt, cursorPosition: cursor, cursorPixel });
        setSelectedMentionIndex(0);
        return;
      }
    }
    setMentionState(null);
  };

  /** 멘션 선택 시 텍스트에 삽입 */
  const applyMention = (target: MentionTarget) => {
    if (!mentionState) return;
    const name = target.instNm ?? target.instId;
    const before = inputText.slice(0, mentionState.start);
    const after = inputText.slice(mentionState.cursorPosition);
    const inserted = `${before}@${name} ${after}`;
    setInputText(inserted);
    setMentionState(null);
    setTimeout(() => {
      const newCursor = mentionState.start + `@${name} `.length;
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
      textareaRef.current?.focus();
    }, 0);
  };

  /** "전체" 멘션 삽입 */
  const applyMentionAll = () => {
    if (!mentionState) return;
    const name = "전체";
    const before = inputText.slice(0, mentionState.start);
    const after = inputText.slice(mentionState.cursorPosition);
    const inserted = `${before}@${name} ${after}`;
    setInputText(inserted);
    setMentionState(null);
    setTimeout(() => {
      const newCursor = mentionState.start + `@${name} `.length;
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
      textareaRef.current?.focus();
    }, 0);
  };

  /** 입력창 키다운: 멘션 드롭다운 + 멘션 내부 Backspace/Delete 시 전체 삭제 */
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const value = inputText;
    const cursor = target.selectionStart ?? value.length;

    if (e.key === "Backspace" || e.key === "Delete") {
      const range = getMentionRemovalRange(value, cursor, e.key);
      if (range) {
        e.preventDefault();
        const newText = value.slice(0, range.start) + value.slice(range.end);
        setInputText(newText);
        setMentionState(null);
        setTimeout(() => {
          textareaRef.current?.setSelectionRange(range.start, range.start);
          textareaRef.current?.focus();
        }, 0);
        return;
      }
    }

    const totalOptions = filteredPartners.length + 1;
    if (!mentionState || totalOptions === 0) return;
    if (e.key === "Escape") {
      setMentionState(null);
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedMentionIndex === 0) applyMentionAll();
      else applyMention(filteredPartners[selectedMentionIndex - 1]);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedMentionIndex((i) => (i + 1) % totalOptions);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedMentionIndex((i) => (totalOptions + i - 1) % totalOptions);
      return;
    }
  };

  /** textarea 자동 높이 조절 */
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";

    // endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [inputText]);

  /* ------------------------------
   * 댓글 추가 핸들러 (일반 댓글 / 대댓글)
   * ------------------------------ */
  const addComment = async () => {
    if (inputText.trim().length < 2) return;
    const upCmntAnsSn = replyingTo?.parentAsmtCmntSn ?? null;
    await createMutation.mutateAsync({
      asmtSn,
      data: { cmntDtlCn: inputText.trim(), upCmntAnsSn },
    });
    setInputText("");
    setReplyingTo(null);
  };

  /* ------------------------------
   * 댓글 수정 시작 핸들러
   * ------------------------------ */
  const startEdit = (asmtCmntSn: number, message: string) => {
    setEditing({ asmtCmntSn, text: message });
  };

  /* ------------------------------
   * 대댓글/답글 작성 시작 (하단 입력창으로 포커스)
   * rootAsmtCmntSn: 입력창을 둘 스레드 루트 (미입력 시 parentAsmtCmntSn 사용)
   * ------------------------------ */
  const startReply = (parentAsmtCmntSn: number, parentName: string, rootAsmtCmntSn?: number) => {
    setReplyingTo({
      parentAsmtCmntSn,
      parentName,
      rootAsmtCmntSn: rootAsmtCmntSn ?? parentAsmtCmntSn,
    });
    setEditing(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  /* ------------------------------
   * 댓글 수정 저장 핸들러
   * ------------------------------ */
  const saveEdit = () => {
    if (!editing) return;
    updateMutation.mutate(
      { asmtSn, asmtCmntSn: editing.asmtCmntSn, data: { cmntDtlCn: editing.text } },
      { onSuccess: () => setEditing(null) }
    );
  };

  /* ------------------------------
   * 댓글 삭제 핸들러 (ConfirmModal 확인 후 삭제)
   * ------------------------------ */
  const deleteItem = async (asmtCmntSn: number) => {
    const result = await confirmModal.open({
      title: "댓글 삭제",
      message: MSG.CONFIRM_DELETE,
    });
    if (result) {
      deleteMutation.mutate({ asmtSn, asmtCmntSn });
    }
  };

  return (
    <Box>
      {/* 댓글 헤더 + 새로고침 */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            댓글
            <Typography variant="body2">({comments.length})</Typography>
          </Typography>
        </Box>
        <Box className="">
          <AppButton variant="containedLight" size="small" onClick={() => refetch()}>
            <i className="fa-solid fa-arrows-rotate mr-2"></i> 새로고침
          </AppButton>
        </Box>
      </Box>

      {/* 댓글 리스트 */}
      <List component="ul" disablePadding>
        {comments.length === 0 ? (
          <Box sx={{ py: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
              <Typography variant="body2">등록된 댓글이 없습니다.</Typography>
            </Box>
          </Box>
        ) : (
          comments.map((comment) => (
            <Box
              key={comment.asmtCmntSn}
              component="div"
              sx={{
                py: 2,
                bgcolor: "background.paper",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              {/* 댓글 (depth 0) */}
              <CommentItem
                data={comment}
                depth={0}
                partners={mentionTargetsList}
                isEditing={editing?.asmtCmntSn === comment.asmtCmntSn}
                editText={editing?.text ?? ""}
                onChangeEdit={(t) => setEditing((prev) => prev && { ...prev, text: t })}
                onEdit={() => startEdit(comment.asmtCmntSn, comment.message)}
                onReply={() => startReply(comment.asmtCmntSn, comment.rgtrName)}
                onDelete={() => deleteItem(comment.asmtCmntSn)}
                onSave={saveEdit}
                onCancel={() => setEditing(null)}
              />

              {/* 대댓글·답글 같은 깊이로 시간순 표시 */}
              {comment.children && comment.children.length > 0 && (
                <Box sx={{ bgcolor: "grey.100", borderRadius: 0.5 }}>
                  {comment.children.map((reply) => (
                    <CommentItem
                      key={reply.asmtCmntSn}
                      data={reply}
                      depth={1}
                      partners={mentionTargetsList}
                      isEditing={editing?.asmtCmntSn === reply.asmtCmntSn}
                      editText={editing?.text ?? ""}
                      onChangeEdit={(t) => setEditing((prev) => prev && { ...prev, text: t })}
                      onEdit={() => startEdit(reply.asmtCmntSn, reply.message)}
                      onReply={() => startReply(reply.asmtCmntSn, reply.rgtrName, comment.asmtCmntSn)}
                      onDelete={() => deleteItem(reply.asmtCmntSn)}
                      onSave={saveEdit}
                      onCancel={() => setEditing(null)}
                    />
                  ))}
                </Box>
              )}

              {/* 답글 작성 영역: 이 스레드 루트일 때만 표시 */}
              {replyingTo?.rootAsmtCmntSn === comment.asmtCmntSn && (
                <Box sx={{ mt: 1, pl: 5, pr: 2, pb: 2, position: "relative" }}>
                  <Box sx={{ width: "100%" }}>
                    <AppTextField
                      multiline
                      rows={3}
                      fullWidth
                      inputRef={textareaRef}
                      label={replyingTo.parentName + " 님에게 답글 작성"}
                      placeholder={MSG.COMMENT_CONTENT_REQUIRED}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleInputKeyDown}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <Stack direction="row" spacing={CONTENT_GAP.XSMALL}>
                                <AppButton
                                  variant="containedLight"
                                  size="xsmall"
                                  disabled={inputText.trim().length < 2}
                                  onClick={addComment}
                                >
                                  <i className="fa-solid fa-paper-plane mr-2"></i> 등록
                                </AppButton>
                                <AppButton variant="text" size="xsmall" onClick={() => setReplyingTo(null)}>
                                  취소
                                </AppButton>
                              </Stack>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {mentionState && (
                      <MentionPopup
                        cursorPixel={mentionState.cursorPixel}
                        partners={filteredPartners}
                        selectedIndex={selectedMentionIndex}
                        onSelect={applyMention}
                        onSelectAll={applyMentionAll}
                        onClose={() => setMentionState(null)}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          ))
        )}
      </List>

      {/* 댓글 작성 영역 (일반 댓글만, 대댓글 중일 때는 숨김) */}
      {!isResearchCrudDisabled(research?.asmtPrgrsSttsCd) && (
        <>
          {replyingTo === null && (
            <Box
              ref={endRef}
              sx={{
                width: "100%",
                mt: 2,
                borderRadius: 1,
                bgcolor: "background.paper",
              }}
            >
              <Box sx={{ position: "relative", width: "100%" }}>
                <AppTextField
                  multiline
                  rows={3}
                  fullWidth
                  inputRef={textareaRef}
                  label={"댓글 등록"}
                  placeholder={MSG.COMMENT_CONTENT_REQUIRED}
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleInputKeyDown}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <AppButton
                            variant="containedLight"
                            size="small"
                            disabled={inputText.trim().length < 2}
                            onClick={addComment}
                          >
                            <i className="fa-solid fa-paper-plane mr-2"></i> 등록
                          </AppButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                {mentionState && (
                  <MentionPopup
                    cursorPixel={mentionState.cursorPixel}
                    partners={filteredPartners}
                    selectedIndex={selectedMentionIndex}
                    onSelect={applyMention}
                    onSelectAll={applyMentionAll}
                    onClose={() => setMentionState(null)}
                  />
                )}
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

/** 수정 시 멘션 팝업 상태 (CommentItem 내부용) */
type EditMentionState = {
  start: number;
  search: string;
  cursorPosition: number;
  cursorPixel: { left: number; top: number };
};

/**
 * 단일 댓글 컴포넌트
 */
function CommentItem({
  data,
  depth,
  partners = [],
  isEditing,
  editText,
  onChangeEdit,
  onEdit,
  onReply,
  onDelete,
  onSave,
  onCancel,
}: {
  data: UiComment;
  depth: number;
  partners?: MentionTarget[];
  isEditing: boolean;
  editText: string;
  onChangeEdit: (t: string) => void;
  onEdit: () => void;
  onReply?: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [editMentionState, setEditMentionState] = useState<EditMentionState | null>(null);
  const [editSelectedMentionIndex, setEditSelectedMentionIndex] = useState(0);

  const editFilteredPartners = (() => {
    if (!editMentionState) return [];
    const q = editMentionState.search.trim().toLowerCase();
    if (!q) return partners.slice(0, 10);
    return partners.filter((p) => (p.instNm ?? p.instId).toLowerCase().includes(q)).slice(0, 10);
  })();

  const handleEditInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart ?? value.length;
    onChangeEdit(value);

    const textBeforeCursor = value.slice(0, cursor);
    const lastAt = textBeforeCursor.lastIndexOf("@");
    if (lastAt !== -1) {
      const afterAt = textBeforeCursor.slice(lastAt + 1);
      if (!/\s/.test(afterAt)) {
        let cursorPixel = { left: 0, top: 0 };
        try {
          cursorPixel = getCaretPixelPosition(e.target, cursor, value);
        } catch {
          const rect = e.target.getBoundingClientRect();
          cursorPixel = { left: rect.left, top: rect.bottom };
        }
        setEditMentionState({ start: lastAt, search: afterAt, cursorPosition: cursor, cursorPixel });
        setEditSelectedMentionIndex(0);
        return;
      }
    }
    setEditMentionState(null);
  };

  const applyEditMention = (target: MentionTarget) => {
    if (!editMentionState) return;
    const name = target.instNm ?? target.instId;
    const before = editText.slice(0, editMentionState.start);
    const after = editText.slice(editMentionState.cursorPosition);
    onChangeEdit(`${before}@${name} ${after}`);
    setEditMentionState(null);
    const newCursor = editMentionState.start + `@${name} `.length;
    setTimeout(() => {
      editTextareaRef.current?.setSelectionRange(newCursor, newCursor);
      editTextareaRef.current?.focus();
    }, 0);
  };

  const applyEditMentionAll = () => {
    if (!editMentionState) return;
    const name = "전체";
    const before = editText.slice(0, editMentionState.start);
    const after = editText.slice(editMentionState.cursorPosition);
    onChangeEdit(`${before}@${name} ${after}`);
    setEditMentionState(null);
    const newCursor = editMentionState.start + `@${name} `.length;
    setTimeout(() => {
      editTextareaRef.current?.setSelectionRange(newCursor, newCursor);
      editTextareaRef.current?.focus();
    }, 0);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const cursor = e.currentTarget.selectionStart ?? editText.length;

    if (e.key === "Backspace" || e.key === "Delete") {
      const range = getMentionRemovalRange(editText, cursor, e.key);
      if (range) {
        e.preventDefault();
        const newText = editText.slice(0, range.start) + editText.slice(range.end);
        onChangeEdit(newText);
        setEditMentionState(null);
        setTimeout(() => {
          editTextareaRef.current?.setSelectionRange(range.start, range.start);
          editTextareaRef.current?.focus();
        }, 0);
        return;
      }
    }

    const editTotalOptions = editFilteredPartners.length + 1;
    if (editMentionState && editTotalOptions > 0) {
      if (e.key === "Escape") {
        setEditMentionState(null);
        e.preventDefault();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (editSelectedMentionIndex === 0) applyEditMentionAll();
        else applyEditMention(editFilteredPartners[editSelectedMentionIndex - 1]);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setEditSelectedMentionIndex((i) => (i + 1) % editTotalOptions);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setEditSelectedMentionIndex((i) => (editTotalOptions + i - 1) % editTotalOptions);
        return;
      }
    }
  };

  return (
    <Box
      component="li"
      sx={{
        display: "flex",
        width: "100%",
        pr: 2,
        ...(depth > 0
          ? {
              mt: 2,
              pl: 5,
              py: 2,
              borderTop: 1,
              borderColor: "divider",
            }
          : {}),
      }}
    >
      <Box sx={{ width: "10rem", minWidth: "10rem", fontWeight: 600, lineHeight: 1.25 }}>
        <Typography component="p" variant="body2" sx={{ m: 0 }}>
          {data.instName}
        </Typography>
        <Typography component="p" variant="body2" color="text.secondary" sx={{ m: 0, fontSize: "0.9rem" }}>
          ({data.rgtrName})
        </Typography>
      </Box>

      <Box sx={{ px: 2, whiteSpace: "pre-line", flex: 1, position: "relative" }}>
        {isEditing ? (
          <>
            <AppTextField
              inputRef={editTextareaRef}
              placeholder={MSG.COMMENT_CONTENT_REQUIRED}
              label={"댓글 수정"}
              multiline
              rows={3}
              value={editText}
              onChange={handleEditInputChange}
              onKeyDown={(e) => handleEditKeyDown(e as React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>)}
              fullWidth
              variant="outlined"
              size="small"
              // sx={{
              //   "& .MuiOutlinedInput-root": {
              //     backgroundColor: "white",
              //     "& fieldset": { borderRadius: 1 },
              //   },
              // }}
            />
            {editMentionState && (
              <MentionPopup
                cursorPixel={editMentionState.cursorPixel}
                partners={editFilteredPartners}
                selectedIndex={editSelectedMentionIndex}
                onSelect={applyEditMention}
                onSelectAll={applyEditMentionAll}
                onClose={() => setEditMentionState(null)}
              />
            )}
          </>
        ) : (
          renderMessageWithMentions(data.message, partners)
        )}
      </Box>

      <Typography
        component="div"
        variant="body2"
        color="text.secondary"
        sx={{ width: "12rem", minWidth: "12rem", px: 2, fontSize: "0.9rem" }}
      >
        {data.createdAt}
      </Typography>

      <Box sx={{ width: "9rem", minWidth: "9rem", textAlign: "right" }}>
        {isEditing ? (
          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
            <AppButton variant="outlined" size="xsmall" onClick={onSave}>
              저장
            </AppButton>
            <AppButton variant="outlined" size="xsmall" onClick={onCancel}>
              취소
            </AppButton>
          </Stack>
        ) : (
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
            {data.isMy && (
              <>
                <AppButton variant="text" size="xsmall" onClick={onEdit}>
                  수정
                </AppButton>
                <AppButton variant="text" size="xsmall" onClick={onDelete}>
                  삭제
                </AppButton>
              </>
            )}
            {!data.isMy && onReply && (
              <AppButton variant="text" size="xsmall" onClick={onReply}>
                {depth === 0 ? "답글" : "답글"}
              </AppButton>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
