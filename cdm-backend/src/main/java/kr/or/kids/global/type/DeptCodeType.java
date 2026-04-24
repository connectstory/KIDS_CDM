package kr.or.kids.global.type;

import java.util.Arrays;

public enum DeptCodeType {
    DRUG_ANALYSIS("0000080", "약물역학"), INFORMATION("0000004", "정보화");

    private final String code;
    private final String label;

    DeptCodeType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }

    public static DeptCodeType fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown TaskTypeCode: " + code ) );
    }
}
