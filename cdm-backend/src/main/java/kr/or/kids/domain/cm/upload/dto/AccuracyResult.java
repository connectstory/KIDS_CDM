package kr.or.kids.domain.cm.upload.dto;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public class AccuracyResult extends UploadAnalysisResult {
    public Map<String, Double> errors;

    /**
     * AccuracyResult 처리를 수행한다.
     */
    public AccuracyResult() {
        errors = new LinkedHashMap<>();
    }
}
