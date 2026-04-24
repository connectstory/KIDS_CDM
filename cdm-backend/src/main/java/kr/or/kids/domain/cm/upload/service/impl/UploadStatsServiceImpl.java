package kr.or.kids.domain.cm.upload.service.impl;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.common.vo.UserVO;
import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.domain.cm.upload.service.DisclosurePartnerService;
import kr.or.kids.domain.cm.upload.service.UploadStatsService;
import lombok.RequiredArgsConstructor;

/**
 * 업로드 도메인 비즈니스 로직을 구현한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@Service
@RequiredArgsConstructor
public class UploadStatsServiceImpl implements UploadStatsService {

    private static final String LOG_SEPARATOR = "========================================";
    private static final String LOG_UPLOAD_STATS_QUERY_COMPLETE = "=== 업로드 통계 조회 완료 ===";

    private static final String REGISTRANT_ID_SYSTEM = "SYSTEM";
    private static final String REGISTRANT_ID_AUTO = "AUTO";

    private static final String MSG_PBLNT_SN_REQUIRED = "공시일련번호(pblntSn)는 필수입니다.";
    private static final String MSG_PTCP_INST_SN_REQUIRED = "참여기관일련번호(ptcpInstSn)는 필수입니다.";

    
    private static final String ULD_PRGRS_STTS_CD_REGISTERED = "05";
    
    private static final String ULD_TYPE_CD_FILE_UPLOAD = "01";
    
    private static final String TBL_ULD_ERR_TBL_SE_CD = "02";

    private static final String CHG_RSN_UPLOAD_CONFIRM = "업로드 확정 처리";
    private static final String DATE_PATTERN_YYYYMMDD = "yyyyMMdd";

    
    private static final String KEY_ULD_STATS_HIST = "uldStatsHist";
    private static final String KEY_TBL_ULD_STATS_HIST_LIST = "tblUldStatsHistList";
    private static final String KEY_ULD_STATS_SN = "uldStatsSn";
    private static final String KEY_PBLNT_SN = "pblntSn";
    private static final String KEY_PTCP_INST_SN = "ptcpInstSn";
    private static final String KEY_ULD_NOCS = "uldNocs";
    private static final String KEY_ERR_NOCS = "errNocs";
    private static final String KEY_ERR_RT = "errRt";
    private static final String KEY_RGTR_ID = "rgtrId";
    private static final String KEY_REG_DT = "regDt";
    private static final String KEY_VRFC_FNL_ERR_NOCS = "vrfcFnlErrNocs";
    private static final String KEY_VRFC_UNQ_ERR_NOCS = "vrfcUnqErrNocs";
    private static final String KEY_VRFC_VLD_ERR_NOCS = "vrfcVldErrNocs";
    private static final String KEY_VRFC_NML_ERR_NOCS = "vrfcNmlErrNocs";

    private static final String LOG_STATS_PRIMARY_PRESENT = "있음";
    private static final String LOG_STATS_PRIMARY_ABSENT = "없음";

    
    private static final String CAT_TBL_SE_CD = "tblSeCd";
    private static final String CAT_COL_NM = "colNm";
    private static final String CAT_DATA_TYPE_NM = "dataTypeNm";
    private static final String CAT_NUL_YN = "nulYn";
    private static final String CAT_PK_YN = "pkYn";
    private static final String CAT_FK_YN = "fkYn";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final String TABLE_PREFIX = "tb_cm_i_tmpr_";
    
    private static final String[] CDM_TEMP_TABLES = {
        "tb_cm_i_tmpr_enrollment", "tb_cm_i_tmpr_demographic", "tb_cm_i_tmpr_encounter", "tb_cm_i_tmpr_diagnosis",
        "tb_cm_i_tmpr_observation_period", "tb_cm_i_tmpr_dispensing", "tb_cm_i_tmpr_vital_signs", "tb_cm_i_tmpr_procedure",
        "tb_cm_i_tmpr_laboratory_result", "tb_cm_i_tmpr_person", "tb_cm_i_tmpr_measurement", "tb_cm_i_tmpr_procedure_occurrence",
        "tb_cm_i_tmpr_drug_exposure", "tb_cm_i_tmpr_condition_occurrence", "tb_cm_i_tmpr_visit_occurrence", "tb_cm_i_tmpr_death",
        "tb_cm_i_tmpr_condition_era", "tb_cm_i_tmpr_drug_era", "tb_cm_i_tmpr_device_exposure", "tb_cm_i_tmpr_episode",
        "tb_cm_i_tmpr_note", "tb_cm_i_tmpr_observation"
    };

    private final DisclosureMapper disclosureMapper;
    private final DisclosurePartnerService disclosurePartnerService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.schema:kids_link_own}")
    private String linkSchema;

    @Value("${app.stats-schema:kids_own}")
    private String statsSchema;

    /**
     * saveUploadStats 처리를 수행한다.
     *
     * @param user user
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     */
    @Override
    @Transactional
    public void saveUploadStats( UserVO user, Long pblntSn, Long ptcpInstSn ) {
        String rgtrId = user != null && user.getNi() != null ? user.getNi() : REGISTRANT_ID_SYSTEM;
        LocalDateTime now = LocalDateTime.now();
        Map<String, Object> existing = disclosureMapper.findUldStatsHist( pblntSn, ptcpInstSn );
        if ( existing != null ) {

            return;
        }

        List<TableCount> tableCounts = new ArrayList<>();
        long grandTotal = 0L;

        for (String tableName : CDM_TEMP_TABLES ) {
            if ( !tableExists( tableName ) ) continue;
            long cnt = countTable( tableName );
            tableCounts.add( new TableCount( tableName, cnt ) );
            grandTotal += cnt;
        }

        if ( tableCounts.isEmpty() ) {

            return;
        }

        BigDecimal errorRate = BigDecimal.ZERO;
        Long uldStatsSn = nextvalUldStatsSn();
        try {
            disclosureMapper.insertUldStatsHist( uldStatsSn, pblntSn, ptcpInstSn, grandTotal, null, 0L, errorRate, rgtrId, now );

        } catch (Exception e) {

            throw e;
        }

        for ( TableCount tc : tableCounts ) {
            Long tblSn = nextvalTblUldStatsSn();
            BigDecimal tblErrRt = BigDecimal.ZERO;
            try {
                disclosureMapper.insertTblUldStatsHist(
                    statsSchema,
                    tblSn, pblntSn, ptcpInstSn,
                    TBL_ULD_ERR_TBL_SE_CD,
                    tc.tableName,
                    tc.count,
                    0L,
                    0L, 0L, 0L, 0L,
                    tblErrRt,
                    null,
                    null,
                    null,
                    null,
                    rgtrId,
                    now
                );

            } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }

    }

    private boolean tableExists( String tableName ) {
        try {
            Boolean exists = jdbcTemplate.queryForObject(
                "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?)",
                Boolean.class, linkSchema, tableName );
            return Boolean.TRUE.equals( exists );
        } catch (Exception e) {
            return false;
        }
    }

    private long countTable( String tableName ) {
        try {
            Long cnt = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + linkSchema + ".\"" + tableName + "\"",
                Long.class );
            return cnt != null ? cnt : 0L;
        } catch (Exception e) {

            return 0L;
        }
    }

    private Long nextvalUldStatsSn() {
        try {
            return jdbcTemplate.queryForObject( "SELECT nextval('kids_own.sq_cm_uld_stats_sn')", Long.class );
        } catch (Exception e) {
            return System.currentTimeMillis() % 1000000000L;
        }
    }

    private Long nextvalTblUldStatsSn() {
        try {
            String seqName = statsSchema + ".sq_cm_tbl_uld_stats_sn";
            return jdbcTemplate.queryForObject( "SELECT nextval('" + seqName.replace("'", "''") + "')", Long.class );
        } catch (Exception e) {
            return System.currentTimeMillis() % 1000000000L + SECURE_RANDOM.nextInt( 1000 );
        }
    }

    private static class TableCount {
        final String tableName;
        final long count;
        TableCount( String tableName, long count ) {
            this.tableName = tableName;
            this.count = count;
        }
    }

    /**
     * confirmUploadStats 처리를 수행한다.
     *
     * @param user user
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     */
    @Override
    @Transactional
    public void confirmUploadStats( UserVO user, Long pblntSn, Long ptcpInstSn ) {
        
        if (pblntSn == null) {
            throw new IllegalArgumentException( MSG_PBLNT_SN_REQUIRED );
        }
        if (ptcpInstSn == null) {
            throw new IllegalArgumentException( MSG_PTCP_INST_SN_REQUIRED );
        }

        String rgtrId = user != null && user.getNi() != null ? user.getNi() : REGISTRANT_ID_SYSTEM;
        LocalDateTime now = LocalDateTime.now();

        
        Long uldSttsChgSn = generateUldSttsChgSn();
        String uldInstPrgrsSttsCd = ULD_PRGRS_STTS_CD_REGISTERED; 
        String uldInstPrgrsSttsStcd = ULD_PRGRS_STTS_CD_REGISTERED; 
        String chgRsnInfoCn = CHG_RSN_UPLOAD_CONFIRM;

        disclosureMapper.insertUldSttsChg( uldSttsChgSn, ptcpInstSn, pblntSn, uldInstPrgrsSttsCd, now, 
                chgRsnInfoCn, rgtrId, now );

        

        int updatedRows = disclosureMapper.updateUldStatsHist( pblntSn, ptcpInstSn, rgtrId, now );

        
        

        
        String uldTypeCd = ULD_TYPE_CD_FILE_UPLOAD;

        
        String lastUpdtYmd = now.format( java.time.format.DateTimeFormatter.ofPattern( DATE_PATTERN_YYYYMMDD ) );

        
        Long updtCycleCnt = 1L;

        int prstUpdatedRows = disclosureMapper.updateUldPrst( pblntSn, ptcpInstSn, uldInstPrgrsSttsStcd, 
                uldTypeCd, 
                now, 
                now, 
                lastUpdtYmd, 
                updtCycleCnt, 
                rgtrId, now );

        if (prstUpdatedRows == 0) {

        }
    }

    private static long toLong( Object v ) {
        if (v == null) return 0L;
        if (v instanceof Number n) return n.longValue();
        try { return Long.parseLong( v.toString().trim() ); } catch (Exception e) { return 0L; }
    }

    
    private Long generateUldSttsChgSn() {
        return System.currentTimeMillis() % 1000000000L + SECURE_RANDOM.nextInt( 10000 );
    }

    /**
     * 조회 결과를 반환한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    @Override
    public Map<String, Object> getUploadStats( Long pblntSn, Long ptcpInstSn ) {

        try {
            
            Map<String, Object> uldStatsHist = disclosureMapper.findUldStatsHist( pblntSn, ptcpInstSn );

            
            List<Map<String, Object>> tblUldStatsHistList = disclosureMapper.findTblUldStatsHist( pblntSn, ptcpInstSn );

            
            if (uldStatsHist == null && tblUldStatsHistList != null && !tblUldStatsHistList.isEmpty()) {

                long totalUldNocs = 0;
                long totalErrNocs = 0;
                long totalFiveSum = 0;
                for (Map<String, Object> tbl : tblUldStatsHistList) {
                    totalUldNocs += toLong( tbl.get( KEY_ULD_NOCS ) );
                    totalErrNocs += toLong( tbl.get( KEY_ERR_NOCS ) );
                    totalFiveSum += toLong( tbl.get( KEY_ERR_NOCS ) )
                            + toLong( tbl.get( KEY_VRFC_FNL_ERR_NOCS ) )
                            + toLong( tbl.get( KEY_VRFC_UNQ_ERR_NOCS ) )
                            + toLong( tbl.get( KEY_VRFC_VLD_ERR_NOCS ) )
                            + toLong( tbl.get( KEY_VRFC_NML_ERR_NOCS ) );
                }
                
                BigDecimal errRt = totalUldNocs > 0
                    ? BigDecimal.valueOf( totalFiveSum )
                        .multiply( BigDecimal.valueOf( 100 ) )
                        .divide( BigDecimal.valueOf( totalUldNocs ).multiply( BigDecimal.valueOf( 5 ) ), 4, RoundingMode.HALF_UP )
                        .setScale( 2, RoundingMode.HALF_UP )
                    : BigDecimal.ZERO;

                uldStatsHist = new HashMap<>();
                uldStatsHist.put( KEY_ULD_STATS_SN, 0L );
                uldStatsHist.put( KEY_PBLNT_SN, pblntSn );
                uldStatsHist.put( KEY_PTCP_INST_SN, ptcpInstSn );
                uldStatsHist.put( KEY_ULD_NOCS, totalUldNocs );
                uldStatsHist.put( KEY_ERR_NOCS, totalErrNocs );
                uldStatsHist.put( KEY_ERR_RT, errRt );
                uldStatsHist.put( KEY_RGTR_ID, REGISTRANT_ID_AUTO );
                uldStatsHist.put( KEY_REG_DT, tblUldStatsHistList.get( 0 ).get( KEY_REG_DT ) );

            }

            Map<String, Object> result = new HashMap<>();
            result.put( KEY_ULD_STATS_HIST, uldStatsHist );
            result.put( KEY_TBL_ULD_STATS_HIST_LIST, tblUldStatsHistList != null ? tblUldStatsHistList : new ArrayList<>() );

            return result;
        } catch (Exception e) {

            throw e;
        }
    }

    /**
     * 조회 결과를 반환한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @return 처리 결과
     */
    @Override
    public List<Map<String, Object>> getUploadStatsHistory( Long pblntSn, Long ptcpInstSn ) {
        if (pblntSn == null) return List.of();
        List<Map<String, Object>> list = disclosureMapper.findUldStatsHistList( pblntSn, ptcpInstSn );
        return list != null ? list : List.of();
    }

    /**
     * 조회 결과를 반환한다.
     *
     * @param ptcpInstSn ptcpInstSn
     * @param pblntSn pblntSn
     * @return 처리 결과
     */
    @Override
    public List<Map<String, Object>> getUploadStatsHistoryByPartner( Long ptcpInstSn, Long pblntSn ) {
        if (ptcpInstSn == null) return List.of();
        if (pblntSn != null) {
            List<Map<String, Object>> list = disclosureMapper.findUldStatsHistList( pblntSn, ptcpInstSn );
            return list != null ? list : List.of();
        }
        List<Map<String, Object>> legacy = disclosureMapper.findUldStatsHistListByPtcpInstSn( ptcpInstSn );
        return legacy != null ? legacy : List.of();
    }

    /**
     * resetUploadData 처리를 수행한다.
     *
     * @param user user
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     */
    @Override
    @Transactional
    public void resetUploadData( UserVO user, Long pblntSn, Long ptcpInstSn ) {
        if (pblntSn == null) throw new IllegalArgumentException( MSG_PBLNT_SN_REQUIRED );
        if (ptcpInstSn == null) throw new IllegalArgumentException( MSG_PTCP_INST_SN_REQUIRED );

        String mdfrId = user != null && user.getNi() != null ? user.getNi() : REGISTRANT_ID_SYSTEM;

        int fileTrsm = disclosureMapper.softDeleteFileTrsmByPblntSn( pblntSn, ptcpInstSn );
        int fileGroup = disclosureMapper.softDeleteFileGroupByPblntSn( pblntSn, ptcpInstSn, mdfrId );
        int fileUld = disclosureMapper.softDeleteFileUldByPblntSn( pblntSn, ptcpInstSn, mdfrId );
        int tblStats = disclosureMapper.softDeleteTblUldStatsHist( pblntSn, ptcpInstSn, mdfrId );
        int uldStats = disclosureMapper.deleteUldStatsHistByPblntSn( pblntSn, ptcpInstSn );

    }

    /**
     * 조회 결과를 반환한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param tblSeCd tblSeCd
     * @return 처리 결과
     */
    @Override
    public java.util.List<java.util.Map<String, Object>> getCatalog( Long pblntSn, Long ptcpInstSn, String tblSeCd ) {

        java.util.List<java.util.Map<String, Object>> catalogList = disclosureMapper.findCatalog( pblntSn, ptcpInstSn, tblSeCd );

        if (catalogList != null && !catalogList.isEmpty()) {

            for (int i = 0; i < Math.min(catalogList.size(), 5); i++) {
                java.util.Map<String, Object> item = catalogList.get(i);
            }
            if (catalogList.size() > 5) {

            }
        } else {

        }

        return catalogList != null ? catalogList : new java.util.ArrayList<>();
    }
}
