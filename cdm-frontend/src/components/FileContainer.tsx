import { IconButton, Typography } from "@mui/material";
import styles from "./FileContainer.module.css";

export interface FileData {
  /** 로컬에서만 쓰는 임시 식별자(다건 업로드 시 개별 삭제용) */
  clientKey?: string;
  atchFileId?: string;
  atchFileGroupId?: string;
  name: string;
  ext: string;
  size: string;
  showDeleteButton?: boolean;
  /** 다운로드 링크가 있으면 클릭 시 해당 URL로 다운로드 */
  downloadUrl?: string;
  /** axios blob 등으로 받을 때(권장: 양식 파일) */
  downloadAction?: () => void | Promise<void>;
  /** 다운로드 시 저장될 파일명(표시명과 분리용) */
  downloadAs?: string;
}

export default function FileContainer({
  files,
  showDeleteButton,
  uploaded,
  onClick,
  onDelete,
}: {
  files: FileData[]; // 이미 업로드된 파일(있으면 교체 UX)
  showDeleteButton?: boolean | undefined;
  uploaded?: boolean | undefined;
  onClick?: (file: FileData) => void;
  onDelete?: (file: FileData) => void;
}) {
  return (
    <ul className={styles.file_container}>
      {files.map((file, _index) => (
        <FileItem
          key={
            file.clientKey ??
            `${file.atchFileId ?? file.atchFileGroupId ?? "file"}-${file.name}-${_index}`
          }
          file={{
            ...file,
            showDeleteButton: showDeleteButton !== undefined ? showDeleteButton : file.showDeleteButton,
          }}
          onClick={onClick}
          onDelete={onDelete}
          uploaded={uploaded}
        ></FileItem>
      ))}
    </ul>
  );
}

function FileItem({
  file,
  onClick,
  onDelete,
  uploaded,
}: {
  file: FileData;
  onClick?: (file: FileData) => void;
  onDelete?: (file: FileData) => void;
  uploaded?: boolean | undefined;
}) {
  const isDownloadLink = !!(file.downloadUrl || file.downloadAction);
  const linkContent = (
    <a
      className={`cs-ellipsis1 ${styles.file_item_name}`}
      href={file.downloadAction ? "#" : isDownloadLink ? file.downloadUrl : undefined}
      download={file.downloadUrl && !file.downloadAction ? true : undefined}
      target={file.downloadUrl && !file.downloadAction ? "_blank" : undefined}
      rel={file.downloadUrl && !file.downloadAction ? "noopener noreferrer" : undefined}
      onClick={
        file.downloadAction
          ? (e) => {
              e.preventDefault();
              void file.downloadAction!();
            }
          : !isDownloadLink && onClick
            ? () => onClick(file)
            : undefined
      }
    >
      <Typography variant="default">{file.name}</Typography>
    </a>
  );
  return (
    <li className={`${styles.file_item} ${uploaded ? styles.uploaded : ""}`}>
      <div className={styles.file_item_content}>
        <i className="fa-solid fa-paperclip "></i>
        <div className="w-full">
          {linkContent}
          <span className={styles.file_item_info}>({file.size})</span>
        </div>

        {file.showDeleteButton && (
          <IconButton
            className={styles.file_item_delete_button}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(file);
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </IconButton>
        )}
      </div>
    </li>
  );
}
