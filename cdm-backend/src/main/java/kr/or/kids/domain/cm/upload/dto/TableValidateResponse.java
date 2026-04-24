package kr.or.kids.domain.cm.upload.dto;

import java.util.List;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record TableValidateResponse(
        boolean status,
        String tableName,
        List<String> notIncludeFieldName, 
        List<String> includeFieldName, 
        List<String> referenceFieldName     
) {}