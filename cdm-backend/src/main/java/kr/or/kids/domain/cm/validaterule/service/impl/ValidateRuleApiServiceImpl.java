package kr.or.kids.domain.cm.validaterule.service.impl;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.validaterule.mapper.ValidateRuleApiMapper;
import kr.or.kids.domain.cm.validaterule.service.ValidateRuleApiService;
import kr.or.kids.domain.cm.validaterule.vo.TbCmMVrfcVo;
import kr.or.kids.domain.cm.validaterule.vo.ValidateRuleApiInVO;
import kr.or.kids.domain.cm.validaterule.vo.ValidateRuleApiOutVO;

import lombok.RequiredArgsConstructor;

/**
 * <pre>
 * 검증 규칙 서비스 구현 클래스
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 * <pre>
 * since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ValidateRuleApiServiceImpl implements ValidateRuleApiService {

    private final ValidateRuleApiMapper mapper;

    /**
     * 검증 규칙 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 및 페이징 처리가 포함된 검증 규칙 목록 반환
     * </pre>
     *
     * @param inVo 검증 규칙 목록 조회 조건 VO
     * @return 검증 규칙 목록
     */
    @Override
    public List<ValidateRuleApiOutVO> getList(ValidateRuleApiInVO inVo) {
        return mapper.selectValidateRuleList(inVo);
    }

    /**
     * 전체 검증 규칙 건수를 조회한다.
     *
     * <pre>
     * - 페이징 처리를 위한 전체 데이터 개수 조회
     * </pre>
     *
     * @param inVo 검증 규칙 목록 조회 조건 VO
     * @return 전체 건수
     */
    @Override
    public int getListCount(ValidateRuleApiInVO inVo) {
        return mapper.selectValidateRuleListCount(inVo);
    }

    /**
     * 검증 규칙 상세 정보를 조회한다.
     *
     * <pre>
     * - 검증 식별자(vrfcSn)를 기준으로 단건 상세 데이터 조회
     * </pre>
     *
     * @param inVo 검증 규칙 상세 조회 조건 VO
     * @return 검증 규칙 상세 정보
     */
    @Override
    public ValidateRuleApiOutVO getDetail(ValidateRuleApiInVO inVo) {
        return mapper.selectValidateRuleDetail(inVo.getVrfcSn());
    }

    /**
     * 검증 규칙을 등록한다.
     *
     * <pre>
     * - 신규 데이터 검증 규칙 정보 저장
     * </pre>
     *
     * @param inVo 검증 규칙 등록 정보 VO
     * @return 등록 결과 건수
     */
    @Override
    @Transactional
    public int insertValidateRule(TbCmMVrfcVo inVo) {
        return mapper.insertValidateRule(inVo);
    }

    /**
     * 검증 규칙 정보를 수정한다.
     *
     * <pre>
     * - 검증 규칙 명칭, 로직 내용 등 정보 업데이트
     * </pre>
     *
     * @param inVo 검증 규칙 수정 정보 VO
     * @return 수정 결과 건수
     */
    @Override
    @Transactional
    public int updateValidateRule(TbCmMVrfcVo inVo) {
        return mapper.updateValidateRule(inVo);
    }

    /**
     * 검증 규칙을 삭제한다.
     *
     * <pre>
     * - 검증 식별자(vrfcSn)를 기준으로 데이터 삭제 처리
     * </pre>
     *
     * @param inVo 검증 규칙 삭제 정보 VO
     * @return 삭제 결과 건수
     */
    @Override
    @Transactional
    public int deleteValidateRule(TbCmMVrfcVo inVo) {
        return mapper.deleteValidateRule(inVo.getVrfcSn());
    }
}