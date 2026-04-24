package kr.or.kids.domain.cm.upload.service.impl;

import kr.or.kids.domain.cm.upload.config.PlotVocabularySql;
import kr.or.kids.domain.cm.upload.config.VocabularyConfig;
import kr.or.kids.domain.cm.upload.mapper.PlotMapper;
import kr.or.kids.domain.cm.upload.service.PlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 업로드 도메인 비즈니스 로직을 구현한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class PlotServiceImpl implements PlotService {

    private static final String PLOT_TYPE   = "plotType";
    private static final String PLOT_ID     = "plotId";
    private static final String DATA        = "data";
    private static final String TOTAL_COUNT = "totalCount";

    private static final String TYPE_PIE    = "pie";
    private static final String TYPE_BAR    = "bar";
    private static final String TYPE_LINE   = "line";
    private static final String TYPE_NUMBER = "number";

    
    private static final Map<Integer, String> PLOT_TYPE_MAP = new HashMap<>();
    static {
        PLOT_TYPE_MAP.put(1,  TYPE_NUMBER);
        PLOT_TYPE_MAP.put(2,  TYPE_PIE);
        PLOT_TYPE_MAP.put(3,  TYPE_BAR);
        PLOT_TYPE_MAP.put(4,  TYPE_LINE);
        PLOT_TYPE_MAP.put(5,  TYPE_PIE);
        PLOT_TYPE_MAP.put(6,  TYPE_PIE);
        PLOT_TYPE_MAP.put(7,  TYPE_BAR);
        PLOT_TYPE_MAP.put(8,  TYPE_LINE);
        PLOT_TYPE_MAP.put(9,  TYPE_PIE);
        PLOT_TYPE_MAP.put(10, TYPE_PIE);
        PLOT_TYPE_MAP.put(11, TYPE_BAR);
        PLOT_TYPE_MAP.put(12, TYPE_LINE);
        PLOT_TYPE_MAP.put(13, TYPE_PIE);
        PLOT_TYPE_MAP.put(14, TYPE_PIE);
        PLOT_TYPE_MAP.put(15, TYPE_BAR);
        PLOT_TYPE_MAP.put(16, TYPE_LINE);
        PLOT_TYPE_MAP.put(17, TYPE_PIE);
        PLOT_TYPE_MAP.put(18, TYPE_PIE);
        PLOT_TYPE_MAP.put(19, TYPE_BAR);
        PLOT_TYPE_MAP.put(20, TYPE_LINE);
        PLOT_TYPE_MAP.put(21, TYPE_PIE);
        PLOT_TYPE_MAP.put(22, TYPE_PIE);
        PLOT_TYPE_MAP.put(23, TYPE_BAR);
        PLOT_TYPE_MAP.put(24, TYPE_LINE);
        PLOT_TYPE_MAP.put(25, TYPE_PIE);
        PLOT_TYPE_MAP.put(26, TYPE_NUMBER);
        PLOT_TYPE_MAP.put(27, TYPE_PIE);
        PLOT_TYPE_MAP.put(28, TYPE_BAR);
        PLOT_TYPE_MAP.put(29, TYPE_BAR);
        PLOT_TYPE_MAP.put(30, TYPE_NUMBER);
        PLOT_TYPE_MAP.put(31, TYPE_BAR);
        PLOT_TYPE_MAP.put(32, TYPE_BAR);
    }

    
    private static String resolveDomainId(int plotId) {
        if (plotId >= 6  && plotId <= 9)  return "Condition";
        if (plotId >= 10 && plotId <= 13) return "Drug";
        if (plotId >= 14 && plotId <= 17) return "Procedure";
        if (plotId >= 18 && plotId <= 21) return "Measurement";
        if (plotId >= 22 && plotId <= 25) return "Observation";
        return null;
    }

    
    private static class ConceptParams {
        final Integer conceptId;
        final boolean includeDescendant;
        final PlotVocabularySql plotVocab;
        final String  domainId;
        final Integer minLevels;

        ConceptParams(Integer conceptId, boolean includeDescendant,
                      PlotVocabularySql plotVocab,
                      String domainId, Integer minLevels) {
            this.conceptId         = conceptId;
            this.includeDescendant = includeDescendant;
            this.plotVocab        = plotVocab;
            this.domainId          = domainId;
            this.minLevels         = minLevels;
        }
    }

    private final PlotMapper plotMapper;
    private final VocabularyConfig vocabularyConfig;

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
    @Override
    public Map<String, Object> getPlotData(
            int plotId,
            Long instTaskSn,
            Integer conceptId,
            boolean includeDescendant,
            Integer minLevels) {

        String plotType = PLOT_TYPE_MAP.get(plotId);
        if (plotType == null) {
            throw new IllegalArgumentException("유효하지 않은 plotId: " + plotId);
        }

        PlotVocabularySql plotVocab = vocabularyConfig.plotVocabularySql();

        ConceptParams cp = new ConceptParams(
                conceptId, includeDescendant,
                plotVocab,
                resolveDomainId(plotId), minLevels);

        Map<String, Object> result = new HashMap<>();
        result.put(PLOT_TYPE, plotType);
        result.put(PLOT_ID, plotId);

        if (TYPE_NUMBER.equals(plotType)) {
            result.put(TOTAL_COUNT, fetchCount(plotId, instTaskSn));
        } else {
            result.put(DATA, fetchList(plotId, instTaskSn, cp));
        }

        return result;
    }

    private Long fetchCount(int plotId, Long instTaskSn) {
        if (plotId == 1)  return plotMapper.countAllPatients(instTaskSn);
        if (plotId == 26) return plotMapper.countDeathPatients(instTaskSn);
        if (plotId == 30) return plotMapper.countObservationPeriodPatients(instTaskSn);
        return 0L;
    }

    private List<Map<String, Object>> fetchList(int plotId, Long instTaskSn, ConceptParams cp) {
        switch (plotId) {
            case 2:  return plotMapper.genderDistribution(instTaskSn);
            case 3:  return plotMapper.ageDistribution(instTaskSn);
            case 4:  return plotMapper.visitTimeSeries(instTaskSn);
            case 5:  return plotMapper.visitTypeDistribution(instTaskSn, cp.plotVocab);
            case 6:  return plotMapper.conditionGenderDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 7:  return plotMapper.conditionAgeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 8:  return plotMapper.conditionVisitTimeSeries(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 9:  return plotMapper.conditionVisitTypeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 10: return plotMapper.drugGenderDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 11: return plotMapper.drugAgeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 12: return plotMapper.drugVisitTimeSeries(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 13: return plotMapper.drugVisitTypeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 14: return plotMapper.procedureGenderDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 15: return plotMapper.procedureAgeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 16: return plotMapper.procedureVisitTimeSeries(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 17: return plotMapper.procedureVisitTypeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 18: return plotMapper.measurementGenderDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 19: return plotMapper.measurementAgeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 20: return plotMapper.measurementVisitTimeSeries(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 21: return plotMapper.measurementVisitTypeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 22: return plotMapper.observationGenderDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 23: return plotMapper.observationAgeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 24: return plotMapper.observationVisitTimeSeries(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 25: return plotMapper.observationVisitTypeDistribution(instTaskSn, cp.conceptId, cp.includeDescendant, cp.plotVocab, cp.domainId, cp.minLevels);
            case 27: return plotMapper.deathGenderDistribution(instTaskSn);
            case 28: return plotMapper.deathAgeDistribution(instTaskSn);
            case 29: return plotMapper.deathYearDistribution(instTaskSn);
            case 31: return plotMapper.observationPeriodYearDistribution(instTaskSn);
            case 32: return plotMapper.observationPeriodAvgDuration(instTaskSn);
            default: return List.of();
        }
    }

    /**
     * 조회 결과를 반환한다.
     *
     * @param conceptId conceptId
     * @return 처리 결과
     */
    @Override
    public Map<String, Object> getConceptName(Integer conceptId) {
        PlotVocabularySql plotVocab = vocabularyConfig.plotVocabularySql();
        String conceptName = plotMapper.getConceptName(conceptId, plotVocab);
        Map<String, Object> result = new HashMap<>();
        result.put("conceptId", conceptId);
        result.put("conceptName", conceptName != null ? conceptName : "");
        return result;
    }
}
