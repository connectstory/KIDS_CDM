package kr.or.kids.domain.cm.upload.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import kr.or.kids.global.security.SqlIdentifierGuard;
import lombok.RequiredArgsConstructor;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class DisclosurePartnerCloseDataCleanupService {

  private static final String TABLE_PREFIX = "tb_cm_i_tmpr_";
  private static final String COL_INST_TASK_SN = "inst_task_sn";
  private static final String SQL_DELETE_FROM = "DELETE FROM ";
  private static final String SQL_GUARD_TABLE = "table";
  private static final String SQL_EXISTS_TABLE =
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = ?)";
  
  private static final int BRNO_PAD_LEN = 10;

  
  private static final String[] CDM_TEMP_TABLES_FALLBACK = {
      "tb_cm_i_tmpr_enrollment", "tb_cm_i_tmpr_demographic", "tb_cm_i_tmpr_encounter", "tb_cm_i_tmpr_diagnosis",
      "tb_cm_i_tmpr_observation_period", "tb_cm_i_tmpr_dispensing", "tb_cm_i_tmpr_vital_signs", "tb_cm_i_tmpr_procedure",
      "tb_cm_i_tmpr_laboratory_result", "tb_cm_i_tmpr_person", "tb_cm_i_tmpr_measurement", "tb_cm_i_tmpr_procedure_occurrence",
      "tb_cm_i_tmpr_drug_exposure", "tb_cm_i_tmpr_condition_occurrence", "tb_cm_i_tmpr_visit_occurrence", "tb_cm_i_tmpr_death",
      "tb_cm_i_tmpr_condition_era", "tb_cm_i_tmpr_drug_era", "tb_cm_i_tmpr_device_exposure", "tb_cm_i_tmpr_episode",
      "tb_cm_i_tmpr_note", "tb_cm_i_tmpr_observation"
  };

  private final DisclosureMapper disclosureMapper;
  private final DisclosurePartnerMapper disclosurePartnerMapper;
  private final JdbcTemplate jdbcTemplate;

  @Value("${app.schema:kids_link_own}")
  private String linkSchema;

  /**
   * purgeAfterCloseCancellation 처리를 수행한다.
   *
   * @param pblntSn pblntSn
   * @param ptcpInstSn ptcpInstSn
   * @param auditMdfrId auditMdfrId
   */
  @Transactional
  public void purgeAfterCloseCancellation( Long pblntSn, Long ptcpInstSn, String auditMdfrId ) {
    if (pblntSn == null || ptcpInstSn == null) {
      return;
    }
    String mdfrId = auditMdfrId != null && !auditMdfrId.isBlank() ? auditMdfrId.trim() : "SYSTEM";
    LocalDateTime now = LocalDateTime.now();

    int fileTrsm = disclosureMapper.softDeleteFileTrsmByPblntSn( pblntSn, ptcpInstSn );
    int fileGroup = disclosureMapper.softDeleteFileGroupByPblntSn( pblntSn, ptcpInstSn, mdfrId );
    int fileUld = disclosureMapper.softDeleteFileUldByPblntSn( pblntSn, ptcpInstSn, mdfrId );
    int tblStats = disclosureMapper.softDeleteTblUldStatsHist( pblntSn, ptcpInstSn, mdfrId );
    int uldStats = disclosureMapper.deleteUldStatsHistByPblntSn( pblntSn, ptcpInstSn );

    disclosurePartnerMapper.deletePeriodScale( pblntSn, ptcpInstSn );
    disclosurePartnerMapper.deleteCatalog( pblntSn, ptcpInstSn );
    disclosurePartnerMapper.clearPartnerCdmFieldsAfterCloseCancel( pblntSn, ptcpInstSn, mdfrId, now );

    String brno = disclosurePartnerMapper.findBrnoByPtcpInstSn( ptcpInstSn, pblntSn );
    if (brno == null || brno.isBlank()) {

      return;
    }

    List<String> instSnCandidates = instTaskSnBindCandidates( brno );

    List<String> tmprTableNames = listTmprTableNamesInLinkSchema();

    purgeTmprRowsForCandidates( instSnCandidates, tmprTableNames );
    purgeBaseRowsForCandidates( instSnCandidates, tmprTableNames );

  }

  
  private static List<String> instTaskSnBindCandidates( String brno ) {
    if (brno == null || brno.isBlank()) {
      return List.of();
    }
    LinkedHashSet<String> set = new LinkedHashSet<>();
    String trimmed = brno.trim();
    set.add( trimmed );
    String normalized = normalizeBrnoLikeValidate( trimmed );
    if (normalized != null && !normalized.isBlank()) {
      set.add( normalized );
    }
    if (normalized != null && normalized.matches( "\\d+" ) && normalized.length() <= BRNO_PAD_LEN ) {
      set.add( leftPadDigits( normalized, BRNO_PAD_LEN ) );
    }
    return new ArrayList<>( set );
  }

  
  private static String leftPadDigits( String digits, int len ) {
    if (digits == null || digits.length() >= len ) {
      return digits;
    }
    return "0".repeat( len - digits.length() ) + digits;
  }

  
  private static String normalizeBrnoLikeValidate( String brno ) {
    if (brno == null || brno.isBlank()) {
      return brno;
    }
    String s = brno.replace( "-", "" ).replace( " ", "" ).trim();
    s = s.replaceFirst( "^0+", "" );
    return s.isEmpty() ? "0" : s;
  }

  
  private List<String> listTmprTableNamesInLinkSchema() {
    String sql = """
        SELECT c.relname::text
        FROM pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = ?
          AND c.relkind = 'r'
          AND c.relname ~ '^tb_cm_i_tmpr_.+'
        ORDER BY 1
        """;
    try {
      List<String> rows = jdbcTemplate.queryForList( sql, String.class, linkSchema );
      if (rows != null && !rows.isEmpty()) {
        return rows;
      }
    } catch (Exception ex ) {
      UploadNonFatal.discard( ex );
    }
    return List.of( CDM_TEMP_TABLES_FALLBACK );
  }

  private void purgeTmprRowsForCandidates( List<String> candidates, List<String> tmprTableNames ) {
    if (candidates == null || candidates.isEmpty() || tmprTableNames == null || tmprTableNames.isEmpty()) {
      return;
    }
    for (String tableName : tmprTableNames) {
      try {
        if (!tableExists( linkSchema, tableName )) {
          continue;
        }
        List<String> cols = getColumnNames( linkSchema, tableName );
        if (cols == null || !cols.contains( COL_INST_TASK_SN )) {

          continue;
        }
        int deleted = deleteByInstTaskSnCandidates( qualifyTable( tableName ), candidates );
        if (deleted > 0) {

        }
      } catch (Exception ex ) {
        UploadNonFatal.discard( ex );
      }
    }
  }

  
  private void purgeBaseRowsForCandidates( List<String> candidates, List<String> tmprTableNames ) {
    if (candidates == null || candidates.isEmpty() || tmprTableNames == null || tmprTableNames.isEmpty()) {
      return;
    }
    for (String tmprFull : tmprTableNames) {
      if (!tmprFull.startsWith( TABLE_PREFIX )) {
        continue;
      }
      String slotBase = tmprFull.substring( TABLE_PREFIX.length() );
      for (String baseTable : physicalBaseTableNamesForSlot( slotBase ) ) {
        try {
          if (!tableExists( linkSchema, baseTable )) {
            continue;
          }
          List<String> cols = getColumnNames( linkSchema, baseTable );
          if (cols == null || !cols.contains( COL_INST_TASK_SN )) {
            continue;
          }
          int deleted = deleteByInstTaskSnCandidates( qualifyTable( baseTable ), candidates );
          if (deleted > 0) {

          }
        } catch (Exception ex ) {
          UploadNonFatal.discard( ex );
        }
      }
    }
  }

  private List<String> physicalBaseTableNamesForSlot( String slotBase ) {
    if (slotBase == null || slotBase.isBlank()) {
      return List.of();
    }
    if (!slotBase.endsWith( "death" )) {
      return List.of( slotBase );
    }
    List<String> names = new ArrayList<>();
    String prefixed = "tb_cm_i_" + slotBase;
    if (tableExists( linkSchema, prefixed )) {
      names.add( prefixed );
    }
    if (tableExists( linkSchema, slotBase )) {
      names.add( slotBase );
    }
    if (names.isEmpty()) {
      names.add( slotBase );
    }
    return names;
  }

  private int deleteByInstTaskSnCandidates( String qualifiedTable, List<String> candidates ) {
    if (candidates == null || candidates.isEmpty()) {
      return 0;
    }
    StringBuilder placeholders = new StringBuilder();
    for (int i = 0; i < candidates.size(); i++) {
      if (i > 0) {
        placeholders.append( ", " );
      }
      placeholders.append( "?" );
    }
    String sql = SQL_DELETE_FROM + qualifiedTable + " WHERE " + COL_INST_TASK_SN + " IN (" + placeholders + ")";
    return jdbcTemplate.update( sql, candidates.toArray() );
  }

  private boolean tableExists( String schema, String tableName ) {
    try {
      Boolean ok = jdbcTemplate.queryForObject( SQL_EXISTS_TABLE, Boolean.class, schema, tableName );
      return Boolean.TRUE.equals( ok );
    } catch (Exception e ) {
      return false;
    }
  }

  private List<String> getColumnNames( String schema, String table ) {
    String sql = """
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = ? AND table_name = ?
        ORDER BY ordinal_position
        """;
    List<String> names = jdbcTemplate.queryForList( sql, String.class, schema, table );
    return names != null ? names.stream().map( n -> n.toLowerCase().trim() ).toList() : List.of();
  }

  private String qualifyTable( String tableName ) {
    String safe = SqlIdentifierGuard.requireValidIdentifier( tableName, SQL_GUARD_TABLE );
    String sch = SqlIdentifierGuard.requireValidIdentifier( linkSchema, "schema" );
    return SqlIdentifierGuard.qualify( sch, safe );
  }
}
