package kr.or.kids.domain.cm.upload.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse;
import kr.or.kids.domain.cm.upload.dto.PartnerStatusInfoHistoryRow;
import kr.or.kids.domain.cm.upload.vo.DisclosureMemberVO;

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
  void addPartners( UserVO user, Long pblntSn, DisclosurePartnerRequest request );

  
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
   * 데이터를 수정한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param uldInstPrgrsSttsStcd uldInstPrgrsSttsStcd
   * @param cancelReason cancelReason
   */
  void updateStatus( UserVO user, Long pblntSn, Long ptcpInstSn, String uldInstPrgrsSttsStcd, String cancelReason );

  
  /**
   * savePartnerInformation 처리를 수행한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param request request
   */
  void savePartnerInformation( UserVO user, Long pblntSn, Long ptcpInstSn, Map<String, Object> request );

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  Map<String, Object> getPartnerInformation( Long pblntSn, Long ptcpInstSn );

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  String getCancelReason( Long pblntSn, Long ptcpInstSn );

  
  /**
   * 데이터를 수정한다.
   *
   * @param user user
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param cancelReason cancelReason
   */
  void updateCancelReason( UserVO user, Long pblntSn, Long ptcpInstSn, String cancelReason );

  
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
  boolean tryCloseDisclosureIfAllSettled( UserVO user, Long pblntSn );
}
