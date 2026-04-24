package kr.or.kids.global.type;

import java.util.Arrays;

public enum KidsTaskCodeType {
    CDM("cm");

    private final String code;

    KidsTaskCodeType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static KidsTaskCodeType fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown TaskCodeType: " + code ) );
    }
}
