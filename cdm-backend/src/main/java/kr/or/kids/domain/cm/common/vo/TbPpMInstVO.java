package kr.or.kids.domain.cm.common.vo;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 기관기본 */
public class TbPpMInstVO {
    private String brno; // 사업자등록번호
    private String instNm; // 기관명
    private String delYn; // 삭제여부
    private String rgtrId; // 등록자아이디
    private LocalDateTime regDt; // 등록일자
    private String regPrgmId; // 등록프로그램아이디
    private String mdfrId; // 수정자아이디
    private LocalDateTime mdfcnDt; // 수정일자
    private String mdfcnPrgmId; // 수정프로그램아이디
}
