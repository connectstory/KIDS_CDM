package kr.or.kids.domain.cm.upload.model;

import lombok.Data;

/**
 * 업로드 검증 모델 데이터를 표현한다.
 */
@Data
public class RuleAccuracyRow {
    private Integer ruleId;
    private Integer level;
    private String srcTable;
    private String field;
    private String rule;
    private String ref;
    private String refTable;
    private String refKey;
    private String refField;
    private String vacabularyId;
    private String vocabularyId;
    private String fieldValue;
    private String unit;
    private String rangeorder;
    private String threashold;
    private String note1;
    private String not2;
    private String note3;
}

