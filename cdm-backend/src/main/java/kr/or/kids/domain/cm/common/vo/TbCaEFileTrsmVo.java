package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class TbCaEFileTrsmVo {

    private String atchFileId; // 첨부파일ID (PK)
    private String atchFileGroupId; // 첨부파일 그룹ID (FK)
    private Long fileSeq; // 파일순번
    private String fileStrgPathDsctn; // 파일저장경로
    private String prvcInclYn; // 개인정보포함여부 (0/1)
    private String fileNm; // 파일명
    private String fileExtnNm; // 확장자
    private String fileCn; // 파일설명
    private Long fileSz; // 파일크기
    private String crtDt; // 생성일
    private String useYn; // 사용여부
    private LocalDateTime regDt; // 등록일
    private String rgtrId; // 등록자
    private LocalDateTime mdfcnDt; // 수정일
    private String mdfrId; // 수정자
    private String srvrFileNm; // 서버 저장 파일명(UUID)
}
