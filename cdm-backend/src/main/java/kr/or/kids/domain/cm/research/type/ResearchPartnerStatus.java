package kr.or.kids.domain.cm.research.type;

import java.util.Arrays;

public enum ResearchPartnerStatus {
    INVITATION_REQUEST("01", "참여요청"), NOT_PARTICIPATING("02", "미참여"), PARTICIPATING("03", "참여"), INSTITUTION_ANALYSIS_IN_PROGRESS("04", "기관분석진행중"), INSTITUTION_ANALYSIS_REVIEW_REQUEST("05", "기관분석검토요청"), INSTITUTION_ANALYSIS_REVIEW_COMPLETED("06", "기관분석검토완료"), INSTITUTION_ANALYSIS_MODIFY_REQUEST(
            "07",
            "기관분석보완요청"), INTEGRATED_ANALYSIS_RESULT_EXCLUDED("08", "통합분석결과제외"), RESEARCH_RESULT_REVIEW_REQUEST("09", "연구결과검토요청"), RESEARCH_RESULT_REVIEW_COMPLETED("10", "연구결과검토완료"), RESEARCH_COMPLETED("11", "연구과제마감"), RESEARCH_CANCEL("12", "연구과제취소"), RESEARCH_RESULT_MODIFY_REQUEST("13", "연구결과보완요청");

    private final String code;
    private final String label;

    ResearchPartnerStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }

    public static ResearchPartnerStatus fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown ResearchStatus code: " + code ) );
    }
}
