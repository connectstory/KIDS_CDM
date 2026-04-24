import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Box, Button, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { ModalNames } from "@/interfaces/modalInterface";
import { useModal } from "@/hooks/useModal";
import { useBoardComments, useCreateBoardComment, useDeleteBoardComment, useUpdateBoardComment } from "@/hooks/community/useBoardComments";
import type { BoardCommentDto } from "@/api/communityApi";
import type { RootState } from "@/store";

/* ─────────────────────────────────────────────
 * 내부 UI 타입
 * ───────────────────────────────────────────── */
interface UiBoardComment {
  asmtCmntSn: number;
  upCmntAnsSn: number | null;
  orgnlUpCmntAnsSn: number | null;
  rgtrName: string;
  message: string;
  createdAt: string;
  isMy: boolean;
  children: UiBoardComment[];
}

/* 작성자 표시명 결정: empNm > mbrNm > rgtrId */
function resolveRgtrName(dto: BoardCommentDto): string {
  if (dto.empNm && dto.empNm.trim()) return dto.empNm.trim();
  if (dto.mbrNm && dto.mbrNm.trim()) return dto.mbrNm.trim();
  return dto.rgtrId ?? "-";
}

/* 날짜 포맷 (YYYY-MM-DDTHH:mm:ss → YYYY-MM-DD HH:mm) */
function formatDt(dt: string | null): string {
  if (!dt) return "";
  return dt.replace("T", " ").substring(0, 16);
}

