package kr.or.kids.domain.cm.upload.service;

import java.util.List;
import java.util.Map;

import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse;
import kr.or.kids.domain.cm.upload.dto.PartnerStatusInfoHistoryRow;
import kr.or.kids.domain.cm.upload.vo.DisclosureMemberVO;
import kr.or.kids.global.common.CustomUserDetails;

/**
 * 업로드 도메인 서비스 계약을 정의한다.
 */
public interface DisclosurePartnerService {

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  List<DisclosurePartnerResponse> findByPblntSn( Long pblntSn );

  /**
   * 공시 참여기관 목록을 요청자 권한에 맞게 조회한다.
   * 관리자(플랫폼 관리자·공시 등록자)는 전체, 참여기관은 본인 행만 반환한다.
   *
   * @param pblntSn 공시 일련번호
   * @param memberAndInst 공시·요청자 컨텍스트 ({@code DisclosureMemberResolver#resolve} 결과)
   * @return 접근 가능한 참여기관 목록
   */
  List<DisclosurePartnerResponse> findByPblntSnForDisclosureMember( Long pblntSn, DisclosureMemberVO memberAndInst );

  
  /**
   * addPartners 처리를 수행한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param request request
   */
  void addPartners( CustomUserDetails user, Long pblntSn, DisclosurePartnerRequest request );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  List<String> findInstKeysBusyOnOtherInProgressDisclosures( Long pblntSn );

  
  /**
   * 데이터를 삭제한다.
   *
   * @param ptcpInstSn ptcpInstSn
   * @param pblntSn pblntSn
   */
  void deletePartner( Long ptcpInstSn, Long pblntSn );

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  String getStatus( Long pblntSn, Long ptcpInstSn );

  
  /**
   * 참여기관 업로드 진행상태(참여 진행코드)를 변경한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param uldInstPrgrsSttsStcd uldInstPrgrsSttsStcd
   * @param cancelReason cancelReason
   */
  void updateParticipationProgress( CustomUserDetails user, Long pblntSn, Long ptcpInstSn, String uldInstPrgrsSttsStcd, String cancelReason );

  
  /**
   * savePartnerInformation 처리를 수행한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param request request
   */
  void savePartnerInformation( CustomUserDetails user, Long pblntSn, Long ptcpInstSn, Map<String, Object> request );

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  Map<String, Object> getPartnerInformation( Long pblntSn, Long ptcpInstSn );

  
  /**
   * 참여취소 사유 조회(문자열). 내부·호환용.
   */
  String getCancelReason( Long pblntSn, Long ptcpInstSn );

  
  /**
   * 참여취소 사유 조회: 사유문자, 등록자, 현재 사용자 기준 수정 가능 여부.
   *
   * @param editorUserType 세션 사용자 구분 (A: 관리자, P: 파트너 등)
   * @param editorMbrId 파트너 등의 로그인 식별자({@code CustomUserDetails#getMbrId})
   */
  Map<String, Object> getCancelReasonView( Long pblntSn, Long ptcpInstSn, String editorUserType, String editorMbrId );

  
  /**
   * 데이터를 수정한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param cancelReason cancelReason
   */
  void updateCancelReason( CustomUserDetails user, Long pblntSn, Long ptcpInstSn, String cancelReason );

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  List<PartnerStatusInfoHistoryRow> getStatusInfoHistory( Long pblntSn, Long ptcpInstSn );

  
  /**
   * tryCloseDisclosureIfAllSettled 처리를 수행한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  boolean tryCloseDisclosureIfAllSettled( CustomUserDetails user, Long pblntSn );
}
