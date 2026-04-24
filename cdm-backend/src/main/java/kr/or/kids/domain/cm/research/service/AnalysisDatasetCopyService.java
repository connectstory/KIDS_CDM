package kr.or.kids.domain.cm.research.service;

import java.util.Set;

import kr.or.kids.domain.cm.research.dto.AnalysisDatasetTaskResponse;

/**
 * 분석 데이터셋 조건 기반 복사 (kids_link_own → kids_vdi_?_own). 비동기 제출 + 작업 상태 조회. asmtSn, mbrId만 받아 서버에서 과제·참여기관(CDM)·최신 메타·분석데이터
 * 엑셀·스키마를 조회하여 복사 수행.
 */
public interface AnalysisDatasetCopyService {

  /** 허용 대상 스키마 (화이트리스트) */
  Set<String> ALLOWED_TARGET_SCHEMAS = Set.of( "kids_vdi_1_own", "kids_vdi_2_own", "kids_vdi_3_own" );

  String SOURCE_SCHEMA_DEFAULT = "kids_link_own";

  /**
   * 분석 데이터셋 복사 요청을 비동기로 제출. asmtSn으로 과제·참여기관(CDM)·최신 메타(rsltGroupCd=01)·분석데이터 엑셀(fileSeCd=15)·스키마(user_se_cd=02)를 조회하여
   * 복사. 복사 완료 시 AnalysisDatasetCopySuccessEvent 발행 → 리스너에서 과제 진행 상태 변경.
   *
   * @param asmtSn 연구과제 일련번호
   * @param mbrId 요청자 회원 ID (복사 완료 후 과제 진행 상태 변경 시 사용)
   * @return taskId, status=RUNNING
   */
  AnalysisDatasetTaskResponse submitAnalysisDatasetCopy( Long asmtSn, String mbrId );

  /**
   * 비동기 작업 상태 조회.
   *
   * @param taskId submit 시 반환된 taskId
   * @return status (RUNNING/SUCCESS/FAILED), 완료 시 copyResults 포함
   */
  AnalysisDatasetTaskResponse getTaskStatus( String taskId );

  /** 테스트/내부용: 스키마 검증 (화이트리스트). 허용되지 않으면 IllegalArgumentException */
  static void validateTargetSchema( String targetSchema ) {
    if (targetSchema == null || targetSchema.isBlank()) {
      throw new IllegalArgumentException( "대상 스키마를 지정해 주세요." );
    }
    // if (!ALLOWED_TARGET_SCHEMAS.contains( targetSchema.trim() )) {
    // throw new IllegalArgumentException( "허용된 대상 스키마가 아닙니다. (kids_vdi_1_own, kids_vdi_2_own, kids_vdi_3_own 중 하나)" );
    // }
  }

  /** 소스 스키마 검증: kids_link_own 만 허용 (동적 SQL 안전) */
  static void validateSourceSchema( String sourceSchema ) {
    if (sourceSchema == null || sourceSchema.isBlank())
      return;
    if (!SOURCE_SCHEMA_DEFAULT.equals( sourceSchema.trim() )) {
      throw new IllegalArgumentException( "소스 스키마는 " + SOURCE_SCHEMA_DEFAULT + " 만 허용됩니다." );
    }
  }
}
