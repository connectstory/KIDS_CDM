package kr.or.kids.domain.cm.upload.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.upload.vo.DisclosureMemberVO;
import kr.or.kids.domain.cm.upload.dto.DisclosureCreateRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureDetailResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureListResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureSearchRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureUpdateRequest;
public interface DisclosureService {

  // 조건에 맞는 데이터를 조회한다.
  List<DisclosureListResponse> searchAdminDisclosureList( DisclosureSearchRequest request, DisclosureMemberVO member );

  // 대상 건수를 반환한다.
  int countAdminDisclosure( DisclosureSearchRequest request, DisclosureMemberVO member );

  // 조건에 맞는 데이터를 조회한다.
  List<DisclosureListResponse> searchPartnerDisclosureList( DisclosureSearchRequest request, DisclosureMemberVO member );

  // 대상 건수를 반환한다.
  int countPartnerDisclosure( DisclosureSearchRequest request, DisclosureMemberVO member );

  // 대상 데이터를 조회한다.
  DisclosureDetailResponse findById( Long pblntSn );

  // 데이터를 등록한다.
  Long create( DisclosureMemberVO member, DisclosureCreateRequest request );

  // 데이터를 수정한다.
  void update( DisclosureMemberVO member, Long pblntSn, DisclosureUpdateRequest request );

  // 데이터를 삭제한다.
  void delete( Long pblntSn );

  // 조회 결과를 반환한다.
  String getStatus( Long pblntSn );
  
  // 데이터를 수정한다.
  void updateStatus( UserVO sessionUser, Long pblntSn, String pblntPrgrsSttsCd );

  // 대상 데이터를 조회한다. fileSeCd가 null이면 전체 구분.
  List<java.util.Map<String, Object>> findFilesByPblntSn( Long pblntSn, Long ptcpInstSn, String fileSeCd );

  default List<java.util.Map<String, Object>> findFilesByPblntSn( Long pblntSn, Long ptcpInstSn ) {
    return findFilesByPblntSn( pblntSn, ptcpInstSn, null );
  }

  // 공시 첨부 업로드 (파일별 CA 업로드 + ULD, ResearchServiceImpl 패턴)
  List<String> uploadDisclosureFiles( DisclosureMemberVO member, Long pblntSn, Long ptcpInstSn, String fileSeCd, List<MultipartFile> files );

  // API용 파일 삭제 (가시 목록·관리자 연계 검증 후 삭제)
  void deleteDisclosureFile( DisclosureMemberVO member, Long pblntSn, String atchFileId );

  // 다운로드 메타 조회 및 권한 검증 (본문 바이트는 컨트롤러에서 FileApiService로 처리)
  TbCaEFileTrsmVo resolveDisclosureFileForDownload( DisclosureMemberVO member, Long pblntSn, String atchFileSn );

  /**
   * 내부/배치용: 권한 검증 없이 물리·ULD 정리. API에서는 deleteDisclosureFile 사용.
   */
  void deleteFile( Long pblntSn, String atchFileId );
  
  // 데이터를 삭제한다.
  void deleteUploadedFilesAfterTransfer( Long pblntSn, Long ptcpInstSn );
  
  // requireDisclosureInProgressForPartnerActions 처리를 수행한다.
  void requireDisclosureInProgressForPartnerActions( Long pblntSn );
}
