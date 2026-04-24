package kr.or.kids.domain.cm.common.service.impl;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.service.FileDownloadService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import lombok.RequiredArgsConstructor;

@Service
@Profile({ "dev", "prod" })
@RequiredArgsConstructor
public class CaFileDownloadService implements FileDownloadService {

    private final FileApiService fileApiService;
    private final CommonFileService commonFileService;

    @Override
    public ResponseEntity<Object> download( String atchFileId ) {

        TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );
        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        String srvrFileNm = file.getSrvrFileNm();
        String fileNm = file.getFileNm();

        //System.out.println( "srvrFileNm: " + srvrFileNm );
        ResponseEntity<byte[]> caResponse = fileApiService.downloadFile( srvrFileNm );

        if (!caResponse.getStatusCode().is2xxSuccessful() || caResponse.getBody() == null) {
            return ResponseEntity.status( caResponse.getStatusCode() ).build();
        }

        String fileName = fileNm;
        if (fileName == null) {
            fileName = "download";
        }
        // Safari/Chrome 호환을 위해 RFC 5987 방식(filename*=UTF-8'')을 함께 사용합니다.
        String encodedFileName = URLEncoder.encode( fileName, StandardCharsets.UTF_8 ).replace( "+", "%20" );
        String asciiFallbackFileName = fileName.replaceAll( "[^\\x20-\\x7E]", "_" ).replace( "\"", "_" ).replace( "\\", "_" );
        String contentDisposition = "attachment; filename=\"" + asciiFallbackFileName + "\"; filename*=UTF-8''" + encodedFileName;

        HttpHeaders headers = new HttpHeaders();
        headers.set( HttpHeaders.CONTENT_DISPOSITION, contentDisposition );
        headers.setContentType( MediaType.APPLICATION_OCTET_STREAM );

        return new ResponseEntity<>( caResponse.getBody(), headers, HttpStatus.OK );
    }
}
