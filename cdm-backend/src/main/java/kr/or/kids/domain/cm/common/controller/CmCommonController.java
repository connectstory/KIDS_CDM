package kr.or.kids.domain.cm.common.controller;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.common.dto.CommonCodeItem;
import kr.or.kids.domain.cm.common.dto.PartnerResponse;
import kr.or.kids.domain.cm.common.dto.TempPdfListItem;
import kr.or.kids.domain.cm.common.mapper.CommonCodeMapper;
import kr.or.kids.domain.cm.common.service.CommonFileService;
import kr.or.kids.domain.cm.common.service.FileDownloadService;
import kr.or.kids.domain.cm.common.service.FilePreviewService;
import kr.or.kids.domain.cm.common.service.PartnerService;
import kr.or.kids.domain.cm.common.service.TempPdfViewService;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.global.config.FileProperties;
import lombok.RequiredArgsConstructor;

/**
 * <pre>
 * 공통 API 컨트롤러
 * - 공통코드, 협력기관, 파일 다운로드·미리보기, temp PDF 관련 API 제공
 * </pre>
 *
 * @since 2026-04-17
 * @version 1.0
 */
@RestController
@RequestMapping("/common")
@RequiredArgsConstructor
public class CmCommonController {

    private static final String CACHE_CONTROL_NO_STORE = "no-store, no-cache, must-revalidate, max-age=0";
    private static final String PRAGMA_NO_CACHE = "no-cache";
    private static final String JSON_KEY_TOTAL_PAGES = "totalPages";
    private static final String JSON_KEY_PAGES = "pages";

    private final PartnerService partnerService;
    private final CommonCodeMapper commonCodeMapper;
    private final CommonFileService commonFileService;
    private final FilePreviewService filePreviewService;
    private final FileDownloadService fileDownloadService;
    private final TempPdfViewService tempPdfViewService;
    private final FileProperties fileProperties;

    // 공통코드 상세 목록을 조회한다.
    @GetMapping("/codes/{groupCode}")
    public ResponseEntity<ApiResponse<List<CommonCodeItem>>> getCommonCodes( @PathVariable String groupCode ) {
        List<CommonCodeItem> items = commonCodeMapper.selectByGroupCode( groupCode );
        return ApiResponse.ok( "success", "공통코드 조회 성공", items );
    }

    // 협력기관 목록을 조회한다.
    @GetMapping("/partners")
    public ResponseEntity<ApiResponse<List<PartnerResponse>>> getPartners( @RequestParam(required = false) String param ) {
        List<PartnerResponse> partners = partnerService.findAll();
        return ApiResponse.ok( "success", "협력기관 목록 조회 성공", partners );
    }

