package kr.or.kids.domain.cm.common.service.impl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.mapper.CommonFileMapper;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileGroupTrsmVo;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.global.config.FileProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Profile("local")
@RequiredArgsConstructor
public class FileApiServiceLocalImpl implements FileApiService {

  private final CommonFileMapper commonFileMapper;
  private final FileProperties fileProperties;

  @Override
  public String groupInsert( String rgtrId ) {
    if (rgtrId == null || rgtrId.isBlank()) {
      throw new IllegalArgumentException( "등록자 ID가 필요합니다." );
    }
    String groupId = UUID.randomUUID().toString();

    TbCaEFileGroupTrsmVo groupVo = new TbCaEFileGroupTrsmVo();
    groupVo.setAtchFileGroupId( groupId );
    groupVo.setTaskSeCd( "cm" );
    groupVo.setTaskSeTrgtId( null );
    groupVo.setRgtrId( rgtrId );

    commonFileMapper.insertFileGroup( groupVo );
    return groupId;
  }

  @Override
  public void uploadFiles( String atchFileGroupId, MultipartFile file, String savePath ) {
    if (file == null || file.isEmpty()) {
      return;
    }
    if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
      throw new IllegalArgumentException( "첨부파일 그룹 ID가 필요합니다." );
    }
    if (savePath == null || savePath.isBlank()) {
      throw new IllegalArgumentException( "저장 경로(savePath)가 필요합니다." );
    }

    String storePath = fileProperties.getStorePath();
    if (storePath == null || storePath.isBlank()) {
      throw new IllegalStateException( "file.storePath 설정이 필요합니다." );
    }

    Path dirPath = Paths.get( storePath, savePath );
    try {
      Files.createDirectories( dirPath );
    } catch (IOException e) {
      log.error( "[local uploadFiles] 디렉터리 생성 실패 savePath={}", savePath, e );
      throw new IllegalStateException( "파일 저장 경로를 준비할 수 없습니다." );
    }

