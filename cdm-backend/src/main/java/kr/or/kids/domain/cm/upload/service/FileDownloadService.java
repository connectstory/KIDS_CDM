package kr.or.kids.domain.cm.upload.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

/**
 * 업로드 도메인 서비스 계약을 정의한다.
 */
public interface FileDownloadService {

    
    /**
     * downloadFiles 처리를 수행한다.
     *
     * @param files files
     * @param pblntSn pblntSn
     * @return 처리 결과
     */
    List<String> downloadFiles( List<MultipartFile> files, Long pblntSn );

    
    /**
     * 데이터를 삭제한다.
     *
     * @param atchFileSn atchFileSn
     */
    void deleteFile( String atchFileSn );

    
    /**
     * 조회 결과를 반환한다.
     *
     * @return 처리 결과
     */
    String getUploadPath();
}