/* 평탄 목록 → 2단계 트리 (root + children) */
function buildTree(rows: BoardCommentDto[], mbrId: string | null | undefined): UiBoardComment[] {
  const rootMap = new Map<number, UiBoardComment>();
  const roots: UiBoardComment[] = [];

  for (const r of rows) {
    const node: UiBoardComment = {
      asmtCmntSn: r.asmtCmntSn,
      upCmntAnsSn: r.upCmntAnsSn ?? null,
      orgnlUpCmntAnsSn: r.orgnlUpCmntAnsSn ?? null,
      rgtrName: resolveRgtrName(r),
      message: r.cmntDtlCn ?? "",
      createdAt: formatDt(r.regDt),
      isMy: !!mbrId && r.rgtrId === mbrId,
      children: [],
    };

    if (r.orgnlUpCmntAnsSn == null) {
      rootMap.set(r.asmtCmntSn, node);
      roots.push(node);
    } else {
      const parent = rootMap.get(r.orgnlUpCmntAnsSn);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}

/* ─────────────────────────────────────────────
 * 단일 댓글 아이템
 * ───────────────────────────────────────────── */
function CommentItem({
  data,
  depth,
  isEditing,
  editText,
  onChangeEdit,
  onEdit,
  onReply,
  onDelete,
  onSave,
  onCancel,
}: {
  data: UiBoardComment;
  depth: number;
  isEditing: boolean;
  editText: string;
  onChangeEdit: (t: string) => void;
  onEdit: () => void;
  onReply?: () => void;
  onDelete: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <li className={`flex w-full pr-3 ${depth > 0 ? "mt-3 pl-5 py-3 border-t border-gray-200" : ""}`}>
      <div className="w-[12rem] min-w-[12rem] font-semibold leading-tight">
        <p>{data.rgtrName}</p>
      </div>

      <div className="px-3 whitespace-pre-line flex-1">
        {isEditing ? (
          <TextField
            multiline
            rows={3}
            fullWidth
            size="small"
            label="댓글 수정"
            placeholder="댓글 내용을 입력해 주세요."
            value={editText}
            onChange={(e) => onChangeEdit(e.target.value)}
          />
        ) : (
          <Typography variant="body2">{data.message}</Typography>
        )}
      </div>

      <div className="w-[12rem] min-w-[12rem] px-3 text-gray-600 text-[0.9rem]">{data.createdAt}</div>

      <div className="w-[9rem] min-w-[9rem] text-right">
        {isEditing ? (
          <div className="flex gap-2 justify-end">
            <Button variant="outlined" size="xsmall" onClick={onSave} sx={{ bgcolor: "white" }}>저장</Button>
            <Button variant="outlined" size="xsmall" onClick={onCancel} sx={{ bgcolor: "white" }}>취소</Button>
          </div>
        ) : (
          <div className="flex gap-1 justify-end">
            {data.isMy && (
              <>
                <Button variant="text" size="xsmall" onClick={onEdit} sx={{ bgcolor: "white" }}>수정</Button>
                <Button variant="text" size="xsmall" onClick={onDelete} sx={{ bgcolor: "white" }}>삭제</Button>
              </>
            )}
            {onReply && (
              <Button variant="text" size="xsmall" onClick={onReply} sx={{ bgcolor: "white" }}>답글</Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/* ─────────────────────────────────────────────
 * 메인 컴포넌트
 * ───────────────────────────────────────────── */
export default function FreeboardComment({ pstSn, bbsId }: { pstSn: number; bbsId: string }) {
  const session = useSelector((state: RootState) => state.session);
  const confirmModal = useModal(ModalNames.CONFIRM);

  const { data: commentDtos = [], refetch } = useBoardComments(pstSn, bbsId);
  const createMutation = useCreateBoardComment(pstSn, bbsId);
  const updateMutation = useUpdateBoardComment(pstSn, bbsId);
  const deleteMutation = useDeleteBoardComment(pstSn, bbsId);

  const comments = buildTree(commentDtos, session?.userNo);

  const [inputText, setInputText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [editing, setEditing] = useState<{ asmtCmntSn: number; text: string } | null>(null);
  const [replyingTo, setReplyingTo] = useState<{
    parentAsmtCmntSn: number;
    parentName: string;
    rootAsmtCmntSn: number;
  } | null>(null);

  /* 댓글 등록 */
  const addComment = async () => {
    if (inputText.trim().length < 2) return;
    await createMutation.mutateAsync({
      cmntDtlCn: inputText.trim(),
      upCmntAnsSn: replyingTo?.parentAsmtCmntSn ?? null,
    });
    setInputText("");
    setReplyingTo(null);
  };

  /* 수정 시작 */
  const startEdit = (asmtCmntSn: number, message: string) => {
    setEditing({ asmtCmntSn, text: message });
  };

  /* 답글 시작 */
  const startReply = (parentAsmtCmntSn: number, parentName: string, rootAsmtCmntSn?: number) => {
    setReplyingTo({ parentAsmtCmntSn, parentName, rootAsmtCmntSn: rootAsmtCmntSn ?? parentAsmtCmntSn });
    setEditing(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  /* 수정 저장 */
  const saveEdit = () => {
    if (!editing) return;
    updateMutation.mutate(
      { asmtCmntSn: editing.asmtCmntSn, data: { cmntDtlCn: editing.text } },
      { onSuccess: () => setEditing(null) }
    );
  };

  /* 삭제 */
  const deleteItem = async (asmtCmntSn: number) => {
    const result = await confirmModal.open({ title: "댓글 삭제", message: "댓글을 삭제하시겠습니까?" });
    if (result) {
      deleteMutation.mutate(asmtCmntSn);
    }
  };

  return (
    <div>
      {/* 헤더 */}
      <Box className="flex items-center justify-between">
        <Box className="sub_path">
          <Typography className="tit" variant="h5">
            댓글
            <Typography component="span" variant="body2" className="ml-1">({comments.length})</Typography>
          </Typography>
        </Box>
        <Button variant="containedLight" size="small" onClick={() => refetch()}>
          <i className="fa-solid fa-arrows-rotate mr-2"></i> 새로고침
        </Button>
      </Box>

      {/* 댓글 목록 */}
      <ul>
        {comments.length === 0 ? (
          <Box className="flex items-center justify-center p-4">
            <Typography variant="body2">등록된 댓글이 없습니다.</Typography>
          </Box>
        ) : (
          comments.map((comment) => (
            <div key={comment.asmtCmntSn} className="py-3 bg-white border-b border-gray-200">
              {/* 루트 댓글 */}
              <CommentItem
                data={comment}
                depth={0}
                isEditing={editing?.asmtCmntSn === comment.asmtCmntSn}
                editText={editing?.text ?? ""}
                onChangeEdit={(t) => setEditing((prev) => prev && { ...prev, text: t })}
                onEdit={() => startEdit(comment.asmtCmntSn, comment.message)}
                onReply={() => startReply(comment.asmtCmntSn, comment.rgtrName)}
                onDelete={() => deleteItem(comment.asmtCmntSn)}
                onSave={saveEdit}
                onCancel={() => setEditing(null)}
              />

              {/* 대댓글 */}
              {comment.children.length > 0 && (
                <div className="bg-gray-100 rounded-sm">
                  {comment.children.map((reply) => (
                    <CommentItem
                      key={reply.asmtCmntSn}
                      data={reply}
                      depth={1}
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
                </div>
              )}

              {/* 답글 입력 영역 */}
              {replyingTo?.rootAsmtCmntSn === comment.asmtCmntSn && (
                <div className="mt-2 pl-5 pr-3 pb-3">
                  <TextField
                    multiline
                    rows={3}
                    fullWidth
                    inputRef={textareaRef}
                    label={`${replyingTo.parentName} 님에게 답글 작성`}
                    placeholder="댓글 내용을 입력해 주세요."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Stack direction="row" spacing={1}>
                              <Button variant="containedLight" size="xsmall" disabled={inputText.trim().length < 2} onClick={addComment}>
                                <i className="fa-solid fa-paper-plane mr-2"></i> 등록
                              </Button>
                              <Button variant="text" size="xsmall" onClick={() => setReplyingTo(null)}>취소</Button>
                            </Stack>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </ul>

      {/* 댓글 입력 영역 (대댓글 작성 중 아닐 때) */}
      {session?.userNo && replyingTo === null && (
        <div className="w-full mt-4 rounded-md bg-white">
          <TextField
            multiline
            rows={3}
            fullWidth
            inputRef={textareaRef}
            label="댓글 등록"
            placeholder="댓글 내용을 입력해 주세요."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button variant="containedLight" size="small" disabled={inputText.trim().length < 2} onClick={addComment}>
                      <i className="fa-solid fa-paper-plane mr-2"></i> 등록
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
        </div>
      )}
    </div>
  );
}
