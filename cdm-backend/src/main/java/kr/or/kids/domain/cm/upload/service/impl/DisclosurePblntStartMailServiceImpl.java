package kr.or.kids.domain.cm.upload.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import kr.or.kids.domain.cm.common.utils.EmailContentGenerator;
import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.common.service.MailApiService;
import kr.or.kids.domain.cm.research.vo.TbCmMUldPrstVO;
import kr.or.kids.domain.cm.upload.mapper.DisclosureMapper;
import kr.or.kids.domain.cm.upload.mapper.DisclosurePartnerMapper;
import kr.or.kids.domain.cm.upload.service.DisclosurePblntStartMailService;
import kr.or.kids.domain.cm.upload.vo.TbCmMUldPblntVO;
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
public class DisclosurePblntStartMailServiceImpl implements DisclosurePblntStartMailService {

  private static final String MSG_TTL = "업로드 공시 등록";
  private static final String MSG_CN = "<p>업로드 공시가 등록 되었습니다.</p>" + "<p>&nbsp;</p>" + "<p>감사합니다.</p>";

  private final MailApiService mailApiService;
  private final DisclosurePartnerMapper disclosurePartnerMapper;
  private final DisclosureMapper disclosureMapper;
  private final EmailContentGenerator emailContentGenerator;

  /**
   * sendDisclosureStartedMails 처리를 수행한다.
   *
   * @param pblntSn pblntSn
   */
  @Override
  public void sendDisclosureStartedMails( Long pblntSn ) {
    if (pblntSn == null) {
      return;
    }

    TbCmMUldPblntVO pblnt = disclosureMapper.findById( pblntSn );
    String ttlSuffix = pblnt != null && pblnt.getTtlNm() != null && !pblnt.getTtlNm().isBlank()
        ? " (" + pblnt.getTtlNm() + ")"
        : "";

    List<TbCmMUldPrstVO> partners = disclosurePartnerMapper.findByPblntSn( pblntSn );
    if (partners == null || partners.isEmpty()) {

      return;
    }

    for (TbCmMUldPrstVO row : partners) {
      sendStartedMailToPartnerIfApplicable( pblntSn, row, ttlSuffix );
    }
  }

  private void sendStartedMailToPartnerIfApplicable( Long pblntSn, TbCmMUldPrstVO row, String ttlSuffix ) {
    if (row == null || row.getPtcpInstSn() == null) {
      return;
    }
    if ("04".equals( normalizeTwoDigit( row.getUldInstPrgrsSttsStcd() ) )) {
      return;
    }
    String brno = row.getBrno();
    if (brno == null || brno.isBlank()) {
      brno = disclosurePartnerMapper.findBrnoByPtcpInstSn( row.getPtcpInstSn(), pblntSn );
    }
    if (brno == null || brno.isBlank()) {

      return;
    }
    String subject = MSG_TTL + ttlSuffix;
    /// //////////////////////////////////////////////////////////////////////////////////
    //String subject = "[한국의약품안전관리원] 연구과제 진행중 변경 안내";
    Map<String, Object> vars = new HashMap<>();
    vars.putAll( emailContentGenerator.commonVars() );
    vars.put( "title", "CDM  업로드 공시" );
    vars.put( "description", "CDM  업로드 공시가 진행중으로 변경되었습니다." );
    vars.put( "contentLabel", "내용" );
    vars.put( "contentValue", "[" + row.getInstNm() + "] 의 담당자님, 기관 데이터를 본원 자체 시스템에 등록해주세요." );
    String body = emailContentGenerator.render( "mail/common-notice.html", vars );
    mailApiService.sendHtmlMail( row.getInstId(), null, subject, body );
  }

  private static String normalizeTwoDigit( String code ) {
    if (code == null) {
      return "";
    }
    String s = code.trim();
    if (s.length() == 1) {
      return "0" + s;
    }
    return s;
  }
}
