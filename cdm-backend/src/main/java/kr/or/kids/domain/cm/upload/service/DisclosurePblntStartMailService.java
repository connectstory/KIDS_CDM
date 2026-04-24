package kr.or.kids.domain.cm.upload.service;

/**
 * 업로드 도메인 서비스 계약을 정의한다.
 */
public interface DisclosurePblntStartMailService {

  
  /**
   * sendDisclosureStartedMails 처리를 수행한다.
   *
   * @param pblntSn pblntSn
   */
  void sendDisclosureStartedMails( Long pblntSn );
}
