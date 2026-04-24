package kr.or.kids.global.type;

import java.util.Arrays;

public enum FileCodeType {
    RESEARCH_IRB("01"), RESEARCH_ANALYSIS_CDM("02"), RESEARCH_ANALYSIS_ORG("03"), RESEARCH_ANALYSIS_META("04"), RESEARCH_QUERIES("05"), CDM_BOARD("06"), CDM_DRB("07"), CDM_UPLOAD("08"), BOARD("09"), QNA("10"), QNA_REPLY("11"), RESEARCH_PROPOSAL("12"), RESEARCH_PROPOSAL_REPLY(
            "13"), RESEARCH_ATTACHED("14"), RESEARCH_ANALYSIS_DATASET("15"), RESEARCH_ANALYSIS_VDI("16"), RESEARCH_PARTNER("17"), RESEARCH_ATTACHED_DOWNLOAD("18"), RESEARCH_ADMIN_ATTACHED("19");

    private final String code;

    FileCodeType(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }

    public static FileCodeType fromCode( String code ) {
        if (code == null)
            return null;
        return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown FileTypeCode: " + code ) );
    }
}
