package kr.or.kids.domain.cm.common.service.impl;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;

import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.service.FilePreviewService;
import kr.or.kids.domain.cm.common.service.WatermarkService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * atchFileId 기준 미리보기. 내부적으로 DB에서 srvrFileNm 조회 후 FileApiService(ca-api)로 파일을 가져와 PNG 생성. local 이 아닌 프로파일(dev, prod 등)에서
 * 사용.
 */
@Slf4j
@Service
@Profile("!local")
@RequiredArgsConstructor
public class FilePreviewServiceCaImpl implements FilePreviewService {

    private static final String PDF_EXT = ".pdf";
    private static final String[] IMAGE_EXTENSIONS = { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
    private static final String KEY_SRVR_FILE_NM = "srvrFileNm";
    private final FileApiService fileApiService;
    private final WatermarkService watermarkService;
    private final CommonFileService commonFileService;

    @Override
    public int getPreviewTotalPages( String atchFileId ) throws IOException {
        if (atchFileId == null || atchFileId.isBlank()) {
            return 0;
        }
        try {
            byte[] bytes = downloadByAtchFileId( atchFileId );
            if (bytes == null || bytes.length == 0)
                return 0;

            Map<String, Object> fileInfo = getFileInfo( atchFileId );
            if (fileInfo == null)
                return 0;

            String ext = getExtension( fileInfo );
            if (isPdfExt( ext )) {
                try (PDDocument doc = Loader.loadPDF( bytes )) {
                    int n = doc.getNumberOfPages();
                    return Math.max( 0, n );
                }
            }
            if (isImageExt( ext ))
                return 1;
            return 0;
        } catch (IOException e) {
            log.error( "[FilePreviewCa] 총 페이지 조회 실패 atchFileId={}", atchFileId, e );
            throw new IOException( "미리보기 정보를 조회할 수 없습니다." );
        }
    }

    @Override
    public byte[] getPreviewPagePng( String atchFileId, int page, int dpi ) throws IOException {
        if (atchFileId == null || atchFileId.isBlank()) {
            return null;
        }
        try {
            byte[] bytes = downloadByAtchFileId( atchFileId );
            if (bytes == null || bytes.length == 0)
                return null;

            Map<String, Object> fileInfo = getFileInfo( atchFileId );
            if (fileInfo == null || !isPdfExt( getExtension( fileInfo ) ))
                return null;

            int safeDpi = Math.max( 72, Math.min( dpi, 300 ) );
            try (PDDocument doc = Loader.loadPDF( bytes )) {
                int totalPages = doc.getNumberOfPages();
                if (totalPages <= 0) {
                    return null;
                }
                int safePage = Math.max( 0, Math.min( page, totalPages - 1 ) );

                PDFRenderer renderer = new PDFRenderer( doc );
                BufferedImage image = renderer.renderImageWithDPI( safePage, safeDpi );
                if (image == null) {
                    return null;
                }
                BufferedImage watermarked = watermarkService.apply( image );

                return encodePngBytes( watermarked != null ? watermarked : image );
            }
        } catch (IOException e) {
            log.error( "[FilePreviewCa] PDF 페이지 PNG 생성 실패 atchFileId={}, page={}", atchFileId, page, e );
            throw new IOException( "미리보기 이미지를 생성할 수 없습니다." );
        }
    }

    @Override
    public byte[] getPreviewImagePng( String atchFileId ) throws IOException {
        if (atchFileId == null || atchFileId.isBlank()) {
            return null;
        }
        try {
            byte[] bytes = downloadByAtchFileId( atchFileId );
            if (bytes == null || bytes.length == 0)
                return null;

            Map<String, Object> fileInfo = getFileInfo( atchFileId );
            if (fileInfo == null || !isImageExt( getExtension( fileInfo ) ))
                return null;

            BufferedImage image;
            try (ByteArrayInputStream bais = new ByteArrayInputStream( bytes )) {
                image = ImageIO.read( bais );
            }
            if (image == null)
                return null;

            BufferedImage watermarked = watermarkService.apply( image );
            return encodePngBytes( watermarked != null ? watermarked : image );
        } catch (IOException e) {
            log.error( "[FilePreviewCa] 이미지 PNG 미리보기 실패 atchFileId={}", atchFileId, e );
            throw new IOException( "미리보기 이미지를 생성할 수 없습니다." );
        }
    }

    @Override
    public boolean isPdf( String atchFileId ) {
        if (atchFileId == null || atchFileId.isBlank()) {
            return false;
        }
        Map<String, Object> fileInfo = getFileInfo( atchFileId );
        return fileInfo != null && isPdfExt( getExtension( fileInfo ) );
    }

    @Override
    public boolean isImage( String atchFileId ) {
        if (atchFileId == null || atchFileId.isBlank()) {
            return false;
        }
        Map<String, Object> fileInfo = getFileInfo( atchFileId );
        return fileInfo != null && isImageExt( getExtension( fileInfo ) );
    }

    @Override
    public HttpHeaders pngResponseHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType( MediaType.IMAGE_PNG );
        headers.setCacheControl( "no-store, no-cache, must-revalidate, max-age=0" );
        headers.setPragma( "no-cache" );
        return headers;
    }

