package kr.or.kids.domain.cm.upload.service;

import java.util.List;

import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.upload.dto.DisclosureCreateRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureDetailResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureListResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureSearchRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureUpdateRequest;

/**
 * 업로드 도메인 서비스 계약을 정의한다.
 */
public interface DisclosureService {

  /**
   * 조건에 맞는 데이터를 조회한다.
   *
   * @param request request
   * @return 처리 결과
   */
  List<DisclosureListResponse> search( DisclosureSearchRequest request );

  /**
   * 대상 건수를 반환한다.
   *
   * @param request request
   * @return 처리 결과
   */
  int count( DisclosureSearchRequest request );

  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  DisclosureDetailResponse findById( Long pblntSn );

  /**
   * 데이터를 등록한다.
   *
   * @param sessionUser sessionUser
   * @param request request
   * @return 처리 결과
   */
  Long create( UserVO sessionUser, DisclosureCreateRequest request );

  /**
   * 데이터를 수정한다.
   *
   * @param sessionUser sessionUser
   * @param pblntSn pblntSn
   * @param request request
   */
  void update( UserVO sessionUser, Long pblntSn, DisclosureUpdateRequest request );

  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   */
  void delete( Long pblntSn );

  
  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  String getStatus( Long pblntSn );

  
  /**
   * 데이터를 수정한다.
   *
   * @param sessionUser sessionUser
   * @param pblntSn pblntSn
   * @param pblntPrgrsSttsCd pblntPrgrsSttsCd
   */
  void updateStatus( UserVO sessionUser, Long pblntSn, String pblntPrgrsSttsCd );

  
  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  List<java.util.Map<String, Object>> findFilesByPblntSn( Long pblntSn, Long ptcpInstSn );

  
  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   * @param atchFileId atchFileId
   */
  void deleteFile( Long pblntSn, String atchFileId );

  
  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   */
  void deleteUploadedFilesAfterTransfer( Long pblntSn, Long ptcpInstSn );

  
  /**
   * requireDisclosureInProgressForPartnerActions 처리를 수행한다.
   *
   * @param pblntSn pblntSn
   */
  void requireDisclosureInProgressForPartnerActions( Long pblntSn );
}
