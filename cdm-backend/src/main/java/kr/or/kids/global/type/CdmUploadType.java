package kr.or.kids.global.type;

import java.util.Arrays;

public enum CdmUploadType {
    CDM("01", "CDM"), NOT_CDM("02", "현황");

    private final String code;
    private final String label;

    CdmUploadType(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }

    public static CdmUploadType fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown CdmUploadType: " + code ) );
    }
}
