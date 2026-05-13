// package kr.or.kids.domain.cm.upload.controller;

// import java.io.IOException;
// import java.nio.file.AccessDeniedException;
// import java.nio.file.Files;
// import java.nio.file.Path;
// import java.nio.file.Paths;
// import java.util.List;
// import java.util.Locale;
// import java.util.Set;
// import java.util.UUID;

// import kr.or.kids.global.common.CustomUserDetails;
// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.http.HttpStatus;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.core.annotation.AuthenticationPrincipal;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;
// import org.springframework.web.multipart.MultipartFile;

// import kr.or.kids.domain.cm.common.vo.UserVO;
// import kr.or.kids.domain.cm.common.dto.ApiResponse;
// import kr.or.kids.domain.cm.common.service.CaFileUploadService;
// import kr.or.kids.domain.cm.upload.service.DisclosureService;
// import kr.or.kids.domain.cm.upload.util.UploadAuthUtil;

// import lombok.RequiredArgsConstructor;

// /**
//  * 업로드 관련 API 요청을 처리한다.
//  *
//  * <pre>
//  * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
//  * </pre>
//  */
// @RestController
// @RequestMapping("/disclosures")
// @RequiredArgsConstructor
// public class FileUploadController {

//     private final CaFileUploadService caFileUploadService;
//     private final DisclosureService disclosureService;

//     private static final String ULD_TASK_SE_CD_DISCLOSURE = "04";

    
//     @Value("${app.upload.csv-tmp:/data/tmp/csv}")
//     private String csvTmpDir;

//     private static final Set<String> CSV_TMP_EXTENSIONS = Set.of( ".csv", ".tsv" );

//     /**
//      * uploadCsvToTmp 처리를 수행한다.
//      *
//      * @param du du
//      * @param pblntSn pblntSn
//      * @param files files
//      * @param ptcpInstSn ptcpInstSn
//      * @param fileSeCd fileSeCd
//      * @return 처리 결과
//      */
//     @PostMapping("/files/csv-tmp")
//     public ResponseEntity<ApiResponse<List<CsvTmpUploadResult>>> uploadCsvToTmp(
//         @AuthenticationPrincipal CustomUserDetails du,
//         @RequestParam("pblntSn") Long pblntSn,
//         @RequestParam("files") List<MultipartFile> files,
//         @RequestParam(value = "ptcpInstSn", required = false) String ptcpInstSn,
//         @RequestParam(value = "fileSeCd", required = false, defaultValue = "09") String fileSeCd
//     ) {
//         try {
//             if (du == null) {
//                 return ApiResponse.error( HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.", null );
//             }

//             UserVO user = UploadAuthUtil.toUserVO( du );
//             String userId = user != null && user.getNi() != null ? user.getNi() : (du != null ? du.getMbrId() : "SYSTEM");

//             ResponseEntity<ApiResponse<List<CsvTmpUploadResult>>> validationError = validateCsvTmpRequest( files );
//             if (validationError != null) {
//                 return validationError;
//             }

//             Long ptcpInstSnLong = parseOptionalPtcpInstSn( ptcpInstSn );
//             requireDisclosureInProgressForPartnerCsvIfNeeded( pblntSn, ptcpInstSnLong );

//             Path root = Paths.get( csvTmpDir ).toAbsolutePath().normalize();
//             try {
//                 Files.createDirectories( root );
//             } catch ( IOException e ) {
//                 return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, csvTmpWriteDeniedUserMessage( root, e ) );
//             }

//             if ( !Files.isWritable( root ) ) {
//                 return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, csvTmpNotWritableUserMessage( root ) );
//             }

//             MultipartFile file = files.get( 0 );
//             if (file == null || file.isEmpty()) {
//                 return ApiResponse.error( HttpStatus.BAD_REQUEST, "유효한 파일이 없습니다." );
//             }

//             CsvTmpUploadResult saved = saveCsvTmpFile( file, root, pblntSn, ptcpInstSnLong, userId, fileSeCd );

//             return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "CSV 임시 저장 성공", List.of( saved ) );
//         } catch (IllegalStateException e) {

//             return ApiResponse.error( HttpStatus.BAD_REQUEST, "요청을 처리할 수 없습니다." );
//         } catch (IOException e) {
//             Path root = Paths.get( csvTmpDir ).toAbsolutePath().normalize();
//             return ApiResponse.error( HttpStatus.INTERNAL_SERVER_ERROR, csvTmpWriteDeniedUserMessage( root, e ) );
//         }
//     }

