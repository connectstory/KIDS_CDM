package kr.or.kids.global.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.PosixFileAttributes;
import java.nio.file.attribute.PosixFilePermission;
import java.util.EnumSet;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * app.upload / file.storePath 등 업로드 관련 디렉터리 접근 가능 여부를 기동 시 점검한다.
 * 접근 불가 시 원인 파악에 필요한 정보를 한 줄 로그로 남긴다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AppUploadPathAccessibilityListener implements ApplicationListener<ApplicationReadyEvent> {

    private final FileProperties fileProperties;
    private final FileUploadProperties fileUploadProperties;

    @Value( "${app.upload.root:}" )
    private String appUploadRoot;

    @Value( "${app.upload.csv-tmp:}" )
    private String appUploadCsvTmp;

    @Override
    public void onApplicationEvent( @NonNull ApplicationReadyEvent event ) {
        log.info( "[업로드경로] 디렉터리 접근 점검 시작" );
        checkPath( "app.upload.root", appUploadRoot, true );
        checkPath( "app.upload.csv-tmp", appUploadCsvTmp, true );
        checkPath( "file.storePath", fileProperties != null ? fileProperties.getStorePath() : null, true );
        checkPath( "file.upload.base-path", fileUploadProperties != null ? fileUploadProperties.getUploadPath() : null, true );
    }

    private void checkPath( String propertyKey, String raw, boolean requireWrite ) {
        if ( raw == null || raw.isBlank() ) {
            return;
        }

        final Path path;
        try {
            path = Paths.get( raw.trim() ).toAbsolutePath().normalize();
        } catch ( InvalidPathException e ) {
            log.error(
                    "[업로드경로] 경로 문자열이 유효하지 않음 — property={} raw={} ({})",
                    propertyKey, raw, e.getMessage(), e );
            return;
        }

        try {
            if ( Files.notExists( path, LinkOption.NOFOLLOW_LINKS ) ) {
                log.error(
                        "[업로드경로] 경로 없음 — property={} absolutePath={} | 대응: 볼륨 마운트·mkdir·배포 스크립트에서 디렉터리 생성, 또는 프로세스 실행 사용자 권한 확인",
                        propertyKey, path );
                return;
            }

            if ( !Files.isDirectory( path ) ) {
                log.error(
                        "[업로드경로] 디렉터리가 아님(파일 등) — property={} absolutePath={} | 대응: 해당 경로를 제거하거나 디렉터리로 교체",
                        propertyKey, path );
                return;
            }

            boolean readable = Files.isReadable( path );
            boolean writable = Files.isWritable( path );
            String posixHint = posixPermissionHint( path );

            if ( !readable ) {
                log.error(
                        "[업로드경로] 읽기 불가 — property={} absolutePath={} posix={} | 대응: chmod/chown 또는 컨테이너 securityContext·볼륨 권한",
                        propertyKey, path, posixHint );
            }
            if ( requireWrite && !writable ) {
                log.error(
                        "[업로드경로] 쓰기 불가 — property={} absolutePath={} posix={} | 대응: 읽기전용 마운트(ro)·SELinux·권한 부족 가능",
                        propertyKey, path, posixHint );
                if ( "app.upload.csv-tmp".equals( propertyKey ) ) {
                    log.error(
                            "[CSV csv-tmp] CDM 임시 업로드(/disclosures/files/csv-tmp)가 실패합니다. 위 경로에 프로세스 쓰기 권한이 없습니다. app.upload.csv-tmp·볼륨·chmod를 확인하세요. absolutePath={}",
                            path );
                }
            }

            if ( readable && ( !requireWrite || writable ) ) {
                log.info( "[업로드경로] 정상 — property={} absolutePath={} readable=true writable={} posix={}",
                        propertyKey, path, writable, posixHint );
            }
        } catch ( SecurityException e ) {
            log.error(
                    "[업로드경로] 보안 정책으로 접근 불가 — property={} absolutePath={} 사유={} ({}) | 대응: JVM/OS 보안 설정·실행 사용자 확인",
                    propertyKey, path, e.getClass().getSimpleName(), e.getMessage(), e );
        }
    }

    /** POSIX 환경에서 권한 힌트; 비 POSIX 등은 타입명만 담은 fallback 문자열 */
    private static String posixPermissionHint( Path path ) {
        try {
            PosixFileAttributes attrs = Files.readAttributes( path, PosixFileAttributes.class, LinkOption.NOFOLLOW_LINKS );
            Set<PosixFilePermission> perms = attrs.permissions();
            EnumSet<PosixFilePermission> copy = EnumSet.copyOf( perms );
            return "owner=" + attrs.owner().getName() + " group=" + attrs.group().getName() + " mode=" + copy;
        } catch ( IOException | UnsupportedOperationException | SecurityException e ) {
            return "nonPosixOrUnavailable(" + e.getClass().getSimpleName() + ")";
        }
    }
}
