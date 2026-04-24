package kr.or.kids.domain.cm.upload.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.common.mapper.CommonFileMapper;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;
import kr.or.kids.domain.cm.upload.dto.DisclosureCreateRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureDetailResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureListResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosurePartnerResponse;
import kr.or.kids.domain.cm.upload.dto.DisclosureSearchRequest;
import kr.or.kids.domain.cm.upload.dto.DisclosureUpdateRequest;
import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.domain.cm.upload.service.DisclosurePblntStartMailService;
import kr.or.kids.domain.cm.upload.service.DisclosureService;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerService;
import kr.or.kids.domain.cm.upload.vo.TbCmMUldPblntVO;
import kr.or.kids.global.type.CmTaskCodeType;

/**
 * 업로드 도메인 비즈니스 로직을 구현한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@Service
public class DisclosureServiceImpl implements DisclosureService {

  private static final String DEFAULT_SYSTEM_USER = "SYSTEM";

  
  private static String resolveAuditUserId( UserVO sessionUser ) {
    if (sessionUser == null) {
      return DEFAULT_SYSTEM_USER;
    }
    if (sessionUser.getUserNm() != null && !sessionUser.getUserNm().isBlank()) {
      return sessionUser.getUserNm().trim();
    }
    if (sessionUser.getNi() != null && !sessionUser.getNi().isBlank()) {
      return sessionUser.getNi().trim();
    }
    if (sessionUser.getUserNo() != null && !sessionUser.getUserNo().isBlank()) {
      return sessionUser.getUserNo().trim();
    }
    if (sessionUser.getUserId() != null && !sessionUser.getUserId().isBlank()) {
      return sessionUser.getUserId().trim();
    }
    return DEFAULT_SYSTEM_USER;
  }
  private static final String LOG_SEPARATOR = "============================================================";
  private static final String KEY_ATCH_FILE_GROUP_ID = "atchFileGroupId";

  
  private static final String FILE_SE_CD_CDM = "08";
  private static final String KEY_FILE_SE_CD = "fileSeCd";
  private static final String KEY_FILE_SE_CD_ALT = "filesecd";
  private static final String KEY_ATCH_FILE_ID = "atchFileId";
  private static final String KEY_ATCH_FILE_ID_ALT = "atchfileid";

  private final DisclosureMapper disclosureMapper;
  private final DisclosurePartnerService disclosurePartnerService;
  private final CommonFileMapper commonFileMapper;
  private final FileApiService fileApiService;
  private final DisclosurePblntStartMailService disclosurePblntStartMailService;
  private final DisclosureService disclosureTx;

  /**
   * DisclosureServiceImpl 처리를 수행한다.
   *
   * @param disclosureMapper disclosureMapper
   * @param disclosurePartnerService disclosurePartnerService
   * @param commonFileMapper commonFileMapper
   * @param fileApiService fileApiService
   * @param disclosurePblntStartMailService disclosurePblntStartMailService
   * @param disclosureTx disclosureTx
   */
  public DisclosureServiceImpl(
      DisclosureMapper disclosureMapper,
      DisclosurePartnerService disclosurePartnerService,
      CommonFileMapper commonFileMapper,
      FileApiService fileApiService,
      DisclosurePblntStartMailService disclosurePblntStartMailService,
      @Lazy DisclosureService disclosureTx ) {
    this.disclosureMapper = disclosureMapper;
    this.disclosurePartnerService = disclosurePartnerService;
    this.commonFileMapper = commonFileMapper;
    this.fileApiService = fileApiService;
    this.disclosurePblntStartMailService = disclosurePblntStartMailService;
    this.disclosureTx = disclosureTx;
  }

  private static void validatePblntDateRange( String pblntBgngYmd, String pblntEndYmd ) {
    if (pblntBgngYmd != null && pblntEndYmd != null && pblntBgngYmd.compareTo( pblntEndYmd ) > 0) {
      throw new IllegalArgumentException( "공시 종료일자는 시작일자 이후여야 합니다." );
    }
  }

  /**
   * 조건에 맞는 데이터를 조회한다.
   *
   * @param request request
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public List<DisclosureListResponse> search( DisclosureSearchRequest request ) {
    List<TbCmMUldPblntVO> vos = disclosureMapper.search( request );
    return vos.stream().map( this::toDisclosureListResponse ).collect( Collectors.toList() );
  }

  
  private DisclosureListResponse toDisclosureListResponse( TbCmMUldPblntVO vo ) {
    Long pblntSn = vo.getPblntSn();
    List<DisclosurePartnerResponse> partners = disclosurePartnerService.findByPblntSn( pblntSn );
    List<DisclosurePartnerResponse> eligible = partners.stream()
        .filter( DisclosureServiceImpl::isEligibleForPartnerRegistrationTotals )
        .collect( Collectors.toList() );
    long totalPartnersCount = eligible.size();
    long completedPartnersCount = eligible.stream()
        .filter( DisclosureServiceImpl::hasPartnerAnyRegistration )
        .count();
    return DisclosureListResponse.from( vo, completedPartnersCount, totalPartnersCount );
  }

  
  private static boolean hasPartnerAnyRegistration( DisclosurePartnerResponse p ) {
    if ( p == null ) {
      return false;
    }
    String st = normalizeUldInstPrgrsStts( p.getUldInstPrgrsSttsStcd() );
    if ( "07".equals( st ) ) {
      return false;
    }
    return "03".equals( st ) || "05".equals( st );
  }

  private static String normalizeUldInstPrgrsStts( String raw ) {
    if ( raw == null || raw.isBlank() ) {
      return "";
    }
    String t = raw.trim();
    return t.length() == 1 ? "0" + t : t;
  }

  private static boolean isDeletedPartner( DisclosurePartnerResponse p ) {
    if ( p == null ) {
      return true;
    }
    String d = p.getDelYn();
    if ( d == null || d.isBlank() ) {
      return false;
    }
    return "Y".equalsIgnoreCase( d.trim() );
  }

  
  private static boolean isEligibleForPartnerRegistrationTotals( DisclosurePartnerResponse p ) {
    if ( p == null || isDeletedPartner( p ) ) {
      return false;
    }
    return true;
  }

  /**
   * 대상 건수를 반환한다.
   *
   * @param request request
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public int count( DisclosureSearchRequest request ) {
    return disclosureMapper.count( request );
  }

  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public DisclosureDetailResponse findById( Long pblntSn ) {
    TbCmMUldPblntVO vo = disclosureMapper.findById( pblntSn );
    if (vo == null) {
      throw new IllegalArgumentException( "Disclosure not found with id: " + pblntSn );
    }
    return DisclosureDetailResponse.from( vo );
  }

  /**
   * 데이터를 등록한다.
   *
   * @param sessionUser sessionUser
   * @param request request
   * @return 처리 결과
   */
  @Override
  @Transactional
  public Long create( UserVO sessionUser, DisclosureCreateRequest request ) {
    String createBy = resolveAuditUserId( sessionUser );

    validatePblntDateRange( request.getPblntBgngYmd(), request.getPblntEndYmd() );

    TbCmMUldPblntVO vo = request.toVO( createBy );
    disclosureMapper.insert( vo ); 

    return vo.getPblntSn(); 
  }

  /**
   * 데이터를 수정한다.
   *
   * @param sessionUser sessionUser
   * @param pblntSn pblntSn
   * @param request request
   */
  @Override
  @Transactional
  public void update( UserVO sessionUser, Long pblntSn, DisclosureUpdateRequest request ) {
    
    TbCmMUldPblntVO existing = disclosureMapper.findById( pblntSn );
    if (existing == null) {
      throw new IllegalArgumentException( "Disclosure not found with id: " + pblntSn );
    }

    validatePblntDateRange( request.getPblntBgngYmd(), request.getPblntEndYmd() );

    String updateBy = resolveAuditUserId( sessionUser );
    TbCmMUldPblntVO vo = request.toVO( pblntSn, updateBy );

    disclosureMapper.update( vo );
  }

  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   */
  @Override
  @Transactional
  public void delete( Long pblntSn ) {
    
    TbCmMUldPblntVO existing = disclosureMapper.findById( pblntSn );
    if (existing == null) {
      throw new IllegalArgumentException( "Disclosure not found with id: " + pblntSn );
    }
    
    deleteAllAttachmentsForDisclosure( pblntSn );
    disclosureMapper.delete( pblntSn );
  }

  
  private void deleteAllAttachmentsForDisclosure( Long pblntSn ) {
    List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldList( pblntSn, CmTaskCodeType.CDM_NOTI.code(), null );
    Set<String> groupIds = new LinkedHashSet<>();
    Set<String> atchFileIds = new LinkedHashSet<>();
    collectGroupAndAtchFileIdsForDisclosureCleanup( uldList, groupIds, atchFileIds );
    deletePhysicalFilesForDisclosureUld( pblntSn, atchFileIds );
    deactivateFileGroupsAndUldAfterCleanup( pblntSn, groupIds );

  }

  private static boolean includeUldRowInDisclosureAttachmentCleanup( TbCmMFileUldVO uld ) {
    if (uld.getDelYn() != null && !"N".equalsIgnoreCase( uld.getDelYn().trim() )) {
      return false;
    }
    String groupId = uld.getAtchFileId();
    return groupId != null && !groupId.isBlank();
  }

  private void collectGroupAndAtchFileIdsForDisclosureCleanup(
      List<TbCmMFileUldVO> uldList,
      Set<String> groupIds,
      Set<String> atchFileIds ) {
    for (TbCmMFileUldVO uld : uldList) {
      if ( !includeUldRowInDisclosureAttachmentCleanup( uld ) ) {
        continue;
      }
      String groupId = uld.getAtchFileId();
      groupIds.add( groupId );
      try {
        for (CaFileItem item : FileApiService.toCaFileItemsFromCa( fileApiService, groupId )) {
          if (item.atchFileId() != null && !item.atchFileId().isBlank()) {
            atchFileIds.add( item.atchFileId() );
          }
        }
      } catch (Exception ex) {
        UploadNonFatal.discard( ex );
      }
    }
  }

  private void deletePhysicalFilesForDisclosureUld( Long pblntSn, Set<String> atchFileIds ) {
    for (String atchFileId : atchFileIds) {
      try {
        disclosureTx.deleteFile( pblntSn, atchFileId );
      } catch (Exception ex) {
        UploadNonFatal.discard( ex );
      }
    }
  }

  private void deactivateFileGroupsAndUldAfterCleanup( Long pblntSn, Set<String> groupIds ) {
    for (String groupId : groupIds) {
      try {
        fileApiService.deleteGroupFiles( groupId );
      } catch (Exception ex) {
        UploadNonFatal.discard( ex );
      }
      try {
        disclosureMapper.deleteFile( pblntSn, groupId );
      } catch (Exception ex) {
        UploadNonFatal.discard( ex );
      }
      try {
        disclosureMapper.updateFileGroupUseYn( groupId, DEFAULT_SYSTEM_USER );
      } catch (Exception ex) {
        UploadNonFatal.discard( ex );
      }
    }
  }

  /**
   * 조회 결과를 반환한다.
   *
   * @param pblntSn pblntSn
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public String getStatus( Long pblntSn ) {
    return disclosureMapper.findStatus( pblntSn );
  }

  /**
   * requireDisclosureInProgressForPartnerActions 처리를 수행한다.
   *
   * @param pblntSn pblntSn
   */
  @Override
  @Transactional(readOnly = true)
  public void requireDisclosureInProgressForPartnerActions( Long pblntSn ) {
    if (pblntSn == null) {
      throw new IllegalArgumentException( "공시일련번호가 없습니다." );
    }
    String code = disclosureTx.getStatus( pblntSn );
    if (code == null || code.isBlank()) {
      throw new IllegalStateException( "공시 상태를 확인할 수 없습니다. 업로드·현황등록·참여승인을 진행할 수 없습니다." );
    }
    String normalized = code.trim();
    if (normalized.length() == 1) {
      normalized = "0" + normalized;
    }
    if ("02".equals( normalized )) {
      return;
    }
    if ("03".equals( normalized )) {
      throw new IllegalStateException( "마감된 공시에서는 업로드·현황등록·참여승인을 진행할 수 없습니다." );
    }
    if ("01".equals( normalized )) {
      throw new IllegalStateException( "관리자가 공시를 시작한 후에만 업로드·현황등록·참여승인을 진행할 수 있습니다." );
    }
    throw new IllegalStateException( "이 공시에서는 업로드·현황등록·참여승인을 진행할 수 없습니다." );
  }

  /**
   * 데이터를 수정한다.
   *
   * @param sessionUser sessionUser
   * @param pblntSn pblntSn
   * @param pblntPrgrsSttsCd pblntPrgrsSttsCd
   */
  @Override
  @Transactional
  public void updateStatus( UserVO sessionUser, Long pblntSn, String pblntPrgrsSttsCd ) {
    if (pblntPrgrsSttsCd == null || pblntPrgrsSttsCd.trim().isEmpty()) {
      throw new IllegalArgumentException( "공시상태(pblntPrgrsSttsCd)는 필수입니다." );
    }

    String prevStatus = disclosureMapper.findStatus( pblntSn );
    String updateBy = resolveAuditUserId( sessionUser );
    disclosureMapper.updateStatus( pblntSn, pblntPrgrsSttsCd, updateBy, java.time.LocalDateTime.now() );

    String normPrev = normalizePblntStts( prevStatus );
    String normNew = normalizePblntStts( pblntPrgrsSttsCd );
    if ("02".equals( normNew ) && "01".equals( normPrev )) {
      try {
        disclosurePblntStartMailService.sendDisclosureStartedMails( pblntSn );
      } catch (Exception ex) {
        UploadNonFatal.discard( ex );
      }
    }
  }

  private static String normalizePblntStts( String code ) {
    if (code == null) {
      return "";
    }
    String s = code.trim();
    if (s.length() == 1) {
      return "0" + s;
    }
    return s;
  }

  private static boolean shouldSkipUldForPartnerFileList( TbCmMFileUldVO uld, Long ptcpInstSn ) {
    if (uld.getDelYn() != null && !"N".equalsIgnoreCase( uld.getDelYn().trim() )) {
      return true;
    }
    Long uPtcp = uld.getPtcpInstSn();
    if (ptcpInstSn != null) {
      return uPtcp != null && !uPtcp.equals( ptcpInstSn );
    }
    return uPtcp != null;
  }

  private void appendExpandedFileRowsForUld(
      List<Map<String, Object>> out,
      Long pblntSn,
      TbCmMFileUldVO uld,
      String groupId ) {
    for (CaFileItem item : FileApiService.toCaFileItemsFromCa( fileApiService, groupId )) {
      Map<String, Object> row = new LinkedHashMap<>();
      row.put( "pstSn", pblntSn );
      row.put( KEY_ATCH_FILE_GROUP_ID, item.atchFileGroupId() );
      row.put( "ptcpInstSn", uld.getPtcpInstSn() );
      row.put( KEY_ATCH_FILE_ID, item.atchFileId() );
      row.put( "strgFileNm", item.fileNm() );
      row.put( "atchFileSn", item.fileNm() );
      row.put( "fileExtnNm", item.fileExtNm() );
      row.put( "fileSz", item.fileSz() );
      row.put( "fileSize", item.fileSz() );
      row.put( "uldTaskSeCd", uld.getUldTaskSeCd() );
      row.put( KEY_FILE_SE_CD, uld.getFileSeCd() );
      row.put( "rgtrId", uld.getRgtrId() );
      row.put( "regDt", uld.getRegDt() );
      out.add( row );
    }
  }

  /**
   * 대상 데이터를 조회한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @Override
  @Transactional(readOnly = true)
  public List<java.util.Map<String, Object>> findFilesByPblntSn( Long pblntSn, Long ptcpInstSn ) {

    
    List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldList( pblntSn, CmTaskCodeType.CDM_NOTI.code(), null );
    List<Map<String, Object>> out = new ArrayList<>();
    for (TbCmMFileUldVO uld : uldList) {
      if (shouldSkipUldForPartnerFileList( uld, ptcpInstSn )) {
        continue;
      }
      String groupId = uld.getAtchFileId();
      if (groupId == null || groupId.isBlank()) {
        continue;
      }
      appendExpandedFileRowsForUld( out, pblntSn, uld, groupId );
    }

    return out;
  }

  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   * @param atchFileId atchFileId
   */
  @Override
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void deleteFile( Long pblntSn, String atchFileId ) {

    if (pblntSn == null) {
      throw new IllegalArgumentException( "공시일련번호는 필수입니다." );
    }

    if (atchFileId == null || atchFileId.trim().isEmpty()) {
      throw new IllegalArgumentException( "첨부파일ID(atchFileId)는 필수입니다." );
    }

    java.util.Map<String, Object> fileRow = disclosureMapper.selectFileByAtchFileId( atchFileId );
    if (fileRow == null || fileRow.isEmpty()) {
      throw new IllegalArgumentException( "삭제할 파일을 찾을 수 없습니다." );
    }

    String atchFileGroupId = fileRow.get( KEY_ATCH_FILE_GROUP_ID ) != null ? fileRow.get( KEY_ATCH_FILE_GROUP_ID ).toString() : null;

    try {
      
      fileApiService.deleteFileOne( atchFileId, atchFileGroupId );

      
      if (atchFileGroupId != null) {
        int remain = disclosureMapper.countFilesInGroup( atchFileGroupId );
        if (remain == 0) {
          disclosureMapper.updateFileGroupUseYn( atchFileGroupId, DEFAULT_SYSTEM_USER );
          disclosureMapper.updateFileUldDelYn( pblntSn, atchFileGroupId );

        }
      }

    } catch (IllegalArgumentException e) {
      throw e;
    } catch (Exception e) {
      throw e;
    }
  }

  /**
   * 데이터를 삭제한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   */
  @Override
  @Transactional
  public void deleteUploadedFilesAfterTransfer( Long pblntSn, Long ptcpInstSn ) {
    if (pblntSn == null || ptcpInstSn == null) {
      return;
    }
    List<Map<String, Object>> files = disclosureTx.findFilesByPblntSn( pblntSn, ptcpInstSn );
    
    for (Map<String, Object> file : files) {
      if (!isCdmFileRow( file )) {
        continue;
      }
      String atchFileId = firstNonBlankString( file, KEY_ATCH_FILE_ID, KEY_ATCH_FILE_ID_ALT );
      if (atchFileId == null) {
        continue;
      }
      try {
        disclosureTx.deleteFile( pblntSn, atchFileId );

      } catch (Exception ex) {
        UploadNonFatal.discard( ex );
      }
    }
  }

  
  private static boolean isCdmFileRow( Map<String, Object> file ) {
    return FILE_SE_CD_CDM.equals( firstNonBlankString( file, KEY_FILE_SE_CD, KEY_FILE_SE_CD_ALT ) );
  }

  
  private static String firstNonBlankString( Map<String, Object> row, String key1, String key2 ) {
    Object v = row.get( key1 );
    if (v == null) {
      v = row.get( key2 );
    }
    if (v == null) {
      return null;
    }
    String s = String.valueOf( v ).trim();
    return s.isEmpty() ? null : s;
  }
}
