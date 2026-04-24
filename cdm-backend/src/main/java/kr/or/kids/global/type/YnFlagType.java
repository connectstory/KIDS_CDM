package kr.or.kids.global.type;

import java.util.Arrays;

public enum YnFlagType {
  Y("Y"), N("N");

  private final String code;

  YnFlagType(String code) {
    this.code = code;
  }

  public String code() {
    return code;
  }

  public static YnFlagType fromCode( String code ) {
    if (code == null)
      return null;
    return Arrays.stream( values() ).filter( v -> v.code.equals( code ) ).findFirst().orElseThrow( () -> new IllegalArgumentException( "Unknown YnFlag: " + code ) );
  }
}
