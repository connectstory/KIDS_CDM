package kr.or.kids.domain.cm.upload.service.impl;

import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.upload.dto.AnalysisRequest;
import kr.or.kids.domain.cm.upload.dto.UploadAnalysisResult;
import kr.or.kids.domain.cm.upload.service.AnalysisService;
import kr.or.kids.domain.cm.upload.service.UploadRuleCheckService;
import lombok.RequiredArgsConstructor;

/**
 * 업로드 도메인 비즈니스 로직을 구현한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@Service
@Primary
@RequiredArgsConstructor
public class OmopUploadRuleCheckService implements UploadRuleCheckService {

  private final AnalysisService analysisService;

  /**
   * 입력값을 검증한다.
   *
   * @param tableStoredList tableStoredList
   * @return 처리 결과
   */
  @Override
  public Map<String, Map<String, UploadAnalysisResult>> validate( List<AnalysisRequest> tableStoredList ) throws Exception {
    return analysisService.validate( tableStoredList );
  }
}

