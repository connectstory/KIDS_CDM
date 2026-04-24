package kr.or.kids.domain.cm.common.service.impl;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.imageio.ImageIO;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.service.FilePreviewService;
import kr.or.kids.domain.cm.common.service.WatermarkService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.global.config.FileProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 로컬 디스크에 저장된 파일(atchFileId) 미리보기. local 프로파일에서만 사용.
 */
@Slf4j
@Service
@Profile("local")
@RequiredArgsConstructor
public class FilePreviewServiceLocalImpl implements FilePreviewService {

    private static final String PDF_EXT = ".pdf";
    private static final String[] IMAGE_EXTENSIONS = { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };

    private final CommonFileService commonFileService;
    private final WatermarkService watermarkService;
    private final FileProperties fileProperties;

    @Override
    public int getPreviewTotalPages( String atchFileId ) throws IOException {
        if (atchFileId == null || atchFileId.isBlank()) {
            return 0;
        }
        try {
            TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );
            if (file == null)
                return 0;
            Path path = resolveStoredFilePath( file );
            if (path == null || !Files.isRegularFile( path ))
                return 0;
            String ext = getExtension( file );
            if (isPdfExt( ext )) {
                try (PDDocument doc = Loader.loadPDF( path.toFile() )) {
                    int n = doc.getNumberOfPages();
                    return Math.max( 0, n );
                }
            }
            if (isImageExt( ext ))
                return 1;
            return 0;
        } catch (DataAccessException e) {
            log.error( "[FilePreviewLocal] 총 페이지 조회 DB 실패 atchFileId={}", atchFileId, e );
            return 0;
        } catch (IOException e) {
            log.error( "[FilePreviewLocal] 총 페이지 조회 파일/PDF 처리 실패 atchFileId={}", atchFileId, e );
            throw new IOException( "미리보기 정보를 조회할 수 없습니다." );
        }
    }

    @Override
    public byte[] getPreviewPagePng( String atchFileId, int page, int dpi ) throws IOException {
        if (atchFileId == null || atchFileId.isBlank()) {
            return null;
        }
        try {
            TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );
            if (file == null)
                return null;
            Path path = resolveStoredFilePath( file );
            if (path == null || !Files.isRegularFile( path ))
                return null;
            if (!isPdfExt( getExtension( file ) ))
                return null;

            int safeDpi = Math.max( 72, Math.min( dpi, 300 ) );
            try (PDDocument doc = Loader.loadPDF( path.toFile() )) {
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
        } catch (DataAccessException e) {
            log.error( "[FilePreviewLocal] PDF 페이지 PNG 생성 DB 실패 atchFileId={}, page={}", atchFileId, page, e );
            return null;
        } catch (IOException e) {
            log.error( "[FilePreviewLocal] PDF 페이지 PNG 생성 파일/PDF 처리 실패 atchFileId={}, page={}", atchFileId, page, e );
            throw new IOException( "미리보기 이미지를 생성할 수 없습니다." );
        }
    }

    @Override
    public byte[] getPreviewImagePng( String atchFileId ) throws IOException {
        if (atchFileId == null || atchFileId.isBlank()) {
            return null;
        }
        try {
            TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );
            if (file == null)
                return null;
            Path path = resolveStoredFilePath( file );
            if (path == null || !Files.isRegularFile( path ) || !isImageExt( getExtension( file ) ))
                return null;

            BufferedImage image;
            try (InputStream in = Files.newInputStream( path )) {
                image = ImageIO.read( in );
            }
            if (image == null)
                return null;
            BufferedImage watermarked = watermarkService.apply( image );
            return encodePngBytes( watermarked != null ? watermarked : image );
        } catch (DataAccessException e) {
            log.error( "[FilePreviewLocal] 이미지 PNG 미리보기 DB 실패 atchFileId={}", atchFileId, e );
            return null;
        } catch (IOException e) {
            log.error( "[FilePreviewLocal] 이미지 PNG 미리보기 파일/인코딩 실패 atchFileId={}", atchFileId, e );
            throw new IOException( "미리보기 이미지를 생성할 수 없습니다." );
        }
    }

    @Override
    public boolean isPdf( String atchFileId ) {
        if (atchFileId == null || atchFileId.isBlank()) {
            return false;
        }
        try {
            TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );
            return file != null && isPdfExt( getExtension( file ) );
        } catch (DataAccessException e) {
            log.warn( "[FilePreviewLocal] isPdf DB 조회 실패 atchFileId={}", atchFileId, e );
            return false;
        }
    }

    @Override
    public boolean isImage( String atchFileId ) {
        if (atchFileId == null || atchFileId.isBlank()) {
            return false;
        }
        try {
            TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );
            return file != null && isImageExt( getExtension( file ) );
        } catch (DataAccessException e) {
            log.warn( "[FilePreviewLocal] isImage DB 조회 실패 atchFileId={}", atchFileId, e );
            return false;
        }
    }

    @Override
    public HttpHeaders pngResponseHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType( MediaType.IMAGE_PNG );
        headers.setCacheControl( "no-store, no-cache, must-revalidate, max-age=0" );
        headers.setPragma( "no-cache" );
        return headers;
    }

    private Path resolveStoredFilePath( TbCaEFileTrsmVo file ) {
        String storePath = fileProperties.getStorePath();
        if (storePath == null || storePath.isBlank()) {
            log.warn( "[FilePreviewLocal] file.storePath 미설정" );
            return null;
        }
        String srvr = file.getSrvrFileNm();
        if (srvr == null || srvr.isBlank()) {
            return null;
        }
        String dsctn = file.getFileStrgPathDsctn();
        return Paths.get( storePath, dsctn != null ? dsctn : "", srvr ).normalize();
    }

    private static byte[] encodePngBytes( BufferedImage image ) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            if (!ImageIO.write( image, "png", baos )) {
                throw new IOException( "PNG ImageWriter unavailable or encode failed" );
            }
            return baos.toByteArray();
        }
    }

    private static String getExtension( TbCaEFileTrsmVo file ) {
        String ext = file.getFileExtnNm();
        if (ext != null && !ext.isBlank())
            return ext.toLowerCase();
        String name = file.getFileNm();
        if (name != null && name.contains( "." ))
            return name.substring( name.lastIndexOf( "." ) + 1 ).toLowerCase();
        return "";
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
}
