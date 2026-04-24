package kr.or.kids.domain.cm.common.vo;

import lombok.Data;

/**
 * 접속이력 등록 VO
 */
@Data
public class AccessHistoryVO {

    private String menuUtztnSn;  // 메뉴이용일련번호 [not null] - 자동체번
    private String sessLogSn;    // 세션로그일련번호
    private String taskSeCdNo;   // 업무구분코드 (tb_ca_c_group_code.com_group_cd = 'CA0003')
    private String menuSn;       // 메뉴일련번호 (컨트롤러에서 URL 기준으로 조회 후 세팅)
    private String urlAddr;      // 접속URL (set 시 자동감지 대신 사용)
    private String cntnAddr;     // 접속IP
    private String acsrNm;       // 접속자명
    private String rqstrId;      // 요청자아이디
    private String flfmtTaskCd;  // 수행업무코드
    private String etcMemoCn;    // 기타메모내용
    private String prvcInclYn;   // 개인정보포함여부
    // inptDt, cntnDt, regDt, mdfcnDt, rgtrId, mdfrId 는 서비스에서 자동 세팅

}
