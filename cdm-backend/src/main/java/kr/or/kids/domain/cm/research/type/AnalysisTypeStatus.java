package kr.or.kids.domain.cm.research.type;

import java.util.Arrays;

public enum AnalysisTypeStatus {
    ANALYSIS_DATA("01", "데이터분석"), ANALYSIS_CDM("02", "통합분석"), ANALYSIS_ORG("03", "기관분석"), ANALYSIS_META("04", "메타분석");

    private final String code;
    private final String label;

    AnalysisTypeStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }

    public static AnalysisTypeStatus fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown ParticipationStatus code: " + code ) );
    }
}
