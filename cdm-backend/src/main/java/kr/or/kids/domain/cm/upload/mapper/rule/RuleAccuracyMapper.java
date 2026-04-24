package kr.or.kids.domain.cm.upload.mapper.rule;

import kr.or.kids.domain.cm.upload.model.RuleAccuracyRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 업로드 도메인 데이터 접근을 정의한다.
 */
@Mapper
public interface RuleAccuracyMapper {
    /**
     * 대상 데이터를 조회한다.
     *
     * @param schema schema
     * @param table table
     * @param rule rule
     * @return 처리 결과
     */
    List<RuleAccuracyRow> findByTableAndRule(@Param("schema") String schema, @Param("table") String table, @Param("rule") String rule);
}

