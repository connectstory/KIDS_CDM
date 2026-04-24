package kr.or.kids.domain.cm.research.type;

import java.util.Arrays;

public enum AnalysisResultStatus {
    SUBMITTED("01", "결과제출"), REQUEST_REVIEW("02", "검토요청"), INPROGRESS_REVIEW("03", "검토진행"), INPROGRESS_REVIEW_DEPT1("04", "검토진행(약물역학)"), INPROGRESS_REVIEW_DEPT2("05", "검토진행(정보화)"), COMPLETED("06", "검토완료"), REQUEST_MODIFY("07", "보완요청"), EXCLUDED("08", "결과제외"), NOT_REGISTERED("09",
            "미등록"), NOT_CONSENT("10", "활용미동의");

    private final String code;
    private final String label;

    AnalysisResultStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }

    public static AnalysisResultStatus fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown ParticipationStatus code: " + code ) );
    }
}
