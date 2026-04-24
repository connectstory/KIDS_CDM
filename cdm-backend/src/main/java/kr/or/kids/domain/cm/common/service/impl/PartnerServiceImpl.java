package kr.or.kids.domain.cm.common.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.common.dto.PartnerResponse;
import kr.or.kids.domain.cm.common.mapper.PartnerMapper;
import kr.or.kids.domain.cm.common.service.PartnerService;
import kr.or.kids.domain.cm.common.vo.TbPpMInstVO;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PartnerServiceImpl implements PartnerService {

  private final PartnerMapper partnerMapper;

  @Override
  public List<PartnerResponse> findAll() {
    List<TbPpMInstVO> vos = partnerMapper.search();
    return vos.stream().map( v -> new PartnerResponse( v.getBrno(), v.getInstNm(), v.getDelYn(), v.getRgtrId(), v.getRegDt(), v.getRegPrgmId(), v.getMdfrId(), v.getMdfcnDt(), v.getMdfcnPrgmId() ) ).collect( Collectors.toList() );
  }
}
