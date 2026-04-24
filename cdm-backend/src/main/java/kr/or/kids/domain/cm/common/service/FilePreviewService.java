package kr.or.kids.domain.cm.common.service;

import java.io.IOException;

import org.springframework.http.HttpHeaders;

/**
 * 저장된 파일(atchFileId) 미리보기 시 워터마크 적용 PNG 제공.
 * - PDF: 페이지별 PNG (워터마크 적용)
 * - 이미지: 단일 PNG (워터마크 적용)
 *
 * 프로파일별 구현:
 * - local: {@link kr.or.kids.domain.cm.common.service.impl.FilePreviewServiceLocalImpl} (로컬 디스크)
 * - !local: {@link kr.or.kids.domain.cm.common.service.impl.FilePreviewServiceCaImpl} (ca-api)
 */
public interface FilePreviewService {

    int getPreviewTotalPages( String atchFileId ) throws IOException;

    byte[] getPreviewPagePng( String atchFileId, int page, int dpi ) throws IOException;

    byte[] getPreviewImagePng( String atchFileId ) throws IOException;

    boolean isPdf( String atchFileId );

    boolean isImage( String atchFileId );

    HttpHeaders pngResponseHeaders();
}
