package kr.or.kids.domain.cm.common.service.impl;

import kr.or.kids.domain.cm.common.mapper.CommonAuthrtMapper;
import kr.or.kids.domain.cm.common.service.CommonAuthrtService;
import kr.or.kids.domain.cm.common.vo.TbPpMAuthrtVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommonAuthrtServiceImpl implements CommonAuthrtService {

    private final CommonAuthrtMapper commonAuthrtMapper;

    /**
     * 회원 권한 목록 조회
     */
    @Override
    public List<TbPpMAuthrtVO> selectMemberAuthList(String mbrNo) {
        return commonAuthrtMapper.selectMemberAuthList(mbrNo);
    }
}