    String originalName = file.getOriginalFilename();
    if (originalName == null || originalName.isBlank()) {
      originalName = "file";
    }
    String fileNm = originalName.substring( originalName.lastIndexOf( '/' ) + 1 );
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
      log.error( "[local uploadFiles] 파일 쓰기 실패 atchFileGroupId={}", atchFileGroupId, e );
      throw new IllegalStateException( "파일을 저장할 수 없습니다." );
    }

    Long fileSize;
    try {
      fileSize = Files.size( filePath );
    } catch (IOException e) {
      log.warn( "[local uploadFiles] 디스크에서 파일 크기 확인 실패, 업로드 메타데이터 크기로 대체 atchFileGroupId={}", atchFileGroupId, e );
      long declared = file.getSize();
      fileSize = declared >= 0 ? declared : null;
    }

    TbCaEFileTrsmVo fileVo = new TbCaEFileTrsmVo();
    fileVo.setAtchFileId( atchFileId );
    fileVo.setAtchFileGroupId( atchFileGroupId );
    fileVo.setFileSeq( 1L );
    fileVo.setFileStrgPathDsctn( savePath );
    fileVo.setPrvcInclYn( "0" );
    fileVo.setFileNm( fileNm );
    fileVo.setFileExtnNm( ext );
    fileVo.setFileSz( fileSize );
    fileVo.setFileCn( "" );
    fileVo.setRgtrId( null );
    fileVo.setSrvrFileNm( srvrFileNm );

    List<TbCaEFileTrsmVo> list = new ArrayList<>();
    list.add( fileVo );
    try {
      commonFileMapper.insertFileBatch( list );
    } catch (Exception e) {
      log.error( "[local uploadFiles] DB 저장 실패 atchFileGroupId={}", atchFileGroupId, e );
      throw new IllegalStateException( "파일 정보를 저장할 수 없습니다." );
    }
  }

  @Override
  public List<Map<String, Object>> getFileList( String atchFileGroupId ) {
    if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
      return List.of();
    }
    List<TbCaEFileTrsmVo> files = commonFileMapper.selectFileListByGroup( atchFileGroupId );
    if (files == null || files.isEmpty()) {
      return List.of();
    }
    List<Map<String, Object>> result = new ArrayList<>();
    for (TbCaEFileTrsmVo f : files) {
      Map<String, Object> m = new HashMap<>();
      m.put( "atchFileId", f.getAtchFileId() );
      m.put( "fileNm", f.getFileNm() );
      m.put( "fileExtnNm", f.getFileExtnNm() );
      m.put( "fileSz", f.getFileSz() );
      m.put( "srvrFileNm", f.getSrvrFileNm() );
      m.put( "fileStrgPathDsctn", f.getFileStrgPathDsctn() );
      result.add( m );
    }
    return result;
  }

  @Override
  public ResponseEntity<byte[]> downloadFile( String srvrFileNm ) {
    try {
      if (srvrFileNm == null || srvrFileNm.isBlank()) {
        return ResponseEntity.status( HttpStatus.BAD_REQUEST ).body( null );
      }
      TbCaEFileTrsmVo vo = commonFileMapper.selectFileBySrvrFileNm( srvrFileNm );
      if (vo == null) {
        return ResponseEntity.status( HttpStatus.NOT_FOUND ).body( null );
      }
      String storePath = fileProperties.getStorePath();
      if (storePath == null || storePath.isBlank()) {
        log.error( "[local downloadFile] file.storePath 미설정 srvrFileNm={}", srvrFileNm );
        return ResponseEntity.status( HttpStatus.INTERNAL_SERVER_ERROR ).body( null );
      }
      String pathDsctn = vo.getFileStrgPathDsctn();
      String diskSrvrNm = vo.getSrvrFileNm();
      if (pathDsctn == null || diskSrvrNm == null || diskSrvrNm.isBlank()) {
        log.warn( "[local downloadFile] 메타데이터 불완전 pathDsctn={}, srvrFileNm={}", pathDsctn, diskSrvrNm );
        return ResponseEntity.status( HttpStatus.NOT_FOUND ).body( null );
      }
      Path path = Paths.get( storePath, pathDsctn, diskSrvrNm );
      if (!Files.exists( path )) {
        return ResponseEntity.status( HttpStatus.NOT_FOUND ).body( null );
      }
      byte[] bytes = Files.readAllBytes( path );

      HttpHeaders headers = new HttpHeaders();
      headers.setContentType( MediaType.APPLICATION_OCTET_STREAM );
      headers.setContentLength( bytes.length );
      return new ResponseEntity<>( bytes, headers, HttpStatus.OK );
    } catch (IOException e) {
      log.error( "[local downloadFile 실패]", e );
      return ResponseEntity.status( HttpStatus.INTERNAL_SERVER_ERROR ).body( null );
    }
  }

  @Override
  public void deleteFileOne( String atchFileId, String atchFileGroupId ) {
    if (atchFileId == null || atchFileId.isBlank()) {
      throw new IllegalArgumentException( "첨부파일 ID가 필요합니다." );
    }
    try {
      TbCaEFileTrsmVo existing = commonFileMapper.selectFile( atchFileId );
      if (existing != null) {
        deletePhysicalFile( existing.getFileStrgPathDsctn(), existing.getSrvrFileNm() );
      }
      TbCaEFileTrsmVo vo = new TbCaEFileTrsmVo();
      vo.setAtchFileId( atchFileId );
      commonFileMapper.hardDeleteFileById( vo );
    } catch (Exception e) {
      log.error( "[local deleteFileOne 실패] atchFileId={}", atchFileId, e );
      throw new RuntimeException( "파일 삭제 중 오류가 발생했습니다." );
    }
  }

  @Override
  public void deleteGroupFiles( String atchFileGroupId ) {
    if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
      return;
    }
    try {
      List<TbCaEFileTrsmVo> files = commonFileMapper.selectFileListByGroup( atchFileGroupId );
      if (files != null) {
        for (TbCaEFileTrsmVo f : files) {
          deletePhysicalFile( f.getFileStrgPathDsctn(), f.getSrvrFileNm() );
        }
      }
      TbCaEFileTrsmVo vo = new TbCaEFileTrsmVo();
      vo.setAtchFileGroupId( atchFileGroupId );
      commonFileMapper.hardDeleteFile( vo );

      TbCaEFileGroupTrsmVo groupVo = new TbCaEFileGroupTrsmVo();
      groupVo.setAtchFileGroupId( atchFileGroupId );
      commonFileMapper.hardDeleteFileGroup( groupVo );
    } catch (Exception e) {
      log.error( "[local deleteGroupFiles 실패] atchFileGroupId={}", atchFileGroupId, e );
      throw new RuntimeException( "파일 그룹 삭제 중 오류가 발생했습니다." );
    }
  }

  private void deletePhysicalFile( String fileStrgPathDsctn, String srvrFileNm ) {
    if (fileStrgPathDsctn == null || srvrFileNm == null) {
      return;
    }
    String storePath = fileProperties.getStorePath();
    if (storePath == null || storePath.isBlank()) {
      log.warn( "[local deletePhysicalFile] file.storePath 미설정으로 물리 파일 삭제 생략 pathDsctn={}, srvrFileNm={}", fileStrgPathDsctn, srvrFileNm );
      return;
    }
    Path path = Paths.get( storePath, fileStrgPathDsctn, srvrFileNm );
    try {
      Files.deleteIfExists( path );
    } catch (IOException e) {
      log.warn( "[local deletePhysicalFile] 삭제 실패 path={}", path, e );
    }
  }
}
