package kr.or.kids.domain.cm.upload.service;

import java.util.Map;

/**
 * 업로드 도메인 서비스 계약을 정의한다.
 */
public interface PlotService {

    /**
     * 조회 결과를 반환한다.
     *
     * @param plotId plotId
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param minLevels minLevels
     * @return 처리 결과
     */
    Map<String, Object> getPlotData(
            int plotId,
            Long instTaskSn,
            Integer conceptId,
            boolean includeDescendant,
            Integer minLevels);

    /**
     * 조회 결과를 반환한다.
     *
     * @param conceptId conceptId
     * @return 처리 결과
     */
    Map<String, Object> getConceptName(Integer conceptId);
}
