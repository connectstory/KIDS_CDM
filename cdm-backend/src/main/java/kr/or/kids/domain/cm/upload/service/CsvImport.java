package kr.or.kids.domain.cm.upload.service;

import java.nio.file.Path;

/**
 * 업로드 도메인 서비스 계약을 정의한다.
 */
public interface CsvImport {
    /**
     * importCsv 처리를 수행한다.
     *
     * @param csvPath csvPath
     * @param tableName tableName
     * @param field field
     * @return 처리 결과
     */
    long importCsv(Path csvPath, String tableName, String field) throws Exception;
}
