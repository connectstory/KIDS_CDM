package kr.or.kids.domain.cm.research.type;

import java.util.Arrays;

public enum ResearchStatus {
  INVITATION_REQUEST("01", "참여요청"), IN_PROGRESS("02", "진행중(통합,기관분석)"), IN_PROGRESS_META("03", "진행중(메타분석)"), COMPLETED("04", "마감"), CANCELLED("05", "취소");

  private final String code;
  private final String label;

  ResearchStatus(String code, String label) {
    this.code = code;
    this.label = label;
  }

  public String code() {
    return code;
  }

  public String label() {
    return label;
  }

  public static ResearchStatus fromCode( String code ) {
    if (code == null)
      return null;
    return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown ResearchStatus code: " + code ) );
  }
}
