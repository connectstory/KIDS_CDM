package kr.or.kids.domain.cm.common.service.impl;

import java.io.UncheckedIOException;
import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.context.annotation.Profile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.service.FileDownloadService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.global.config.FileProperties;
import lombok.RequiredArgsConstructor;

@Service
@Profile("local")
@RequiredArgsConstructor
public class LocalFileDownloadService implements FileDownloadService {

    private final CommonFileService commonFileService;
    private final FileProperties fileProperties;

    @Override
    public ResponseEntity<Object> download( String atchFileId ) {
        TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );

        Path path = Paths.get( fileProperties.getStorePath(), file.getFileStrgPathDsctn(), file.getSrvrFileNm() );
        Resource resource;
        try {
            resource = new UrlResource( path.toUri() );
        } catch (MalformedURLException e) {
            throw new UncheckedIOException( e );
        }

        String fileName = file.getFileNm();
        if (fileName == null) {
            fileName = "download";
        }
        // Safari/Chrome 호환을 위해 RFC 5987 방식(filename*=UTF-8'')을 함께 사용합니다.
        String encodedFileName = URLEncoder.encode( fileName, StandardCharsets.UTF_8 ).replace( "+", "%20" );
        String asciiFallbackFileName = fileName.replaceAll( "[^\\x20-\\x7E]", "_" ).replace( "\"", "_" ).replace( "\\", "_" );
        String contentDisposition = "attachment; filename=\"" + asciiFallbackFileName + "\"; filename*=UTF-8''" + encodedFileName;

        return ResponseEntity.ok()
            .header( HttpHeaders.CONTENT_DISPOSITION, contentDisposition )
            .header( HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_OCTET_STREAM_VALUE )
            .<Object>body( resource );
    }
}
