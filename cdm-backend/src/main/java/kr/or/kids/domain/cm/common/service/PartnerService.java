package kr.or.kids.domain.cm.common.service;

import java.util.List;

import kr.or.kids.domain.cm.common.dto.PartnerResponse;

public interface PartnerService {

  List<PartnerResponse> findAll();
}
