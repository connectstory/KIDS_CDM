package kr.or.kids.domain.cm.upload.model;

import lombok.Data;

/**
 * 업로드 검증 모델 데이터를 표현한다.
 */
@Data
public class RuleValidityRow {
    private Integer ruleId;
    private Integer level;
    private String srcTable;
    private String field;
    private String rule;
    private String ref;
    private String refDetail;
}

