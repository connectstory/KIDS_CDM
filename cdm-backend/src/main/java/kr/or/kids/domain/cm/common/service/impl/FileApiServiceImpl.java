package kr.or.kids.domain.cm.common.service.impl;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import kr.or.kids.domain.cm.common.service.FileApiService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@Profile("!local")
@SuppressWarnings({ "rawtypes", "unchecked" })
public class FileApiServiceImpl implements FileApiService {

    private static final String JSON_KEY_ATCH_FILE_GROUP_ID = "atchFileGroupId";

    private final RestTemplate restTemplate;

    @Value("${ca.api-url}")
    private String caApiUrl;

    public FileApiServiceImpl() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout( 5_000 ); // 연결 timeout 5초
        factory.setReadTimeout( 30_000 ); // 읽기 timeout 30초
        this.restTemplate = new RestTemplate( factory );
    }

    private void requireCaApiUrl() {
        if (caApiUrl == null || caApiUrl.isBlank()) {
            throw new IllegalStateException( "ca.api-url 설정이 필요합니다." );
        }
    }

    private static Map<?, ?> mapOrNull( Object o ) {
        return o instanceof Map<?, ?> m ? m : null;
    }

    private static List<Map<String, Object>> copyMapList( List<?> rawList ) {
        List<Map<String, Object>> out = new ArrayList<>( rawList.size() );
        for (Object o : rawList) {
            if (o instanceof Map<?, ?> m) {
                out.add( (Map<String, Object>) m );
            }
        }
        return out;
    }

    @Override
    public String groupInsert( String rgtrId ) {
        requireCaApiUrl();
        if (rgtrId == null || rgtrId.isBlank()) {
            throw new IllegalArgumentException( "등록자 ID가 필요합니다." );
        }
        try {
            Map<String, Object> request = new HashMap<>();
            request.put( "taskSeCd", "cm" );
            request.put( "menuSn", 1 );
            request.put( "taskSeTrgtId", null );
            request.put( "rgtrId", rgtrId );
            request.put( "mdfrId", rgtrId );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType( MediaType.APPLICATION_JSON );
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>( request, headers );
            ResponseEntity<Map> response = restTemplate.postForEntity( caApiUrl + "/api/ca/file/groupData", entity, Map.class );

            if (response != null && response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<?, ?> data = mapOrNull( response.getBody().get( "data" ) );
                Object groupIdVal = data != null ? data.get( JSON_KEY_ATCH_FILE_GROUP_ID ) : null;
                if (groupIdVal != null && !String.valueOf( groupIdVal ).isBlank()) {
                    request.put( JSON_KEY_ATCH_FILE_GROUP_ID, groupIdVal );
                    restTemplate.postForEntity( caApiUrl + "/api/ca/file/groupInsert", entity, Map.class );
                    return String.valueOf( groupIdVal );
                }
            }
            log.warn( "[ca groupInsert] 응답 데이터 없음 또는 비정상 status={}", response != null ? response.getStatusCode() : null );
        } catch (Exception e) {
            log.error( "[ca groupInsert 실패]", e );
        }
        throw new RuntimeException( "파일 그룹 생성 중 오류가 발생했습니다." );
    }

    @Override
    public void uploadFiles( String atchFileGroupId, MultipartFile file, String savePath ) {
        requireCaApiUrl();
        if (file == null || file.isEmpty()) {
            return;
        }
        if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
            throw new IllegalArgumentException( "첨부파일 그룹 ID가 필요합니다." );
        }
        if (savePath == null || savePath.isBlank()) {
            throw new IllegalArgumentException( "저장 경로(savePath)가 필요합니다." );
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType( MediaType.MULTIPART_FORM_DATA );

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add( JSON_KEY_ATCH_FILE_GROUP_ID, atchFileGroupId );
            body.add( "savePath", savePath );
            body.add( "prvcInclYn", "0" );
            body.add( "isExcel", "0" );

            ByteArrayResource resource = new ByteArrayResource( file.getBytes() ) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
            body.add( "uploadFiles", resource );

            HttpEntity<MultiValueMap<String, Object>> entity = new HttpEntity<>( body, headers );

            ResponseEntity<Map> response = restTemplate.postForEntity( caApiUrl + "/api/ca/file/uploadFiles", entity, Map.class );

            if (response != null && response.getStatusCode() == HttpStatus.OK) {
                return;
            }
            log.warn( "[ca uploadFiles] non-OK atchFileGroupId={}, status={}", atchFileGroupId, response != null ? response.getStatusCode() : null );
        } catch (Exception e) {
            log.error( "[ca uploadFiles 실패] atchFileGroupId={}", atchFileGroupId, e );
        }
        throw new RuntimeException( "파일 업로드 중 오류가 발생했습니다." );
    }

    @Override
    public List<Map<String, Object>> getFileList( String atchFileGroupId ) {
        requireCaApiUrl();
        if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
            return List.of();
        }
        try {
            Map<String, Object> request = new HashMap<>();
            request.put( JSON_KEY_ATCH_FILE_GROUP_ID, atchFileGroupId );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType( MediaType.APPLICATION_JSON );
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>( request, headers );

            ResponseEntity<Map> response = restTemplate.postForEntity( caApiUrl + "/api/ca/file/list", entity, Map.class );

            if (response != null && response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<?, ?> data = mapOrNull( response.getBody().get( "data" ) );
                Object listObj = data != null ? data.get( "list" ) : null;
                if (listObj instanceof List<?> rawList) {
                    return copyMapList( rawList );
                }
            }
            return List.of();
        } catch (Exception e) {
            log.error( "[ca getFileList 실패] atchFileGroupId={}", atchFileGroupId, e );
            throw new RuntimeException( "파일 목록 조회 중 오류가 발생했습니다." );
        }
    }

    @Override
    public ResponseEntity<byte[]> downloadFile( String srvrFileNm ) {
        requireCaApiUrl();
        if (srvrFileNm == null || srvrFileNm.isBlank()) {
            return ResponseEntity.status( HttpStatus.BAD_REQUEST ).body( null );
        }
        try {
            URI uri = UriComponentsBuilder.fromUriString( caApiUrl + "/api/ca/file/downloadStream" ).queryParam( "filename", srvrFileNm ).encode( StandardCharsets.UTF_8 ).build().toUri();
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<Void> entity = new HttpEntity<>( headers );

            ResponseEntity<byte[]> response = restTemplate.exchange( uri, HttpMethod.GET, entity, byte[].class );
            if (response == null) {
                return ResponseEntity.status( HttpStatus.INTERNAL_SERVER_ERROR ).body( null );
            }
            return response;
        } catch (Exception e) {
            log.error( "[ca downloadFile 실패]", e );
            throw new RuntimeException( "파일 다운로드 중 오류가 발생했습니다." );
        }
    }

    @Override
    public void deleteFileOne( String atchFileId, String atchFileGroupId ) {
        requireCaApiUrl();
        if (atchFileId == null || atchFileId.isBlank()) {
            throw new IllegalArgumentException( "첨부파일 ID가 필요합니다." );
        }
        if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
            throw new IllegalArgumentException( "첨부파일 그룹 ID가 필요합니다." );
        }
        try {
            Map<String, Object> request = new HashMap<>();
            request.put( "atchFileId", atchFileId );
            request.put( JSON_KEY_ATCH_FILE_GROUP_ID, atchFileGroupId );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType( MediaType.APPLICATION_JSON );
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>( request, headers );

            restTemplate.postForEntity( caApiUrl + "/api/ca/file/deleteFileOne", entity, Map.class );
        } catch (Exception e) {
            log.error( "[ca deleteFileOne 실패] atchFileId={}", atchFileId, e );
            throw new RuntimeException( "파일 삭제 중 오류가 발생했습니다." );
        }
    }

    @Override
    public void deleteGroupFiles( String atchFileGroupId ) {
        requireCaApiUrl();
        if (atchFileGroupId == null || atchFileGroupId.isBlank()) {
            return;
        }
        try {
            Map<String, Object> request = new HashMap<>();
            request.put( JSON_KEY_ATCH_FILE_GROUP_ID, atchFileGroupId );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType( MediaType.APPLICATION_JSON );
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>( request, headers );

            restTemplate.postForEntity( caApiUrl + "/api/ca/file/deleteGroupFiles", entity, Map.class );
        } catch (Exception e) {
            log.error( "[ca deleteGroupFiles 실패] atchFileGroupId={}", atchFileGroupId, e );
            throw new RuntimeException( "파일 그룹 삭제 중 오류가 발생했습니다." );
        }
    }
}
