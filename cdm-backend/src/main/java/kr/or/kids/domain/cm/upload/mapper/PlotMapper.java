package kr.or.kids.domain.cm.upload.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.upload.config.PlotVocabularySql;

/**
 * 업로드 도메인 데이터 접근을 정의한다.
 */
@Mapper
public interface PlotMapper {

    /**
     * 대상 건수를 반환한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    Long countAllPatients(@Param("instTaskSn") Long instTaskSn);

    /**
     * genderDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    List<Map<String, Object>> genderDistribution(@Param("instTaskSn") Long instTaskSn);

    /**
     * ageDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    List<Map<String, Object>> ageDistribution(@Param("instTaskSn") Long instTaskSn);

    /**
     * visitTimeSeries 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    List<Map<String, Object>> visitTimeSeries(@Param("instTaskSn") Long instTaskSn);

    /**
     * visitTypeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param plotVocab plotVocab
     * @return 처리 결과
     */
    List<Map<String, Object>> visitTypeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("plotVocab") PlotVocabularySql plotVocab);

    /**
     * conditionGenderDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> conditionGenderDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * conditionAgeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> conditionAgeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * conditionVisitTimeSeries 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> conditionVisitTimeSeries(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * conditionVisitTypeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> conditionVisitTypeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * drugGenderDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> drugGenderDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * drugAgeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> drugAgeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * drugVisitTimeSeries 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> drugVisitTimeSeries(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * drugVisitTypeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> drugVisitTypeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * procedureGenderDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> procedureGenderDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * procedureAgeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> procedureAgeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * procedureVisitTimeSeries 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> procedureVisitTimeSeries(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * procedureVisitTypeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> procedureVisitTypeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * measurementGenderDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> measurementGenderDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * measurementAgeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> measurementAgeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * measurementVisitTimeSeries 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> measurementVisitTimeSeries(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * measurementVisitTypeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> measurementVisitTypeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * observationGenderDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> observationGenderDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * observationAgeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> observationAgeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * observationVisitTimeSeries 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> observationVisitTimeSeries(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    /**
     * observationVisitTypeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @param conceptId conceptId
     * @param includeDescendant includeDescendant
     * @param plotVocab plotVocab
     * @param domainId domainId
     * @param minLevels minLevels
     * @return 처리 결과
     */
    List<Map<String, Object>> observationVisitTypeDistribution(
            @Param("instTaskSn") Long instTaskSn,
            @Param("conceptId") Integer conceptId,
            @Param("includeDescendant") boolean includeDescendant,
            @Param("plotVocab") PlotVocabularySql plotVocab,
            @Param("domainId") String domainId,
            @Param("minLevels") Integer minLevels);

    
    /**
     * 대상 건수를 반환한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    Long countDeathPatients(@Param("instTaskSn") Long instTaskSn);
    /**
     * deathGenderDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    List<Map<String, Object>> deathGenderDistribution(@Param("instTaskSn") Long instTaskSn);
    /**
     * deathAgeDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    List<Map<String, Object>> deathAgeDistribution(@Param("instTaskSn") Long instTaskSn);
    /**
     * deathYearDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    List<Map<String, Object>> deathYearDistribution(@Param("instTaskSn") Long instTaskSn);

    
    /**
     * 대상 건수를 반환한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    Long countObservationPeriodPatients(@Param("instTaskSn") Long instTaskSn);
    /**
     * observationPeriodYearDistribution 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    List<Map<String, Object>> observationPeriodYearDistribution(@Param("instTaskSn") Long instTaskSn);
    /**
     * observationPeriodAvgDuration 처리를 수행한다.
     *
     * @param instTaskSn instTaskSn
     * @return 처리 결과
     */
    List<Map<String, Object>> observationPeriodAvgDuration(@Param("instTaskSn") Long instTaskSn);

    
    /**
     * 조회 결과를 반환한다.
     *
     * @param conceptId conceptId
     * @param plotVocab plotVocab
     * @return 처리 결과
     */
    String getConceptName(
            @Param("conceptId") Integer conceptId,
            @Param("plotVocab") PlotVocabularySql plotVocab);
}
