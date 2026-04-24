package kr.or.kids.domain.cm.research.type;

import java.util.Arrays;

public enum ParticipationStatus {
  REQUEST("01", "참여요청"), NOT_PARTICIPATING("02", "미참여"), APPROVED("03", "참여승인");

  private final String code;
  private final String label;

  ParticipationStatus(String code, String label) {
    this.code = code;
    this.label = label;
  }

  public String code() {
    return code;
  }

  public String label() {
    return label;
  }

  public static ParticipationStatus fromCode( String code ) {
    if (code == null)
      return null;
    return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown ParticipationStatus code: " + code ) );
  }
}
