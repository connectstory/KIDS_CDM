package kr.or.kids.domain.cm.community.asmtprp.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

/* VO 개별 임포트 */
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpAnsApiOutVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpApiInVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpApiOutVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.TbPpMAsmtPrpAnsVo;
import kr.or.kids.domain.cm.community.asmtprp.vo.TbPpMAsmtPrpVo;

/**
 * <pre>
 * 과제 제안 매퍼 인터페이스
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
public interface AsmtPrpApiMapper {

    /**
     * 과제 제안 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 필터링 및 페이징 처리된 목록 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 과제 제안 목록
     */
    List<AsmtPrpApiOutVO> selectAsmtPrpList(AsmtPrpApiInVO inVo);

    /**
     * 과제 제안 전체 건수를 조회한다.
     *
     * <pre>
     * - 페이징 계산을 위한 필터링된 전체 행 수 반환
     * </pre>
     *
     * @param inVo 조회 조건 VO
     * @return 전체 건수
     */
    int selectAsmtPrpListCount(AsmtPrpApiInVO inVo);

    /**
     * 과제 제안 상세 정보를 조회한다.
     *
     * <pre>
     * - 식별자(asmtPrpSn)를 기준으로 단건 상세 조회
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 과제 제안 상세 정보
     */
    AsmtPrpApiOutVO selectAsmtPrpDetail(long asmtPrpSn);

    /**
     * 비밀번호 일치 여부를 조회한다.
     *
     * <pre>
     * - 게시글 식별자 및 입력 비밀번호 일치 확인
     * </pre>
     *
     * @param inVo 비밀번호 확인 정보 VO
     * @return 일치하는 행 수 (1: 일치, 0: 불일치)
     */
    int checkPassword(AsmtPrpApiInVO inVo);

    /**
     * 과제 제안 정보를 등록한다.
     *
     * <pre>
     * - 새로운 과제 제안 게시글 저장
     * </pre>
     *
     * @param inVo 등록 정보 VO
     * @return 등록된 행 수
     */
    int insertAsmtPrp(TbPpMAsmtPrpVo inVo);

    /**
     * 과제 제안 정보를 수정한다.
     *
     * <pre>
     * - 게시글 제목, 내용, 수정자 정보 등 업데이트
     * </pre>
     *
     * @param inVo 수정 정보 VO
     * @return 수정된 행 수
     */
    int updateAsmtPrp(TbPpMAsmtPrpVo inVo);

    /**
     * 과제 제안 정보를 삭제한다.
     *
     * <pre>
     * - 식별자를 기준으로 게시글 삭제 (논리/물리)
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 삭제된 행 수
     */
    int deleteAsmtPrp(Long asmtPrpSn);

    /**
     * 과제 제안 답변 목록을 조회한다.
     *
     * <pre>
     * - 원본 게시글 식별자에 연결된 답변 리스트 조회
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 답변 목록
     */
    List<AsmtPrpAnsApiOutVO> selectAsmtPrpAnswer(long asmtPrpSn);

    /**
     * 과제 제안 답변을 등록한다.
     *
     * <pre>
     * - 과제 제안에 대한 답변 데이터 저장
     * </pre>
     *
     * @param inVo 답변 등록 정보 VO
     * @return 등록된 행 수
     */
    int insertAsmtPrpAnswer(TbPpMAsmtPrpAnsVo inVo);

    /**
     * 과제 제안 답변 정보를 수정한다.
     *
     * <pre>
     * - 답변 내용 및 수정 정보 업데이트
     * </pre>
     *
     * @param inVo 답변 수정 정보 VO
     * @return 수정된 행 수
     */
    int updateAsmtPrpAnswer(TbPpMAsmtPrpAnsVo inVo);

    /**
     * 과제 제안 답변을 삭제한다.
     *
     * <pre>
     * - 답변 식별자를 기준으로 단건 삭제
     * </pre>
     *
     * @param ansSn 답변 식별자
     * @return 삭제된 행 수
     */
    int deleteAsmtPrpAnswer(Long ansSn);

    /**
     * 과제 제안 삭제 시 연관된 답변을 일괄 비활성화(삭제)한다.
     *
     * <pre>
     * - 원본 게시글 삭제에 따른 하위 답변 처리
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 처리된 행 수
     */
    int deleteAnswerByAsmtPrpSn(Long asmtPrpSn);

    /**
     * 과제 제안 상태를 '답변완료'로 변경한다.
     *
     * <pre>
     * - 답변 등록 시 호출되어 게시글 상태 업데이트
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 수정된 행 수
     */
    int updateAsmtPrpStatusAnswered(Long asmtPrpSn);

    /**
     * 답변 식별자를 통해 연결된 과제 제안 식별자를 조회한다.
     *
     * @param ansSn 답변 식별자
     * @return 과제 제안 식별자 (asmtPrpSn)
     */
    long selectAsmtPrpSnByAnsSn(long ansSn);

    /**
     * 과제 제안 상태를 '답변대기'로 변경한다.
     *
     * <pre>
     * - 답변 삭제 시 호출되어 게시글 상태 복구
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 수정된 행 수
     */
    int updateAsmtPrpStatusWaiting(long asmtPrpSn);

    /**
     * 과제 제안 조회수를 증가시킨다.
     *
     * <pre>
     * - 게시글 조회 시 조회수(pst_inq_cnt) 1 증가
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 수정된 행 수
     */
    int updateAsmtPrpViewCount(Long asmtPrpSn);
}