package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 파일업로드기본 */
public class TbCmMFileUldVO {
    private Long pstSn; // 게시일련번호
    private String atchFileSn; // 첨부파일일련번호(원본파일명 등)
    private String atchFileId; // 첨부파일ID (tb_ca_e_file_trsm.atch_file_id 참조)
    private String uldTaskSeCd; // 업로드업무구분코드
    private String fileSeCd; // 파일구분코드
    private Long ptcpInstSn; // 참여기관일련번호
    private String delYn; // 삭제여부
    private String rgtrId; // 등록자아이디
    private LocalDateTime regDt; // 등록일자
    private String regPrgmId; // 등록프로그램아이디
    private String mdfrId; // 수정자아이디
    private LocalDateTime mdfcnDt; // 수정일자
    private String mdfcnPrgmId; // 수정프로그램아이디

    // 조인으로 조회되는 파일 정보(대표 1개)
    private String fileId; // tb_ca_e_file_trsm.atch_file_id
    private String fileNm; // tb_ca_e_file_trsm.file_nm
    private String fileExtnNm; // tb_ca_e_file_trsm.file_extn_nm
    private Long fileSz; // tb_ca_e_file_trsm.file_sz
}
