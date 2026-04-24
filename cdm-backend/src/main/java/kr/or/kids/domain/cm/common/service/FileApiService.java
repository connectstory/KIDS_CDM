package kr.or.kids.domain.cm.common.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.dto.CaFileItem;

/**
 * ca 공통 파일 API 호출 서비스 - ca-be 파일 API를 RestTemplate으로 호출
 */
public interface FileApiService {

    /**
     * 파일 그룹 생성 - ca POST /api/ca/file/groupInsert
     *
     * @return atchFileGroupId
     */
    String groupInsert( String rgtrId );

    /**
     * 파일 업로드 - ca POST /api/ca/file/uploadFiles
     */
    void uploadFiles( String atchFileGroupId, MultipartFile file, String savePath );

    /**
     * 파일 목록 조회 - ca POST /api/ca/file/list
     *
     * @return 파일 목록
     */
    List<Map<String, Object>> getFileList( String atchFileGroupId );

    /**
     * 파일 다운로드 - ca GET /api/ca/file/downloadStream?filename={srvrFileNm}
     *
     * @return 파일 바이트 배열
     */
    ResponseEntity<byte[]> downloadFile( String srvrFileNm );

    /**
     * 파일 단건 삭제 - ca POST /api/ca/file/deleteFileOne
     */
    void deleteFileOne( String atchFileId, String atchFileGroupId );

    /**
     * 파일 그룹 삭제 (보상 처리용) - ca POST /api/ca/file/deleteGroupFiles
     */
    void deleteGroupFiles( String atchFileGroupId );

    /**
     * 파일 목록을 CaFileItem 목록으로 변환
     */
    static List<CaFileItem> toCaFileItemsFromCa( FileApiService fileApiService, String atchFileGroupId ) {
        List<Map<String, Object>> list = fileApiService.getFileList( atchFileGroupId );
        if (list == null || list.isEmpty()) {
            return Collections.emptyList();
        }
        List<CaFileItem> result = new ArrayList<>();
        for (Map<String, Object> m : list) {
            String fileId = getString( m, "atchFileId", "atch_file_id", "fileId", "file_id" );
            String fileNm = getString( m, "fileNm", "file_nm" );
            String extn = getString( m, "fileExtnNm", "file_extn_nm", "ext", "extension" );
            Long size = getLong( m, "fileSz", "file_sz", "size" );
            if (fileId == null || fileNm == null) {
                continue;
            }
            result.add( new CaFileItem( fileId, atchFileGroupId, fileNm, extn, size ) );
        }
        return result;
    }

    static String getString( Map<String, Object> m, String... keys ) {
        for (String k : keys) {
            Object v = m.get( k );
            if (v != null) {
                return v.toString();
            }
        }
        return null;
    }

    static Long getLong( Map<String, Object> m, String... keys ) {
        for (String k : keys) {
            Object v = m.get( k );
            if (v instanceof Number) {
                return ((Number) v).longValue();
            }
            if (v != null) {
                try {
                    return Long.parseLong( v.toString() );
                } catch (NumberFormatException e) {
                    LoggerFactory.getLogger( FileApiService.class ).debug( "Expected long for key '{}' but value was not parseable: {}", k, v, e );
                }
            }
        }
        return null;
    }
}
