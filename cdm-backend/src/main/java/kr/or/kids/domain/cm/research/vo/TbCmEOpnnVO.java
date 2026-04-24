package kr.or.kids.domain.cm.research.vo;

import java.time.LocalDateTime;

import kr.or.kids.global.type.YnFlagType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

/* 의견통합 */
public class TbCmEOpnnVO {

    private Long opnnIntgRsltSn; // 의견통합결과일련번호
    private Long asmtMetaRsltSn; // 과제메타결과일련번호
    private Long asmtSn; // 과제일련번호
    private String instId; // 기관아이디
    private String opnnIntgDmndCn; // 의견통합요청내용
    private String utlzAgreSeCd; // 활용동의구분코드
    /** 연구결과 활용동의 상태코드 (tb_cm_e_opnn.asmt_opnn_stts_cd; 01=동의, 02=미동의) */
    private String asmtOpnnSttsCd;
    private String delYn; // 삭제여부
    private String rgtrId; // 등록자아이디
    private LocalDateTime regDt; // 등록일자
    private String mdfrId; // 수정자아이디
    private LocalDateTime mdfcnDt; // 수정일자

    // 조인된 회원/전문가/기관 정보
    private String mbrId; // 회원아이디
    private String mbrEncptFlnm; // 회원암호화성명
    /** 조인: TB_PP_M_EMP_INFO.emp_nm */
    private String empNm;
    private String brno; // 사업자등록번호
    private String exprtHdofYn; // 전문가대표여부
    private String instNm; // 기관명

    /**
     * 의견을 생성한다.
     *
     * @param asmtSn 과제일련번호
     * @param asmtMetaRsltSn 과제메타결과일련번호
     * @param opnnIntgDmndCn 의견통합요청내용
     * @param utlzAgreSeCd 활용동의구분코드
     * @param instId 기관아이디
     * @param createBy 등록자아이디
     * @return 생성된 의견 객체
     */
    public static TbCmEOpnnVO create( Long asmtSn, Long asmtMetaRsltSn, String opnnIntgDmndCn, String utlzAgreSeCd, String instId, String createBy ) {
        LocalDateTime now = LocalDateTime.now();
        TbCmEOpnnVO vo = new TbCmEOpnnVO();
        vo.setAsmtSn( asmtSn );
        vo.setAsmtMetaRsltSn( asmtMetaRsltSn );
        vo.setOpnnIntgDmndCn( opnnIntgDmndCn );
        vo.setUtlzAgreSeCd( utlzAgreSeCd );
        vo.setInstId( instId );
        vo.setDelYn( YnFlagType.N.code() );
        vo.setRgtrId( createBy );
        vo.setRegDt( now );
        vo.setMdfrId( createBy );
        vo.setMdfcnDt( now );
        return vo;
    }
}