    // 분석 DATASET 양식 파일을 다운로드한다.
    @GetMapping("/template/analysis-dataset")
    public ResponseEntity<Resource> downloadAnalysisDatasetTemplate() {
        Resource resource = new ClassPathResource( "templates/analysis-dataset-template.xlsx" );
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        String downloadFileName = "분석 데이터 양식.xlsx";
        String encodedFileName = URLEncoder.encode( downloadFileName, StandardCharsets.UTF_8 ).replace( "+", "%20" );
        return ResponseEntity.ok().header( HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"" ).contentType( MediaType.parseMediaType( "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ) ).body( resource );
    }

    // VDI 신청서 양식 파일을 다운로드한다.
    @GetMapping("/template/vdi-application")
    public ResponseEntity<Resource> downloadVdiApplicationTemplate() {
        Resource resource = new ClassPathResource( "templates/vdi-application-template.hwpx" );
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        String downloadFileName = "VDI 신청서 양식.hwpx";
        String encodedFileName = URLEncoder.encode( downloadFileName, StandardCharsets.UTF_8 ).replace( "+", "%20" );
        return ResponseEntity.ok().header( HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + encodedFileName + "\"" ).contentType( MediaType.parseMediaType( "application/octet-stream" ) ).body( resource );
    }

    // 첨부파일을 다운로드한다.
    @GetMapping("/file/download/{atchFileGroupId}")
    public ResponseEntity<Object> downloadFile( @PathVariable String atchFileGroupId ) {
        return fileDownloadService.download( atchFileGroupId );
    }

    // 저장된 파일의 미리보기 메타 정보를 조회한다.
    @GetMapping("/file/preview/{atchFileId}/meta")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFilePreviewMeta( @PathVariable String atchFileId ) throws IOException {
        int totalPages = filePreviewService.getPreviewTotalPages( atchFileId );
        boolean isImage = filePreviewService.isImage( atchFileId );
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "메타 조회 성공", Map.<String, Object> of( JSON_KEY_TOTAL_PAGES, totalPages, "isImage", isImage ) );
    }

    // 저장된 PDF 파일의 특정 페이지를 PNG 이미지로 반환한다.
    @GetMapping("/file/preview/{atchFileId}/pages/{page}.png")
    public ResponseEntity<byte[]> getFilePreviewPagePng( @PathVariable String atchFileId, @PathVariable int page, @RequestParam(defaultValue = "130") int dpi ) throws IOException {
        byte[] png = filePreviewService.getPreviewPagePng( atchFileId, page, dpi );
        if (png == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().headers( filePreviewService.pngResponseHeaders() ).body( png );
    }

    // 저장된 이미지 파일을 워터마크 적용 PNG로 반환한다.
    @GetMapping("/file/preview/{atchFileId}/image")
    public ResponseEntity<byte[]> getFilePreviewImage( @PathVariable String atchFileId ) throws IOException {
        byte[] png = filePreviewService.getPreviewImagePng( atchFileId );
        if (png == null) {
            return ResponseEntity.notFound().build();
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl( CACHE_CONTROL_NO_STORE );
        headers.setPragma( PRAGMA_NO_CACHE );
        return ResponseEntity.ok().contentType( MediaType.IMAGE_PNG ).headers( headers ).body( png );
    }

    // 저장된 파일을 인라인으로 미리보기한다.
    @GetMapping("/file/preview/{atchFileId}")
    public ResponseEntity<Resource> previewFile( @PathVariable String atchFileId ) throws IOException {
        TbCaEFileTrsmVo file = commonFileService.selectFile( atchFileId );
        Path path = Paths.get( fileProperties.getStorePath(), file.getFileStrgPathDsctn(), file.getSrvrFileNm() );
        Resource resource = new UrlResource( path.toUri() );
        String encodedFileName = URLEncoder.encode( file.getFileNm(), StandardCharsets.UTF_8 ).replace( "+", "%20" );
        MediaType mediaType = getMediaTypeFromFileName( file.getFileNm(), file.getFileExtnNm() );
        return ResponseEntity.ok().header( HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + encodedFileName + "\"" ).contentType( mediaType ).body( resource );
    }

    private static MediaType getMediaTypeFromFileName( String fileNm, String extnNm ) {
        String ext = (extnNm != null && !extnNm.isBlank()) ? extnNm.toLowerCase() : "";
        if (ext.isEmpty() && fileNm != null && fileNm.contains( "." )) {
            ext = fileNm.substring( fileNm.lastIndexOf( "." ) + 1 ).toLowerCase();
        }
        return switch (ext) {
        case "pdf" -> MediaType.APPLICATION_PDF;
        case "jpg", "jpeg" -> MediaType.IMAGE_JPEG;
        case "png" -> MediaType.IMAGE_PNG;
        case "gif" -> MediaType.IMAGE_GIF;
        case "webp" -> MediaType.parseMediaType( "image/webp" );
        case "bmp" -> MediaType.parseMediaType( "image/bmp" );
        default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    // temp 폴더 내 PDF 파일 목록을 조회한다.
    @GetMapping("/temp/pdfs")
    public ResponseEntity<ApiResponse<List<TempPdfListItem>>> listTempPdfs() throws IOException {
        List<TempPdfListItem> list = tempPdfViewService.listPdfs();
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "PDF 목록 조회 성공", list );
    }

    // temp 폴더 내 PDF 및 이미지 파일 통합 목록을 조회한다.
    @GetMapping("/temp/files")
    public ResponseEntity<ApiResponse<List<TempPdfListItem>>> listTempPdfsAndImages() throws IOException {
        List<TempPdfListItem> list = tempPdfViewService.listPdfsAndImages();
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일 목록 조회 성공", list );
    }

    // temp 폴더 내 파일을 서빙한다.
    @GetMapping("/temp/files/content")
    public ResponseEntity<Object> getTempFileContent( @RequestParam String fileName ) throws IOException {
        if (fileName == null || fileName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String trimmed = fileName.trim();
        if (tempPdfViewService.isImageFile( trimmed )) {
            byte[] watermarked = tempPdfViewService.getTempImageWithWatermark( trimmed );
            if (watermarked == null) {
                return ResponseEntity.notFound().build();
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setCacheControl( CACHE_CONTROL_NO_STORE );
            headers.setPragma( PRAGMA_NO_CACHE );
            return ResponseEntity.ok().contentType( MediaType.IMAGE_PNG ).headers( headers ).body( watermarked );
        }
        Resource resource = tempPdfViewService.getTempFileResource( trimmed );
        if (resource == null || !resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        MediaType mediaType = tempPdfViewService.getTempFileMediaType( fileName );
        HttpHeaders headers = new HttpHeaders();
        headers.setCacheControl( CACHE_CONTROL_NO_STORE );
        headers.setPragma( PRAGMA_NO_CACHE );
        return ResponseEntity.ok().contentType( mediaType ).headers( headers ).body( resource );
    }

    // temp 폴더 내 PDF 파일의 메타 정보를 조회한다.
    @GetMapping("/temp/pdfs/meta")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getTempPdfMeta( @RequestParam String fileName ) throws IOException {
        if (fileName == null || fileName.isBlank()) {
            return ApiResponse.error( org.springframework.http.HttpStatus.BAD_REQUEST, "fileName이 필요합니다.", null );
        }
        int totalPages = tempPdfViewService.getTotalPages( fileName.trim() );
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "메타 조회 성공", Map.of( JSON_KEY_TOTAL_PAGES, totalPages ) );
    }

    // temp 폴더 내 PDF 파일의 특정 페이지를 PNG 이미지로 반환한다.
    @GetMapping("/temp/pdfs/pages/{page}.png")
    public ResponseEntity<byte[]> getTempPdfPagePng( @PathVariable int page, @RequestParam String fileName, @RequestParam(defaultValue = "150") int dpi ) throws IOException {
        byte[] png = tempPdfViewService.renderPageByFileName( fileName, page, dpi );
        return ResponseEntity.ok().headers( tempPdfViewService.pngResponseHeaders() ).body( png );
    }

    // temp 폴더 내 PDF 파일의 전체 페이지를 PNG 이미지 배열로 반환한다.
    @GetMapping("/temp/pdfs/all-pages")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTempPdfAllPages( @RequestParam String fileName, @RequestParam(defaultValue = "150") int dpi ) throws IOException {
        if (fileName == null || fileName.isBlank()) {
            return ApiResponse.error( org.springframework.http.HttpStatus.BAD_REQUEST, "fileName이 필요합니다.", null );
        }
        List<byte[]> pngList = tempPdfViewService.renderAllPagesByFileName( fileName.trim(), dpi );
        List<String> base64List = pngList.stream().map( Base64.getEncoder()::encodeToString ).toList();
        Map<String, Object> data = Map.of( JSON_KEY_TOTAL_PAGES, base64List.size(), JSON_KEY_PAGES, base64List );
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "전체 페이지 조회 성공", data );
    }
}
