package kr.or.kids.domain.cm.upload.dto;

import java.util.List;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record CommitRequest(
        double threshold,
        List<AnalysisRequest> tables,
        Boolean append
) {
    /**
     * CommitRequest 처리를 수행한다.
     *
     * @param threshold threshold
     * @param tables tables
     */
    public CommitRequest(double threshold, List<AnalysisRequest> tables) {
        this(threshold, tables, false);
    }
}

