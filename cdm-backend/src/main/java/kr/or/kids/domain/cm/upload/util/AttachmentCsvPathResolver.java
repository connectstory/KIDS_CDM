package kr.or.kids.domain.cm.upload.util;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.stereotype.Component;

import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.global.config.FileProperties;
import lombok.RequiredArgsConstructor;

/**
 * 업로드 공통 유틸리티 기능을 제공한다.
 */
@Component
@RequiredArgsConstructor
public class AttachmentCsvPathResolver {

  private final CommonFileService commonFileService;
  private final FileProperties fileProperties;

  
  /**
   * resolveAttachmentCsvPath 처리를 수행한다.
   *
   * @param storedName storedName
   * @return 처리 결과
   */
  public Path resolveAttachmentCsvPath( String storedName ) {
    if (storedName == null || storedName.isBlank()) {
      return null;
    }
    TbCaEFileTrsmVo vo = commonFileService.selectFile( storedName.trim() );
    if (vo == null || vo.getSrvrFileNm() == null || vo.getSrvrFileNm().isBlank()) {
      return null;
    }
    String rawRel = vo.getFileStrgPathDsctn();
    if (rawRel == null) {
      rawRel = "";
    }
    String rel = rawRel.startsWith( "/" ) ? rawRel.substring( 1 ) : rawRel;
    String storePath = fileProperties.getStorePath();
    if (storePath != null && !storePath.isBlank()) {
      Path base = Paths.get( storePath );
      Path full = rel.isEmpty() ? base.resolve( vo.getSrvrFileNm() ) : base.resolve( rel ).resolve( vo.getSrvrFileNm() );
      full = full.normalize();
      if (Files.isRegularFile( full )) {
        return full;
      }
    }
    if (rawRel.startsWith( "/" )) {
      Path absolute = Paths.get( rawRel ).resolve( vo.getSrvrFileNm() ).normalize();
      if (Files.isRegularFile( absolute )) {
        return absolute;
      }
    }
    return null;
  }
}
