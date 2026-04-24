package kr.or.kids.domain.cm.common.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

import javax.imageio.ImageIO;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.common.dto.TempPdfListItem;
import kr.or.kids.global.config.FileUploadProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * cdm-backend temp 폴더 내 PDF/이미지 파일 목록 조회, PDF 페이지 PNG 렌더링, 이미지 파일 서빙.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TempPdfViewService {

    private static final String PDF_EXT = ".pdf";
    private static final String[] IMAGE_EXTENSIONS = { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };

    private final FileUploadProperties fileUploadProperties;
    private final WatermarkService watermarkService;

    public List<TempPdfListItem> listPdfs() throws IOException {
        return listTempFiles( p -> p.toString().toLowerCase().endsWith( PDF_EXT ) );
    }

    /**
     * temp 폴더 내 이미지 파일 목록 조회 (jpg, jpeg, png, gif, webp, bmp).
     */
    public List<TempPdfListItem> listImages() throws IOException {
        return listTempFiles( this::isImagePath );
    }

    /**
     * temp 폴더 내 PDF + 이미지 파일 목록 조회 (미리보기용 통합 목록).
     */
    public List<TempPdfListItem> listPdfsAndImages() throws IOException {
        return listTempFiles( p -> {
            String lower = p.toString().toLowerCase();
            if (lower.endsWith( PDF_EXT )) return true;
            return isImagePath( p );
        } );
    }

    private boolean isImagePath( Path p ) {
        String lower = p.toString().toLowerCase();
        for (String ext : IMAGE_EXTENSIONS) {
            if (lower.endsWith( ext )) return true;
        }
        return false;
    }

    private List<TempPdfListItem> listTempFiles( java.util.function.Predicate<Path> filter ) throws IOException {
        Path tempDir = resolveTempDir();
        if (!Files.isDirectory( tempDir )) {
            log.warn( "Temp directory does not exist: {}", tempDir );
            return List.of();
        }
        List<TempPdfListItem> list = new ArrayList<>();
        try (DirectoryStream<Path> stream = Files.newDirectoryStream( tempDir, p -> Files.isRegularFile( p ) && filter.test( p ) )) {
            for (Path p : stream) {
                String name = p.getFileName().toString();
                long size = Files.size( p );
                list.add( new TempPdfListItem( name, size ) );
            }
        }
        return list;
    }

    /**
     * temp 폴더 내 PDF의 총 페이지 수 반환.
     */
    public int getTotalPages( String fileName ) throws IOException {
        Path tempDir = resolveTempDir();
        Path filePath = resolveAndValidatePdfPath( tempDir, fileName );
        if (filePath == null) {
            throw new IllegalArgumentException( "파일을 찾을 수 없습니다 : " + fileName );
        }
        try (PDDocument doc = Loader.loadPDF( filePath.toFile() )) {
            int n = doc.getNumberOfPages();
            return Math.max( 0, n );
        }
    }

    /**
     * fileName·page로 해당 페이지 PNG 바이트 반환.
     */
    public byte[] renderPageByFileName( String fileName, int page, int dpi ) throws IOException {
        Path tempDir = resolveTempDir();
        Path filePath = resolveAndValidatePdfPath( tempDir, fileName );
        if (filePath == null) {
            throw new IllegalArgumentException( "파일을 찾을 수 없습니다 : " + fileName );
        }
        int safeDpi = Math.max( 72, Math.min( dpi, 300 ) );
        try (PDDocument doc = Loader.loadPDF( filePath.toFile() )) {
            int totalPages = doc.getNumberOfPages();
            if (totalPages <= 0) {
                throw new IOException( "PDF has no pages" );
            }
            int safePage = Math.max( 0, Math.min( page, totalPages - 1 ) );
            PDFRenderer renderer = new PDFRenderer( doc );
            BufferedImage image = renderer.renderImageWithDPI( safePage, safeDpi );
            if (image == null) {
                throw new IOException( "PDF page render returned no image" );
            }
            BufferedImage watermarked = watermarkService.apply( image );
            return writePngBytes( watermarked != null ? watermarked : image );
        }
    }

    /**
     * fileName으로 전체 페이지 PNG 바이트 목록 반환 (한 번에 요청).
     */
    public List<byte[]> renderAllPagesByFileName( String fileName, int dpi ) throws IOException {
        Path tempDir = resolveTempDir();
        Path filePath = resolveAndValidatePdfPath( tempDir, fileName );
        if (filePath == null) {
            throw new IllegalArgumentException( "파일을 찾을 수 없습니다 : " + fileName );
        }
        int safeDpi = Math.max( 72, Math.min( dpi, 300 ) );
        List<byte[]> result = new ArrayList<>();
        try (PDDocument doc = Loader.loadPDF( filePath.toFile() )) {
            int totalPages = doc.getNumberOfPages();
            if (totalPages <= 0) {
                return result;
            }
            PDFRenderer renderer = new PDFRenderer( doc );
            for (int p = 0; p < totalPages; p++) {
                BufferedImage image = renderer.renderImageWithDPI( p, safeDpi );
                if (image == null) {
                    throw new IOException( "PDF page render returned no image: page " + p );
                }
                BufferedImage watermarked = watermarkService.apply( image );
                result.add( writePngBytes( watermarked != null ? watermarked : image ) );
            }
        }
        return result;
    }

    public org.springframework.http.HttpHeaders pngResponseHeaders() {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType( MediaType.IMAGE_PNG );
        headers.setCacheControl( "no-store, no-cache, must-revalidate, max-age=0" );
        headers.setPragma( "no-cache" );
        return headers;
    }

    private Path resolveTempDir() {
        String path = fileUploadProperties.getTempPath();
        if (path == null || path.isBlank()) {
            path = "temp";
        }
        return Paths.get( path ).normalize().toAbsolutePath();
    }

    /**
     * tempDir 기준 fileName이 temp 하위 PDF인지 검증 후 Path 반환. 아니면 null.
     */
    private Path resolveAndValidatePdfPath( Path tempDir, String fileName ) throws IOException {
        if (fileName == null || !fileName.toLowerCase().endsWith( PDF_EXT )) {
            return null;
        }
        Path resolved = tempDir.resolve( fileName ).normalize();
        if (!resolved.startsWith( tempDir ) || !Files.isRegularFile( resolved )) {
            return null;
        }
        return resolved;
    }

    /**
     * temp 폴더 내 이미지 파일을 Resource로 반환. PDF/이미지 확장자가 아니거나 존재하지 않으면 null.
     */
    public Resource getTempFileResource( String fileName ) throws IOException {
        Path tempDir = resolveTempDir();
        Path resolved = resolveAndValidateTempFilePath( tempDir, fileName );
        if (resolved == null) return null;
        return new UrlResource( resolved.toUri() );
    }

    /**
     * temp 폴더 내 이미지 파일을 읽어 워터마크 적용 후 PNG 바이트로 반환.
     * 이미지가 아니거나 실패 시 null.
     */
    public byte[] getTempImageWithWatermark( String fileName ) throws IOException {
        Path tempDir = resolveTempDir();
        Path resolved = resolveAndValidateTempFilePath( tempDir, fileName );
        if (resolved == null || !isImagePath( resolved )) return null;
        BufferedImage image;
        try (InputStream in = Files.newInputStream( resolved )) {
            image = ImageIO.read( in );
        }
        if (image == null) return null;
        BufferedImage watermarked = watermarkService.apply( image );
        return writePngBytes( watermarked != null ? watermarked : image );
    }

    /**
     * fileName이 이미지 확장자인지 여부 (temp 경로 검증 없이 확장자만).
     */
    public boolean isImageFile( String fileName ) {
        return fileName != null && isImagePath( Paths.get( fileName ) );
    }

    /**
     * 이미지 파일의 Content-Type. 알 수 없으면 application/octet-stream.
     */
    public MediaType getTempFileMediaType( String fileName ) {
        if (fileName == null) return MediaType.APPLICATION_OCTET_STREAM;
        String lower = fileName.toLowerCase();
        if (lower.endsWith( ".png" )) return MediaType.IMAGE_PNG;
        if (lower.endsWith( ".gif" )) return MediaType.IMAGE_GIF;
        if (lower.endsWith( ".jpg" ) || lower.endsWith( ".jpeg" )) return MediaType.IMAGE_JPEG;
        if (lower.endsWith( ".webp" )) return MediaType.parseMediaType( "image/webp" );
        if (lower.endsWith( ".bmp" )) return MediaType.parseMediaType( "image/bmp" );
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    /**
     * tempDir 기준 fileName이 temp 하위 PDF 또는 이미지인지 검증 후 Path 반환. 아니면 null.
     */
    private Path resolveAndValidateTempFilePath( Path tempDir, String fileName ) throws IOException {
        if (fileName == null || fileName.isBlank()) return null;
        if (fileName.contains( ".." )) return null;
        String lower = fileName.toLowerCase();
        boolean pdf = lower.endsWith( PDF_EXT );
        boolean image = isImagePath( Paths.get( lower ) );
        if (!pdf && !image) return null;
        Path resolved = tempDir.resolve( fileName ).normalize();
        if (!resolved.startsWith( tempDir ) || !Files.isRegularFile( resolved )) return null;
        return resolved;
    }

    private static byte[] writePngBytes( BufferedImage image ) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            if (!ImageIO.write( image, "png", baos )) {
                throw new IOException( "PNG ImageWriter unavailable or encode failed" );
            }
            return baos.toByteArray();
        }
    }
}
