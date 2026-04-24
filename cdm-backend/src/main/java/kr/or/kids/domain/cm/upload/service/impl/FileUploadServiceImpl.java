package kr.or.kids.domain.cm.upload.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.vo.TbCaEFileGroupTrsmVo;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;
import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.service.FileUploadService;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.global.config.FileUploadProperties;
import lombok.RequiredArgsConstructor;

/**
 * 업로드 도메인 비즈니스 로직을 구현한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class FileUploadServiceImpl implements FileUploadService {

  private static final String LOG_BORDER = "========================================";

  private final FileUploadProperties fileUploadProperties;
  private final DisclosureMapper disclosureMapper;

  private static final class UploadSession {
    String groupId;
    int nextDtlSn = 1;
  }

  /**
   * uploadFiles 처리를 수행한다.
   *
   * @param files files
   * @param pblntSn pblntSn
   * @param fileSeCd fileSeCd
   * @param rgtrId rgtrId
   * @param ptcpInstSn ptcpInstSn
   * @return 처리 결과
   */
  @Override
  @Transactional
  public List<String> uploadFiles( List<MultipartFile> files, Long pblntSn, String fileSeCd, String rgtrId, String ptcpInstSn ) {

    List<String> uploadedFileSns = new ArrayList<>();
    Path uploadDir = Paths.get( fileUploadProperties.getUploadPath() );

    UploadSession session = new UploadSession();
    String rgtrIdVal = rgtrId != null && !rgtrId.trim().isEmpty() ? rgtrId : "SYSTEM";
    String fileStoragePath = fileUploadProperties.getUploadPath().replace( "\\", "/" );
    Long ptcpInstSnNum = parsePtcpInstSnOrThrow( ptcpInstSn );

    ensureUploadDirectoryExists( uploadDir );

    for (MultipartFile file : files) {
      processSingleMultipartFile( file, session, uploadDir, pblntSn, rgtrIdVal, fileStoragePath, uploadedFileSns );
    }

    insertFileUldIfGroupCreated( session.groupId, pblntSn, fileSeCd, ptcpInstSnNum, rgtrIdVal );

    return uploadedFileSns;
  }

  private void ensureUploadDirectoryExists( Path uploadDir ) {
    try {
      if (!Files.exists( uploadDir )) {
        Files.createDirectories( uploadDir );

      }
    } catch (IOException e) {

      throw new RuntimeException( "파일 업로드 디렉토리 생성 실패", e );
    }
  }

  private static Long parsePtcpInstSnOrThrow( String ptcpInstSn ) {
    if (ptcpInstSn == null || ptcpInstSn.trim().isEmpty()) {
      return null;
    }
    try {
      return Long.parseLong( ptcpInstSn.trim() );
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException( "참여기관일련번호(ptcpInstSn)는 숫자여야 합니다: " + ptcpInstSn, e );
    }
  }

  private void ensureFileGroupCreated( UploadSession session, Long pblntSn, String rgtrIdVal ) {
    if (session.groupId != null) {
      return;
    }
    session.groupId = UUID.randomUUID().toString();
    TbCaEFileGroupTrsmVo groupVo = new TbCaEFileGroupTrsmVo();
    groupVo.setAtchFileGroupId( session.groupId );
    groupVo.setTaskSeCd( "04" );
    groupVo.setTaskSeTrgtId( String.valueOf( pblntSn ) );
    groupVo.setRgtrId( rgtrIdVal );
    disclosureMapper.insertFileGroup( groupVo );
  }

  private void processSingleMultipartFile( MultipartFile file, UploadSession session, Path uploadDir, Long pblntSn, String rgtrIdVal, String fileStoragePath, List<String> uploadedFileSns ) {
    if (file.isEmpty()) {
      return;
    }

    try {
      ensureFileGroupCreated( session, pblntSn, rgtrIdVal );

      String originalFilename = file.getOriginalFilename();
      if (originalFilename == null || originalFilename.trim().isEmpty()) {
        originalFilename = "unnamed_file";
      }

      originalFilename = originalFilename.replace( "\\", "/" );
      if (originalFilename.contains( "/" )) {
        originalFilename = originalFilename.substring( originalFilename.lastIndexOf( "/" ) + 1 );
      }

      String fileExtension = "";
      int lastDotIndex = originalFilename.lastIndexOf( "." );
      if (lastDotIndex > 0 && lastDotIndex < originalFilename.length() - 1) {
        fileExtension = originalFilename.substring( lastDotIndex + 1 ).toLowerCase();
      }

      String uuid = UUID.randomUUID().toString();
      String physicalFilename = uuid + (fileExtension.isEmpty() ? "" : "." + fileExtension);
      Path filePath = uploadDir.resolve( physicalFilename );

      if (Files.exists( filePath )) {

        uuid = UUID.randomUUID().toString();
        physicalFilename = uuid + (fileExtension.isEmpty() ? "" : "." + fileExtension);
        filePath = uploadDir.resolve( physicalFilename );
      }

      Files.write( filePath, file.getBytes() );

      String atchFileId = uuid;

      try {
        disclosureMapper.insertFileTrsm( atchFileId, session.groupId, session.nextDtlSn, fileStoragePath, "N", physicalFilename, fileExtension, originalFilename, String.valueOf( file.getSize() ), "Y", rgtrIdVal );
        session.nextDtlSn++;
        uploadedFileSns.add( physicalFilename );

      } catch (Exception dbException) {
        rollbackWrittenFile( filePath, physicalFilename );
        throw new RuntimeException( "파일 정보 저장에 실패했습니다.", dbException );
      }
    } catch (IOException e) {
      throw new RuntimeException( "파일 업로드 실패: " + file.getOriginalFilename(), e );
    } catch (RuntimeException e) {
      throw e;
    } catch (Exception e) {
      throw new RuntimeException( "파일 업로드 중 예상치 못한 오류: " + file.getOriginalFilename(), e );
    }
  }

  private void rollbackWrittenFile( Path filePath, String physicalFilename ) {
    try {
      Files.deleteIfExists( filePath );

    } catch (IOException ex) {
      UploadNonFatal.discard( ex );
    }
  }

  private void insertFileUldIfGroupCreated( String groupId, Long pblntSn, String fileSeCd, Long ptcpInstSnNum, String rgtrIdVal ) {
    if (groupId == null) {
      return;
    }
    TbCmMFileUldVO fileVo = new TbCmMFileUldVO();
    fileVo.setPstSn( pblntSn );
    fileVo.setAtchFileSn( groupId );
    fileVo.setUldTaskSeCd( "04" );
    fileVo.setFileSeCd( fileSeCd != null && !fileSeCd.trim().isEmpty() ? fileSeCd : "08" );
    fileVo.setPtcpInstSn( ptcpInstSnNum );
    fileVo.setDelYn( "N" );
    fileVo.setRgtrId( rgtrIdVal );
    fileVo.setRegDt( java.time.LocalDateTime.now() );
    disclosureMapper.insertFile( fileVo );
  }

  /**
   * 데이터를 삭제한다.
   *
   * @param atchFileSn atchFileSn
   */
  @Override
  @Transactional
  public void deleteFile( String atchFileSn ) {
    try {
      
      String fileName = atchFileSn;
      fileName = fileName.replace( "\\", "/" );
      if (fileName.contains( "/" )) {
        fileName = fileName.substring( fileName.lastIndexOf( "/" ) + 1 );
      }

      Path filePath = Paths.get( fileUploadProperties.getUploadPath() ).resolve( fileName );
      if (Files.exists( filePath )) {
        Files.delete( filePath );

      }
    } catch (IOException e) {

      throw new RuntimeException( "파일 삭제 실패: " + atchFileSn, e );
    }
  }

  /**
   * 조회 결과를 반환한다.
   *
   * @return 처리 결과
   */
  @Override
  public String getUploadPath() {
    return fileUploadProperties.getUploadPath();
  }
}
