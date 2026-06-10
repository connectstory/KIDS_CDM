package kr.or.kids.global.type;

import java.util.Arrays;
import java.util.Optional;

/**
 * 공시 참여기관(TB_CM_M_ULD_PRST) 업로드 진행 상태 코드.
 */
public enum DisclosurePartnerProgressStatus {

  INVITATION_REQUEST( "01", "참여요청" ),
  IN_PROGRESS( "02", "진행중" ),
  COMPLETED( "03", "완료" ),
  CANCELLED( "04", "참여취소" ),
  REGISTRATION_COMPLETED( "05", "등록" ),
  RE_INVITATION_REQUEST( "06", "참여재요청" ),
  RE_REGISTRATION_REQUEST( "07", "등록재요청" );

  private final String code;
  private final String label;

  DisclosurePartnerProgressStatus( String code, String label ) {
    this.code = code;
    this.label = label;
  }

  public String code() {
    return code;
  }

  public String label() {
    return label;
  }

  /**
   * 앞뒤 공백 제거 후 한 자리면 선행 0을 붙인 코드 문자열.
   */
  public static String normalizeCode( String code ) {
    if ( code == null ) {
      return "";
    }
    String s = code.trim();
    if ( s.isEmpty() ) {
      return "";
    }
    if ( s.length() == 1 ) {
      return "0" + s;
    }
    return s;
  }

  public static DisclosurePartnerProgressStatus fromCode( String code ) {
    if ( code == null || code.isBlank() ) {
      return null;
    }
    String normalized = normalizeCode( code );
    return Arrays.stream( values() ).filter( v -> v.code.equals( normalized ) ).findFirst().orElseThrow(
        () -> new IllegalArgumentException( "Unknown DisclosurePartnerProgressStatus: " + code ) );
  }

  public static Optional<DisclosurePartnerProgressStatus> tryParse( String code ) {
    if ( code == null || code.isBlank() ) {
      return Optional.empty();
    }
    String normalized = normalizeCode( code );
    return Arrays.stream( values() ).filter( v -> v.code.equals( normalized ) ).findFirst();
  }

  public boolean equalsNormalized( String rawCode ) {
    if ( rawCode == null ) {
      return false;
    }
    return this.code.equals( normalizeCode( rawCode ) );
  }

  /**
   * 공시 마감 가능 여부 판단 시, 참여기관이 정리된 상태인지(완료·취소·등록).
   */
  public static boolean isSettledForClose( String rawCode ) {
    String n = normalizeCode( rawCode );
    return COMPLETED.code.equals( n ) || CANCELLED.code.equals( n ) || REGISTRATION_COMPLETED.code.equals( n );
  }
}