    private byte[] downloadByAtchFileId( String atchFileId ) {
        Map<String, Object> fileInfo = getFileInfo( atchFileId );
        if (fileInfo == null) {
            log.warn( "[FilePreviewCa] 파일 메타 없음 atchFileId={}", atchFileId );
            return null;
        }
        try {
            Object srvrObj = fileInfo.get( KEY_SRVR_FILE_NM );
            if (srvrObj == null) {
                log.warn( "[FilePreviewCa] srvrFileNm 없음 atchFileId={}", atchFileId );
                return null;
            }
            String srvrFileNm = String.valueOf( srvrObj ).trim();
            if (srvrFileNm.isEmpty() || "null".equalsIgnoreCase( srvrFileNm )) {
                log.warn( "[FilePreviewCa] srvrFileNm 없음 atchFileId={}", atchFileId );
                return null;
            }

            ResponseEntity<byte[]> resp = fileApiService.downloadFile( srvrFileNm );
            if (resp == null) {
                log.warn( "[FilePreviewCa] 다운로드 응답 없음 atchFileId={}", atchFileId );
                return null;
            }
            if (!resp.getStatusCode().is2xxSuccessful()) {
                log.warn( "[FilePreviewCa] 다운로드 실패 atchFileId={}, status={}", atchFileId, resp.getStatusCode() );
                return null;
            }
            byte[] body = resp.getBody();
            if (body == null || body.length == 0) {
                log.warn( "[FilePreviewCa] 다운로드 본문 없음 atchFileId={}", atchFileId );
                return null;
            }
            return body;
        } catch (IllegalStateException e) {
            log.error( "[FilePreviewCa] CA API 설정 오류로 다운로드 불가 atchFileId={}", atchFileId, e );
            return null;
        } catch (IllegalArgumentException e) {
            log.error( "[FilePreviewCa] 다운로드 요청 인자 오류 atchFileId={}", atchFileId, e );
            return null;
        } catch (RestClientException e) {
            log.error( "[FilePreviewCa] CA 파일 서버 HTTP 통신 실패 atchFileId={}", atchFileId, e );
            return null;
        } catch (RuntimeException e) {
            Throwable cause = e.getCause();
            if (cause instanceof RestClientException r) {
                log.error( "[FilePreviewCa] CA 파일 다운로드 HTTP 실패(원인) atchFileId={}", atchFileId, r );
            } else {
                log.error( "[FilePreviewCa] CA 파일 다운로드 런타임 오류 atchFileId={}, exceptionType={}", atchFileId, e.getClass().getName(), e );
            }
            return null;
        }
    }

    private Map<String, Object> getFileInfo( String atchFileId ) {
        if (atchFileId == null || atchFileId.isBlank()) {
            return null;
        }
        try {
            TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );
            if (file == null) {
                return null;
            }
            Map<String, Object> fileInfo = new HashMap<>();
            fileInfo.put( "fileNm", file.getFileNm() );
            fileInfo.put( "fileExtnNm", file.getFileExtnNm() );
            fileInfo.put( KEY_SRVR_FILE_NM, file.getSrvrFileNm() );
            return fileInfo;
        } catch (DataAccessException e) {
            log.error( "[FilePreviewCa] 파일 메타 조회 DB 실패 atchFileId={}", atchFileId, e );
            return null;
        }
    }

    private static String getExtension( Map<String, Object> fileInfo ) {
        if (fileInfo == null)
            return "";

        Object extObj = fileInfo.get( "fileExtnNm" );
        if (extObj != null) {
            String ext = String.valueOf( extObj ).trim();
            if (!ext.isBlank())
                return ext.toLowerCase();
        }

        String name = toLowerCaseOrNull( fileInfo.get( "fileNm" ) );
        if (name != null && name.contains( "." )) {
            return name.substring( name.lastIndexOf( "." ) + 1 );
        }

        String srvr = toLowerCaseOrNull( fileInfo.get( KEY_SRVR_FILE_NM ) );
        if (srvr != null && srvr.contains( "." )) {
            return srvr.substring( srvr.lastIndexOf( "." ) + 1 );
        }

        return "";
    }

    private static String toLowerCaseOrNull( Object value ) {
        if (value == null)
            return null;
        String str = String.valueOf( value ).trim();
        return str.isEmpty() ? null : str.toLowerCase();
    }

    private static boolean isPdfExt( String ext ) {
        return PDF_EXT.equals( "." + ext ) || "pdf".equals( ext );
    }

    private static boolean isImageExt( String ext ) {
        if (ext == null)
            return false;
        String withDot = ext.startsWith( "." ) ? ext : "." + ext;
        for (String e : IMAGE_EXTENSIONS) {
            if (e.equals( withDot ))
                return true;
        }
        return false;
    }

    private static byte[] encodePngBytes( BufferedImage image ) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            if (!ImageIO.write( image, "png", baos )) {
                throw new IOException( "PNG ImageWriter unavailable or encode failed" );
            }
            return baos.toByteArray();
        }
    }
}
