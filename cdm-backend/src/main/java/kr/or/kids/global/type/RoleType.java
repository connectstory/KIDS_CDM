package kr.or.kids.global.type;

import java.util.Arrays;

public enum RoleType {
    ADMIN("A"), PARTNER("P"), EMPLOYEE("E");

    private final String code;

    RoleType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static RoleType fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown RoleType: " + code ) );
    }
}
