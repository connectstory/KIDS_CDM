package kr.or.kids.global.type;

import java.util.Arrays;

public enum CmTaskCodeType {
    RESEARCH("01"), RESEARCH_META("02"), RESEARCH_ORG("03"), CDM_NOTI("04"), CDM_NOTI_ORG("05"), COMMUNITY("06");

    private final String code;

    CmTaskCodeType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static CmTaskCodeType fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown TaskTypeCode: " + code ) );
    }
}
