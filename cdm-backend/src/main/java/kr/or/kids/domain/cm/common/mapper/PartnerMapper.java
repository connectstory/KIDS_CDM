package kr.or.kids.domain.cm.common.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;

import kr.or.kids.domain.cm.common.vo.TbPpMInstVO;

@Mapper
public interface PartnerMapper {
  List<TbPpMInstVO> search();

  Map<String, String> selectExpertEncryptedInfoByBrno( String brno );

  Map<String, String> selectEmpInfoByEmpNo( String empNo );

  Map<String, String> selectInstAndName( String mbrNo );

  String selectMbrNo( String userNo );
}
