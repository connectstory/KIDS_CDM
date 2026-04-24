package kr.or.kids.domain.cm.upload.dto;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public class UploadAnalysisResult {
    public boolean status;
    public String tableName;
    public Long totalRowCount;
    public Long totalErrorCount;
    public Double analysisRate;

    /**
     * UploadAnalysisResult 처리를 수행한다.
     */
    public UploadAnalysisResult() {
        status = false;
        tableName = "";
        totalRowCount = 0L;
        totalErrorCount = 0L;
        analysisRate = 0D;
    }

    /**
     * calculationRate 처리를 수행한다.
     *
     * @return 처리 결과
     */
    public double calculationRate() {
        status = totalErrorCount <= 0;

        double standardCount = totalRowCount - totalErrorCount;
        if (0 == standardCount) {
            analysisRate = 0D;
            return analysisRate;
        }

        analysisRate = standardCount / totalRowCount;
        return analysisRate;
    }
}
