package kr.or.kids.domain.cm.common.dto;

/**
 * 연구과제 상세 응답용 첨부파일 항목
 */
public record CaFileItem(String atchFileId, String atchFileGroupId, String fileNm, String fileExtNm, Long fileSz ) {
}
