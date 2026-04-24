package kr.or.kids.domain.cm.upload.util;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * CDM CSV 검증 등에서 디스크상 CSV 경로를 해석한다.
 * <p>
 * 공시 CDM 임시 업로드({@code POST /disclosures/files/csv-tmp})와 동일하게
 * {@code app.upload.csv-tmp} 디렉터리 바로 아래 {@code storedName} 파일만 사용한다.
 * (예: {@code /data/tmp/csv/uuid.csv})
 * </p>
 */
@Component
@RequiredArgsConstructor
public class UploadCsvPathResolver {

    private final AttachmentCsvPathResolver attachmentCsvPathResolver;

    @Value( "${app.upload.csv-tmp:}" )
    private String appUploadCsvTmp;

    /**
     * resolveCsvPath 처리를 수행한다.
     *
     * @param tableName 테이블 슬롯(로그용, 경로에는 사용하지 않음)
     * @param storedName 저장 파일명 (csv-tmp 업로드 시 UUID 기반 파일명)
     * @return 예상 절대 경로 (파일이 없어도 csv-tmp 기준 경로를 반환해 호출부에서 오류 메시지에 쓸 수 있게 함)
     */
    public Path resolveCsvPath( String tableName, String storedName ) {
        if ( storedName == null || storedName.isBlank() ) {
            throw new IllegalArgumentException( "storedName is required" );
        }
        String sn = storedName.trim();

        if ( appUploadCsvTmp == null || appUploadCsvTmp.isBlank() ) {
            Path fromAttachment = attachmentCsvPathResolver.resolveAttachmentCsvPath( sn );
            if ( fromAttachment != null ) {
                return fromAttachment;
            }
            throw new IllegalStateException(
                    "app.upload.csv-tmp 가 설정되어 있지 않고, 첨부 경로에서도 파일을 찾을 수 없습니다. storedName=" + sn );
        }

        Path root = Paths.get( appUploadCsvTmp.trim() ).toAbsolutePath().normalize();
        Path direct = root.resolve( sn ).normalize();
        if ( !direct.startsWith( root ) ) {
            throw new IllegalArgumentException( "storedName 이 디렉터리 밖을 가리킵니다. storedName=" + sn );
        }

        if ( Files.isRegularFile( direct ) ) {
            return direct;
        }

        Path fromAttachment = attachmentCsvPathResolver.resolveAttachmentCsvPath( sn );
        if ( fromAttachment != null && Files.isRegularFile( fromAttachment ) ) {
            return fromAttachment;
        }

        return direct;
    }
}
