package kr.or.kids.domain.cm.upload.service;

import java.util.List;
import java.util.Map;

import kr.or.kids.domain.cm.upload.dto.AnalysisRequest;
import kr.or.kids.domain.cm.upload.dto.UploadAnalysisResult;

/**
 * 업로드 도메인 서비스 계약을 정의한다.
 */
public interface UploadRuleCheckService {
  /**
   * 입력값을 검증한다.
   *
   * @param tableStoredList tableStoredList
   * @return 처리 결과
   */
  Map<String, Map<String, UploadAnalysisResult>> validate( List<AnalysisRequest> tableStoredList ) throws Exception;
}

