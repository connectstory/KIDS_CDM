package kr.or.kids.domain.cm.common.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.mapper.CommonFileMapper;
import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileGroupTrsmVo;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;
import kr.or.kids.global.config.FileProperties;
import kr.or.kids.global.type.YnFlagType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CommonFileServiceImpl implements CommonFileService {

  private final CommonFileMapper commonFileMapper;
  private final FileProperties fileProperties;

  @Override
  @Transactional
  // 파일 그룹 + 파일 저장 (공지, 게시판 공용)
  public String uploadFileGroup( String atchFileGroupId, String taskSeCd, String taskSeTrgtId, List<MultipartFile> files, String rgtrId, String uldTaskSeCd, String fileSeCd, Long pstSnForUld, Long ptcpInstSnForUld ) {

    String groupId = resolveOrCreateGroupId( atchFileGroupId );
    insertEmptyFileGroup( groupId, taskSeCd, taskSeTrgtId, rgtrId );
    persistMultipartFilesIfAny( groupId, files, taskSeCd, uldTaskSeCd, fileSeCd, rgtrId );
    insertFileUldRow( groupId, taskSeTrgtId, pstSnForUld, uldTaskSeCd, fileSeCd, rgtrId, ptcpInstSnForUld );

    return groupId;
  }

  private static String resolveOrCreateGroupId( String atchFileGroupId ) {
    if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
      return UUID.randomUUID().toString();
    }
    return atchFileGroupId;
  }

  private void insertEmptyFileGroup( String groupId, String taskSeCd, String taskSeTrgtId, String rgtrId ) {
    TbCaEFileGroupTrsmVo existing = commonFileMapper.selectFileGroup( groupId );
    if (existing != null) {
      return;
    }
    TbCaEFileGroupTrsmVo groupVo = new TbCaEFileGroupTrsmVo();
    groupVo.setAtchFileGroupId( groupId );
    groupVo.setTaskSeCd( taskSeCd );
    groupVo.setTaskSeTrgtId( taskSeTrgtId );
    groupVo.setRgtrId( rgtrId );
    commonFileMapper.insertFileGroup( groupVo );
  }

  private void persistMultipartFilesIfAny( String groupId, List<MultipartFile> files, String taskSeCd, String uldTaskSeCd, String fileSeCd, String rgtrId ) {
    if (files == null || files.isEmpty()) {
      return;
    }
    String baseSavePath = buildSavePath( taskSeCd, uldTaskSeCd, fileSeCd );
    String yearMonth = LocalDateTime.now().format( DateTimeFormatter.ofPattern( "yyyyMM" ) );
    String relativeDir = "attach/" + baseSavePath + "/" + yearMonth;
    Path dirPath = Paths.get( fileProperties.getStorePath(), relativeDir );

    try {
      Files.createDirectories( dirPath );
    } catch (IOException e) {
      throw new IllegalStateException( "파일 저장 디렉터리를 생성할 수 없습니다: " + dirPath, e );
    }

    List<TbCaEFileTrsmVo> fileVoList = new ArrayList<>();
    int seq = 1;
    for (MultipartFile file : files) {
      TbCaEFileTrsmVo vo = tryBuildAndStoreOneFile( groupId, file, relativeDir, dirPath, fileSeCd, rgtrId, seq );
      if (vo != null) {
        fileVoList.add( vo );
        seq++;
      }
    }

    if (!fileVoList.isEmpty()) {
      commonFileMapper.insertFileBatch( fileVoList );
    }
  }

  private TbCaEFileTrsmVo tryBuildAndStoreOneFile( String groupId, MultipartFile file, String relativeDir, Path dirPath, String fileSeCd, String rgtrId, int seq ) {
    if (file == null || file.isEmpty()) {
      return null;
    }
    String originalName = file.getOriginalFilename();
    if (originalName == null || originalName.isBlank()) {
      return null;
    }

    String fileNm = Paths.get( originalName ).getFileName().toString();
    String ext = "";
    int dotIdx = fileNm.lastIndexOf( '.' );
    if (dotIdx > -1 && dotIdx < fileNm.length() - 1) {
      ext = fileNm.substring( dotIdx + 1 );
    }

    String atchFileId = UUID.randomUUID().toString();
    String srvrFileNm = UUID.randomUUID().toString() + (ext.isEmpty() ? "" : "." + ext);

    Path filePath = dirPath.resolve( srvrFileNm );
    try {
      Files.write( filePath, file.getBytes() );
    } catch (IOException e) {
      throw new IllegalStateException( "파일을 저장할 수 없습니다: " + filePath, e );
    }

    Long fileSize;
    try {
      fileSize = Files.size( filePath );
    } catch (IOException e) {
      fileSize = null;
    }

    TbCaEFileTrsmVo fileVo = new TbCaEFileTrsmVo();
    fileVo.setAtchFileId( atchFileId );
    fileVo.setAtchFileGroupId( groupId );
    fileVo.setFileSeq( (long) seq );
    fileVo.setFileStrgPathDsctn( relativeDir );
    fileVo.setSrvrFileNm( srvrFileNm );
    fileVo.setPrvcInclYn( resolvePrvcInclYn( fileSeCd ) );
    fileVo.setFileNm( fileNm );
    fileVo.setFileExtnNm( ext );
    fileVo.setFileSz( fileSize );
    fileVo.setFileCn( "" );
    fileVo.setRgtrId( rgtrId );
    return fileVo;
  }

  private void insertFileUldRow( String groupId, String taskSeTrgtId, Long pstSnForUld, String uldTaskSeCd, String fileSeCd, String rgtrId, Long ptcpInstSnForUld ) {
    TbCmMFileUldVO uldVo = new TbCmMFileUldVO();
    uldVo.setPstSn( pstSnForUld != null ? pstSnForUld : Long.valueOf( taskSeTrgtId ) );
    uldVo.setAtchFileId( groupId );
    uldVo.setUldTaskSeCd( uldTaskSeCd );
    uldVo.setFileSeCd( fileSeCd );
    if (ptcpInstSnForUld != null) {
      uldVo.setPtcpInstSn( ptcpInstSnForUld );
    }
    uldVo.setDelYn( YnFlagType.N.code() );
    uldVo.setRgtrId( rgtrId );
    uldVo.setRegPrgmId( "FileUpload" );

    commonFileMapper.insertFileUld( uldVo );
  }

  @Override
  // 그룹 기준 파일 조회
  public List<TbCaEFileTrsmVo> selectFileListByGroup( String atchFileGroupId ) {
    return commonFileMapper.selectFileListByGroup( atchFileGroupId );
  }

  @Override
  @Transactional
  // 파일 그룹 삭제
  public void deleteFileGroup( String atchFileGroupId, String mdfrId ) {

    TbCaEFileGroupTrsmVo vo = new TbCaEFileGroupTrsmVo();
    vo.setAtchFileGroupId( atchFileGroupId );
    vo.setMdfrId( mdfrId );

    commonFileMapper.deleteFileGroup( vo );
  }

  @Override
  // 파일 단건 삭제 (논리삭제)
  public void deleteFile( String atchFileGroupId ) {
    // 물리 파일 삭제
    List<TbCaEFileTrsmVo> files = commonFileMapper.selectFileListByGroup( atchFileGroupId );
    if (files != null) {
      for (TbCaEFileTrsmVo f : files) {
        deletePhysicalFile( f.getFileStrgPathDsctn(), f.getSrvrFileNm() );
      }
    }

    TbCaEFileTrsmVo vo = new TbCaEFileTrsmVo();
    vo.setAtchFileGroupId( atchFileGroupId );
    commonFileMapper.deleteFile( vo );
  }

  @Override
  // 파일 단건 삭제 (논리삭제)
  public void deleteFileById( String atchFileId ) {
    TbCaEFileTrsmVo existing = commonFileMapper.selectFile( atchFileId );
    if (existing != null) {
      deletePhysicalFile( existing.getFileStrgPathDsctn(), existing.getSrvrFileNm() );
    }

    TbCaEFileTrsmVo vo = new TbCaEFileTrsmVo();
    vo.setAtchFileId( atchFileId );
    commonFileMapper.deleteFileById( vo );
  }

  @Override
  // 게시글 기준 연결 조회
  public List<TbCmMFileUldVO> selectFileUldList( Long pstSn ) {
    return commonFileMapper.selectFileUldList( pstSn, null, null );
  }

  @Override
  // 게시글 + 참여기관 기준 연결 조회 (IRB 등)
  public List<TbCmMFileUldVO> selectFileUldListByAsmtSnAndPtcpInstSn( Long pstSn, Long ptcpInstSn ) {
    return commonFileMapper.selectFileUldListByAsmtSnAndPtcpInstSn( pstSn, ptcpInstSn );
  }

  @Override
  // pst_sn + uld_task_se_cd + file_se_cd 기준 연결 조회 (DRB 등)
  public List<TbCmMFileUldVO> selectFileUldListByPstSnAndTaskAndFileSeCd( Long pstSn, String uldTaskSeCd, String fileSeCd ) {
    return commonFileMapper.selectFileUldListByPstSnAndTaskAndFileSeCd( pstSn, uldTaskSeCd, fileSeCd );
  }

  @Override
  @Transactional
  // 파일 단건 삭제 (논리삭제)
  public void deleteFileUld( TbCmMFileUldVO vo ) {
    commonFileMapper.deleteFileUld( vo );
  }

  @Override
  // 파일 단건 조회 (다운로드용)
  public TbCaEFileTrsmVo selectFile( String atchFileId ) {
    return commonFileMapper.selectFile( atchFileId );
  }

  @Override
  // 파일 그룹 기준 조회
  public TbCaEFileTrsmVo selectFileByGroupId( String atchFileGroupId ) {
    return commonFileMapper.selectFileByGroupId( atchFileGroupId );
  }

  // 파일 저장 경로 생성
  private String buildSavePath( String taskSeCd, String uldTaskSeCd, String fileSeCd ) {
    StringBuilder sb = new StringBuilder();
    if (taskSeCd != null && !taskSeCd.isBlank()) {
      sb.append( taskSeCd.trim() );
    } else {
      sb.append( "cm" );
    }
    if (uldTaskSeCd != null && !uldTaskSeCd.isBlank()) {
      sb.append( "/" ).append( uldTaskSeCd.trim() );
    }
    if (fileSeCd != null && !fileSeCd.isBlank()) {
      sb.append( "/" ).append( fileSeCd.trim() );
    }
    return sb.toString();
  }

  // 파일 권한 포함 여부 결정
  private String resolvePrvcInclYn( String fileSeCd ) {
    return "0";
  }

  // 파일 물리적 삭제
  private void deletePhysicalFile( String fileStrgPathDsctn, String srvrFileNm ) {
    if (fileStrgPathDsctn == null || srvrFileNm == null) {
      return;
    }
    Path path = Paths.get( fileProperties.getStorePath(), fileStrgPathDsctn, srvrFileNm );
    try {
      Files.deleteIfExists( path );
    } catch (IOException e) {
      log.warn( "물리 파일 삭제에 실패했습니다: {}", path );
    }
  }
}
