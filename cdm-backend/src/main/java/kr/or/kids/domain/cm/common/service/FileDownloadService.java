package kr.or.kids.domain.cm.common.service;

import org.springframework.http.ResponseEntity;

/**
 * 환경(local/dev/prod)에 따라 다른 구현을 사용하는
 * 파일 다운로드 공통 인터페이스.
 */
public interface FileDownloadService {

    /**
     * 첨부파일 ID로 파일을 다운로드한다.
     *
     * @param atchFileId 첨부파일 ID
     * @return 파일 콘텐츠를 담은 ResponseEntity
     */
    ResponseEntity<Object> download(String atchFileId);
}

