package kr.or.kids.domain.cm.upload.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public class RuleConsistencyResult extends UploadAnalysisResult {
    public List<String> missingFields;      
    public List<String> matchedFields;      
    public List<String> referenceFields;    
    public Map<String, Integer> errors;
    
    public Map<Integer, Long> fieldNameRuleErrors;

    /**
     * RuleConsistencyResult 처리를 수행한다.
     */
    public RuleConsistencyResult() {
        missingFields = new ArrayList<>();
        matchedFields = new ArrayList<>();
        referenceFields = new ArrayList<>();
        errors = new LinkedHashMap<>();
        fieldNameRuleErrors = new LinkedHashMap<>();
    }

    /**
     * calculationFieldTypeRate 처리를 수행한다.
     *
     * @param fieldCount fieldCount
     * @return 처리 결과
     */
    public double calculationFieldTypeRate(int fieldCount) {
        status = totalErrorCount <= 0;

        double standardCount = fieldCount - totalErrorCount;
        if (0 == standardCount) {
            analysisRate = 0D;
            return analysisRate;
        }

        analysisRate = standardCount / fieldCount;
        return analysisRate;
    }
}