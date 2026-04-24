package kr.or.kids.domain.cm.upload.dto;

import java.util.HashMap;
import java.util.Map;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public class UniquenessResult extends UploadAnalysisResult {
    public Map<String, Double> errors;

    /**
     * UniquenessResult 처리를 수행한다.
     */
    public UniquenessResult() {
        errors = new HashMap<>();
    }
}
