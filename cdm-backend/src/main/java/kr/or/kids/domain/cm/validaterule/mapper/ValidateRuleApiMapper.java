package kr.or.kids.domain.cm.validaterule.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import kr.or.kids.domain.cm.validaterule.vo.TbCmMVrfcVo;
import kr.or.kids.domain.cm.validaterule.vo.ValidateRuleApiInVO;
import kr.or.kids.domain.cm.validaterule.vo.ValidateRuleApiOutVO;

/**
 * <pre>
 * 검증 규칙 매퍼 인터페이스
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
@Mapper
public interface ValidateRuleApiMapper {

    /**
     * 검증 규칙 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 필터링 및 페이징 처리된 검증 규칙 목록 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 검증 규칙 목록
     */
    List<ValidateRuleApiOutVO> selectValidateRuleList(ValidateRuleApiInVO inVo);

    /**
     * 검증 규칙 전체 건수를 조회한다.
     *
     * <pre>
     * - 페이징 계산을 위한 필터링된 전체 데이터 개수 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 전체 건수
     */
    int selectValidateRuleListCount(ValidateRuleApiInVO inVo);

    /**
     * 검증 규칙 상세 정보를 조회한다.
     *
     * <pre>
     * - 검증 식별자(vrfcSn)를 기준으로 단건 상세 조회
     * </pre>
     *
     * @param vrfcSn 검증 식별자
     * @return 검증 규칙 상세 정보
     */
    ValidateRuleApiOutVO selectValidateRuleDetail(Long vrfcSn);

    /**
     * 검증 규칙 정보를 등록한다.
     *
     * <pre>
     * - 데이터 정합성 체크를 위한 신규 검증 규칙 저장
     * </pre>
     *
     * @param inVo 등록 정보 VO
     * @return 등록된 행 수
     */
    int insertValidateRule(TbCmMVrfcVo inVo);

    /**
     * 검증 규칙 정보를 수정한다.
     *
     * <pre>
     * - 기존 검증 규칙의 명칭, 조건, 정규식 등 업데이트
     * </pre>
     *
     * @param inVo 수정 정보 VO
     * @return 수정된 행 수
     */
    int updateValidateRule(TbCmMVrfcVo inVo);

    /**
     * 검증 규칙 정보를 삭제한다.
     *
     * <pre>
     * - 검증 식별자를 기준으로 데이터 삭제 처리
     * </pre>
     *
     * @param vrfcSn 검증 식별자
     * @return 처리된 행 수
     */
    int deleteValidateRule(Long vrfcSn);
}