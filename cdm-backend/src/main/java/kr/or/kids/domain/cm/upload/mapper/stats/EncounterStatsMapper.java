package kr.or.kids.domain.cm.upload.mapper.stats;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 업로드 도메인 데이터 접근을 정의한다.
 */
@Mapper
public interface EncounterStatsMapper {
    /**
     * 대상 건수를 반환한다.
     *
     * @param schema schema
     * @return 처리 결과
     */
    long count(@Param("schema") String schema);

    /**
     * 대상 건수를 반환한다.
     *
     * @param schema schema
     * @return 처리 결과
     */
    List<Map<String, Object>> countByYearAndMonth(@Param("schema") String schema);
}

