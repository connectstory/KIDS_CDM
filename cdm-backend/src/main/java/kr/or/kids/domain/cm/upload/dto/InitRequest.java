package kr.or.kids.domain.cm.upload.dto;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record InitRequest(String tableName, String fileName, long fileSize, String contentType) {}
