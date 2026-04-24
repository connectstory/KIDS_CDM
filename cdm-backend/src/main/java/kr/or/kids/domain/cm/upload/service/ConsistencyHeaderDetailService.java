package kr.or.kids.domain.cm.upload.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.upload.dto.RuleConsistencyResult;
import kr.or.kids.domain.cm.upload.util.AttachmentCsvPathResolver;
import kr.or.kids.domain.cm.upload.util.UploadNonFatal;
import lombok.RequiredArgsConstructor;

/**
 * 업로드 도메인 서비스를 제공한다.
 */
@Service
@RequiredArgsConstructor
public class ConsistencyHeaderDetailService {

    private static final String TABLE_PREFIX = "tb_cm_i_tmpr_";

    private final AnalysisConsistencyService consistencyService;
    private final AttachmentCsvPathResolver attachmentCsvPathResolver;
    private final DisclosureService disclosureService;

    
    /**
     * 조회 결과를 반환한다.
     *
     * @param pblntSn pblntSn
     * @param ptcpInstSn ptcpInstSn
     * @param errTblNm errTblNm
     * @return 처리 결과
     */
    public Map<String, Object> getHeaderDetail( Long pblntSn, Long ptcpInstSn, String errTblNm ) {
        Map<String, Object> out = new HashMap<>();
        if (pblntSn == null || ptcpInstSn == null || errTblNm == null || errTblNm.isBlank()) {
            out.put( "error", "공시번호, 참여기관, 테이블명이 필요합니다." );
            return out;
        }
        String cdmTableName = ensureTableName( errTblNm.trim() );
        String slotKey = toSlotKey( cdmTableName );

        List<Map<String, Object>> files = disclosureService.findFilesByPblntSn( pblntSn, ptcpInstSn );
        if (files == null || files.isEmpty()) {
            out.put( "error", "업로드된 파일을 찾을 수 없습니다." );
            out.put( "errTblNm", cdmTableName );
            out.put( "slotKey", slotKey );
            return out;
        }

        RuleConsistencyResult best = null;
        int bestScore = -1;
        String bestAtchFileId = null;

        for (Map<String, Object> f : files) {
            Object idObj = f.get( "atchFileId" );
            if (idObj == null) {
                continue;
            }
            String atchFileId = String.valueOf( idObj ).trim();
            if (atchFileId.isEmpty()) {
                continue;
            }
            Path path = attachmentCsvPathResolver.resolveAttachmentCsvPath( atchFileId );
            if (path == null || !Files.isRegularFile( path )) {
                continue;
            }
            String lower = path.toString().toLowerCase( Locale.ROOT );
            if (!lower.endsWith( ".csv" ) && !lower.endsWith( ".tsv" )) {
                continue;
            }
            try {
                RuleConsistencyResult r = consistencyService.validateFieldName( slotKey, atchFileId, path );
                int refN = r.referenceFields != null ? r.referenceFields.size() : 0;
                if (refN <= 0) {
                    continue;
                }
                int score = r.matchedFields != null ? r.matchedFields.size() : 0;
                if (score > bestScore) {
                    bestScore = score;
                    best = r;
                    bestAtchFileId = atchFileId;
                }
            } catch (Exception ex) {
                UploadNonFatal.discard( ex );
            }
        }

        if (best == null) {
            out.put( "error", "해당 테이블과 매칭되는 CSV를 찾지 못했거나, 필드명 일관성 규칙이 없습니다." );
            out.put( "errTblNm", cdmTableName );
            out.put( "slotKey", slotKey );
            return out;
        }

        out.put( "missingFields", best.missingFields != null ? new ArrayList<>( best.missingFields ) : List.of() );
        out.put( "matchedFields", best.matchedFields != null ? new ArrayList<>( best.matchedFields ) : List.of() );
        out.put( "referenceFields", best.referenceFields != null ? new ArrayList<>( best.referenceFields ) : List.of() );
        out.put( "errTblNm", cdmTableName );
        out.put( "slotKey", slotKey );
        out.put( "atchFileId", bestAtchFileId );
        return out;
    }

    private static String toSlotKey( String cdmTableName ) {
        if (cdmTableName == null) {
            return "";
        }
        String t = cdmTableName.trim().toLowerCase( Locale.ROOT );
        if (t.startsWith( TABLE_PREFIX )) {
            return t.substring( TABLE_PREFIX.length() );
        }
        if (t.startsWith( "tb_cm_i_" )) {
            return t.substring( "tb_cm_i_".length() );
        }
        if (t.startsWith( "cdm_" )) {
            return t.substring( 4 );
        }
        return t;
    }

    
    private static String ensureTableName( String tableName ) {
        if (tableName == null) {
            return null;
        }
        String t = tableName.trim().toLowerCase( Locale.ROOT );
        if (t.startsWith( TABLE_PREFIX )) {
            return t;
        }
        if (t.startsWith( "tb_cm_i_" )) {
            t = t.substring( 8 );
        } else if (t.startsWith( "cdm_" )) {
            t = t.substring( 4 );
        }
        return TABLE_PREFIX + t;
    }
}
