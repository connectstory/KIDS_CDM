package kr.or.kids.domain.cm.research.type;

import java.util.Arrays;

public enum AccountTypeStatus {
    VDI("01", "VDI"), DB("02", "DB");

    private final String code;
    private final String label;

    AccountTypeStatus(String code, String label) {
        this.code = code;
        this.label = label;
    }

    public String code() {
        return code;
    }

    public String label() {
        return label;
    }

    public static AccountTypeStatus fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown AccountTypeStatus code: " + code ) );
    }
}
