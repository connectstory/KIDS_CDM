package kr.or.kids.domain.cm.community.file.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.service.FileDownloadService;
import lombok.RequiredArgsConstructor;

/**
 * <pre>
 * 커뮤니티 첨부파일 다운로드 컨트롤러
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 * <pre>
 * since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 * </pre>
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/community/file")
public class CommunityFileController {

    private final FileDownloadService fileDownloadService;

    /**
     * 첨부파일을 다운로드한다.
     *
     * <pre>
     * - 파일 식별자(atchFileId)를 기준으로 물리 파일 다운로드 수행
     * - 프록시 경유용: axios 인터셉터가 /community/** 경로를 CDM 서버로 라우팅 처리
     * </pre>
     *
     * @param atchFileId 첨부파일 식별자 (UUID 형식)
     * @return 파일 리소스 스트림을 포함한 ResponseEntity
     * @throws Exception 파일 다운로드 중 발생할 수 있는 일반 예외
     */
    @SuppressWarnings("rawtypes")
    @GetMapping("/download/{atchFileId}")
    public ResponseEntity downloadFile(@PathVariable String atchFileId) throws Exception {
        return fileDownloadService.download(atchFileId);
    }
}