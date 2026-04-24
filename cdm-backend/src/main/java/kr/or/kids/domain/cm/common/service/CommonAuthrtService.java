package kr.or.kids.domain.cm.common.service;

import kr.or.kids.domain.cm.common.vo.TbPpMAuthrtVO;

import java.util.List;

public interface CommonAuthrtService {
   
    /**
     * 회원 권한 목록 조회
     */
    List<TbPpMAuthrtVO> selectMemberAuthList(String mbrNo);
}
