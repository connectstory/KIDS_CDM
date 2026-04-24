package kr.or.kids.domain.cm.upload.dto;

import java.util.Map;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public record CommitResponse(
        boolean status,
        Map<String, CommitTableResult> results
) {}