//     private static boolean isLikelyPermissionDenied( IOException e ) {
//         for ( Throwable t = e; t != null; t = t.getCause() ) {
//             if ( t instanceof AccessDeniedException ) {
//                 return true;
//             }
//         }
//         return false;
//     }

//     private static String csvTmpNotWritableUserMessage( Path absoluteRoot ) {
//         return "CDM CSV 임시 저장 경로에 쓸 수 없습니다. 경로: "
//                 + absoluteRoot
//                 + " — 서버에서 해당 폴더에 쓰기 권한이 없습니다. app.upload.csv-tmp 및 서버·컨테이너 볼륨 권한을 확인하세요.";
//     }

//     private static String csvTmpWriteDeniedUserMessage( Path absoluteRoot, IOException e ) {
//         if ( isLikelyPermissionDenied( e ) ) {
//             return csvTmpNotWritableUserMessage( absoluteRoot );
//         }
//         return "CSV 임시 저장에 실패했습니다. 경로: "
//                 + absoluteRoot
//                 + " — 서버 로그를 확인하고 app.upload.csv-tmp 및 서버·컨테이너 볼륨 권한을 점검하세요.";
//     }

//     private static ResponseEntity<ApiResponse<List<CsvTmpUploadResult>>> validateCsvTmpRequest( List<MultipartFile> files ) {
//         if (files == null || files.isEmpty()) {
//             return ApiResponse.error( HttpStatus.BAD_REQUEST, "업로드할 파일이 없습니다." );
//         }
//         if (files.size() != 1) {
//             return ApiResponse.error( HttpStatus.BAD_REQUEST, "CSV 임시 업로드는 파일 1개만 가능합니다." );
//         }
//         return null;
//     }

//     private Long parseOptionalPtcpInstSn( String ptcpInstSn ) {
//         if (ptcpInstSn == null || ptcpInstSn.trim().isEmpty()) {
//             return null;
//         }
//         try {
//             return Long.parseLong( ptcpInstSn.trim() );
//         } catch (NumberFormatException e) {

//             return null;
//         }
//     }

//     private void requireDisclosureInProgressForPartnerCsvIfNeeded( Long pblntSn, Long ptcpInstSnLong ) {
//         if (ptcpInstSnLong == null) {
//             return;
//         }
//             disclosureService.requireDisclosureInProgressForPartnerActions( pblntSn );
//     }

//     private CsvTmpUploadResult saveCsvTmpFile( MultipartFile file, Path root, Long pblntSn, Long ptcpInstSnLong, String userId, String fileSeCd ) throws IOException {
//         String originalFilename = file.getOriginalFilename();
//         if (originalFilename == null || originalFilename.isBlank()) {
//             originalFilename = "unnamed.csv";
//         }
//         originalFilename = originalFilename.replace( "\\", "/" );
//         if (originalFilename.contains( "/" )) {
//             originalFilename = originalFilename.substring( originalFilename.lastIndexOf( "/" ) + 1 );
//         }
//         String ext = "";
//         int lastDot = originalFilename.lastIndexOf( '.' );
//         if (lastDot > 0 && lastDot < originalFilename.length() - 1) {
//             ext = originalFilename.substring( lastDot ).toLowerCase( Locale.ROOT );
//         }
//         if (!CSV_TMP_EXTENSIONS.contains( ext )) {

//             throw new IllegalStateException( "CSV 업로드할 수 있습니다 (.csv). 파일: " + originalFilename );
//         }

//         String storedFilename;
//         Path target;
//         do {
//             storedFilename = UUID.randomUUID().toString() + ext;
//             target = root.resolve( storedFilename ).normalize();
//         } while (Files.exists( target ));

//         if (!target.startsWith( root )) {
//             throw new IllegalStateException( "잘못된 저장 경로입니다." );
//         }
//         file.transferTo( target.toFile() );
//         caFileUploadService.insertFileUldOnly(
//                 pblntSn,
//                 ptcpInstSnLong,
//                 userId,
//                 storedFilename,
//                 ULD_TASK_SE_CD_DISCLOSURE,
//                 fileSeCd );
//         return new CsvTmpUploadResult( originalFilename, storedFilename, target.toString(), storedFilename );
//     }

//     /**
//      * CsvTmpUploadResult 처리를 수행한다.
//      *
//      * @param originalFilename originalFilename
//      * @param storedFilename storedFilename
//      * @param absolutePath absolutePath
//      * @param atchFileGroupId atchFileGroupId
//      * @return 처리 결과
//      */
//     public record CsvTmpUploadResult( String originalFilename, String storedFilename, String absolutePath, String atchFileGroupId ) {
//     }

// }
