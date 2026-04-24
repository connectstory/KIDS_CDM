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

    /**
     * 공통코드 상세 목록을 조회한다.
     *
     * <pre>
     * - 그룹코드(groupCode)에 해당하는 공통코드 목록 반환
     * - 응답은 ApiResponse 구조로 반환
     * </pre>
     *
     * @param groupCode 공통코드 그룹코드
     * @return ApiResponse&lt;List&lt;CommonCodeItem&gt;&gt;
     */
    @GetMapping("/codes/{groupCode}")
    public ResponseEntity<ApiResponse<List<CommonCodeItem>>> getCommonCodes( @PathVariable String groupCode ) {
        List<CommonCodeItem> items = commonCodeMapper.selectByGroupCode( groupCode );
        return ApiResponse.ok( "success", "공통코드 조회 성공", items );
    }

    /**
     * 협력기관 목록을 조회한다.
     *
     * <pre>
     * - CDM 및 연구과제 협력기관 전체 목록 반환
     * - 응답은 ApiResponse 구조로 반환
     * </pre>
     *
     * @param param 검색 조건 (선택, 현재 미사용)
     * @return ApiResponse&lt;List&lt;PartnerResponse&gt;&gt;
     */
    @GetMapping("/partners")
    public ResponseEntity<ApiResponse<List<PartnerResponse>>> getPartners( @RequestParam(required = false) String param ) {
        List<PartnerResponse> partners = partnerService.findAll();
        return ApiResponse.ok( "success", "협력기관 목록 조회 성공", partners );
    }

    /**
     * 분석 DATASET 양식 파일을 다운로드한다.
     *
     * <pre>
     * - classpath: templates/analysis-dataset-template.xlsx
     * - 파일 미존재 시 404 반환
     * </pre>
     *
     * @return 분석 데이터 양식 xlsx 파일
     */
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

    /**
     * VDI 신청서 양식 파일을 다운로드한다.
     *
     * <pre>
     * - classpath: templates/vdi-application-template.hwpx
     * - 파일 미존재 시 404 반환
     * </pre>
     *
     * @return VDI 신청서 양식 hwpx 파일
     */
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

    /**
     * 첨부파일을 다운로드한다.
     *
     * <pre>
     * - 환경(local/dev/prod)별 구현체에 처리 위임
     * - local: 로컬 디스크에서 직접 읽기
     * - dev/prod: ca-api를 통해 파일 스트림 수신
     * </pre>
     *
     * @param atchFileGroupId 첨부파일 그룹 ID
     * @return 파일 콘텐츠
     */
    @GetMapping("/file/download/{atchFileGroupId}")
    public ResponseEntity<Object> downloadFile( @PathVariable String atchFileGroupId ) {
        return fileDownloadService.download( atchFileGroupId );
    }

    /**
     * 저장된 파일의 미리보기 메타 정보를 조회한다.
     *
     * <pre>
     * - PDF: 총 페이지 수(totalPages) 반환
     * - 이미지: isImage=true 반환
     * - 워터마크 미리보기 뷰어에서 사전 호출용
     * </pre>
     *
     * @param atchFileId 첨부파일 ID
     * @return totalPages, isImage 포함 메타 정보
     * @throws IOException 파일 읽기 실패 시
     */
    @GetMapping("/file/preview/{atchFileId}/meta")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFilePreviewMeta( @PathVariable String atchFileId ) throws IOException {
        int totalPages = filePreviewService.getPreviewTotalPages( atchFileId );
        boolean isImage = filePreviewService.isImage( atchFileId );
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "메타 조회 성공", Map.<String, Object> of( JSON_KEY_TOTAL_PAGES, totalPages, "isImage", isImage ) );
    }

    /**
     * 저장된 PDF 파일의 특정 페이지를 PNG 이미지로 반환한다.
     *
     * <pre>
     * - 워터마크 적용 후 PNG 반환
     * - 페이지 미존재 시 404 반환
     * </pre>
     *
     * @param atchFileId 첨부파일 ID
     * @param page       페이지 번호 (0-based)
     * @param dpi        렌더링 DPI (기본값 130)
     * @return 워터마크 적용 PNG 이미지 바이트
     * @throws IOException 파일 읽기 실패 시
     */
    @GetMapping("/file/preview/{atchFileId}/pages/{page}.png")
    public ResponseEntity<byte[]> getFilePreviewPagePng( @PathVariable String atchFileId, @PathVariable int page, @RequestParam(defaultValue = "130") int dpi ) throws IOException {
        byte[] png = filePreviewService.getPreviewPagePng( atchFileId, page, dpi );
        if (png == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().headers( filePreviewService.pngResponseHeaders() ).body( png );
    }

    /**
     * 저장된 이미지 파일을 워터마크 적용 PNG로 반환한다.
     *
     * <pre>
     * - 이미지 파일에 워터마크 적용 후 PNG 변환하여 반환
     * - 파일 미존재 시 404 반환
     * </pre>
     *
     * @param atchFileId 첨부파일 ID
     * @return 워터마크 적용 PNG 이미지 바이트
     * @throws IOException 파일 읽기 실패 시
     */
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

    /**
     * 저장된 파일을 인라인으로 미리보기한다.
     *
     * <pre>
     * - Content-Disposition: inline으로 브라우저에서 직접 열기
     * - 파일 확장자에 따라 Content-Type 자동 결정
     * </pre>
     *
     * @param atchFileId 첨부파일 ID
     * @return 파일 리소스 (inline)
     * @throws IOException 파일 경로 생성 실패 시
     */
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

    /**
     * temp 폴더 내 PDF 파일 목록을 조회한다.
     *
     * <pre>
     * - 확장자 .pdf 파일만 조회
     * - 응답은 ApiResponse 구조로 반환
     * </pre>
     *
     * @return PDF 파일 목록 (파일명, 크기)
     * @throws IOException 디렉토리 읽기 실패 시
     */
    @GetMapping("/temp/pdfs")
    public ResponseEntity<ApiResponse<List<TempPdfListItem>>> listTempPdfs() throws IOException {
        List<TempPdfListItem> list = tempPdfViewService.listPdfs();
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "PDF 목록 조회 성공", list );
    }

    /**
     * temp 폴더 내 PDF 및 이미지 파일 통합 목록을 조회한다.
     *
     * <pre>
     * - 확장자 .pdf, .jpg, .jpeg, .png, .gif, .webp, .bmp 파일 포함
     * - 미리보기 뷰어 파일 선택용
     * - 응답은 ApiResponse 구조로 반환
     * </pre>
     *
     * @return PDF + 이미지 파일 목록 (파일명, 크기)
     * @throws IOException 디렉토리 읽기 실패 시
     */
    @GetMapping("/temp/files")
    public ResponseEntity<ApiResponse<List<TempPdfListItem>>> listTempPdfsAndImages() throws IOException {
        List<TempPdfListItem> list = tempPdfViewService.listPdfsAndImages();
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "파일 목록 조회 성공", list );
    }

    /**
     * temp 폴더 내 파일을 서빙한다.
     *
     * <pre>
     * - 이미지 파일: 워터마크 적용 후 PNG로 반환
     * - PDF 파일: 원본 그대로 반환
     * - 캐시 방지 헤더(no-store, no-cache) 적용
     * - 파일 미존재 시 404 반환
     * </pre>
     *
     * @param fileName temp 폴더 내 파일명
     * @return 파일 콘텐츠 (이미지: PNG, PDF: 원본)
     * @throws IOException 파일 읽기 실패 시
     */
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

    /**
     * temp 폴더 내 PDF 파일의 메타 정보를 조회한다.
     *
     * <pre>
     * - 총 페이지 수(totalPages) 반환
     * - fileName 미입력 시 400 반환
     * - 응답은 ApiResponse 구조로 반환
     * </pre>
     *
     * @param fileName temp 폴더 내 PDF 파일명
     * @return totalPages 포함 메타 정보
     * @throws IOException 파일 읽기 실패 시
     */
    @GetMapping("/temp/pdfs/meta")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getTempPdfMeta( @RequestParam String fileName ) throws IOException {
        if (fileName == null || fileName.isBlank()) {
            return ApiResponse.error( org.springframework.http.HttpStatus.BAD_REQUEST, "fileName이 필요합니다.", null );
        }
        int totalPages = tempPdfViewService.getTotalPages( fileName.trim() );
        return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "메타 조회 성공", Map.of( JSON_KEY_TOTAL_PAGES, totalPages ) );
    }

    /**
     * temp 폴더 내 PDF 파일의 특정 페이지를 PNG 이미지로 반환한다.
     *
     * <pre>
     * - 워터마크 적용 후 PNG 반환
     * - dpi 범위: 72~300 (기본값 150)
     * </pre>
     *
     * @param page     페이지 번호 (0-based)
     * @param fileName temp 폴더 내 PDF 파일명
     * @param dpi      렌더링 DPI (기본값 150)
     * @return 워터마크 적용 PNG 이미지 바이트
     * @throws IOException 파일 읽기 실패 시
     */
    @GetMapping("/temp/pdfs/pages/{page}.png")
    public ResponseEntity<byte[]> getTempPdfPagePng( @PathVariable int page, @RequestParam String fileName, @RequestParam(defaultValue = "150") int dpi ) throws IOException {
        byte[] png = tempPdfViewService.renderPageByFileName( fileName, page, dpi );
        return ResponseEntity.ok().headers( tempPdfViewService.pngResponseHeaders() ).body( png );
    }

    /**
     * temp 폴더 내 PDF 파일의 전체 페이지를 PNG 이미지 배열로 반환한다.
     *
     * <pre>
     * - 전체 페이지를 한 번의 요청으로 조회
     * - 각 페이지는 Base64 인코딩된 PNG 문자열로 반환
     * - dpi 범위: 72~300 (기본값 150)
     * - fileName 미입력 시 400 반환
     * - 응답은 ApiResponse 구조로 반환
     * </pre>
     *
     * @param fileName temp 폴더 내 PDF 파일명
     * @param dpi      렌더링 DPI (기본값 150)
     * @return totalPages, pages(Base64 PNG 배열) 포함 데이터
     * @throws IOException 파일 읽기 실패 시
     */
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
