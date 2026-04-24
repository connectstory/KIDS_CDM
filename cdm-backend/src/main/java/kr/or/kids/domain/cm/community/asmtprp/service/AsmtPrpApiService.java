package kr.or.kids.domain.cm.community.asmtprp.service;

import java.util.List;

import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpAnsApiOutVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpApiInVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpApiOutVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.TbPpMAsmtPrpAnsVo;
import kr.or.kids.domain.cm.community.asmtprp.vo.TbPpMAsmtPrpVo;
import org.springframework.web.multipart.MultipartFile;

/**
 * <pre>
 * 과제 제안 서비스 인터페이스
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
public interface AsmtPrpApiService {

    /**
     * 과제 제안 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 및 페이징 처리가 포함된 목록 조회
     * </pre>
     *
     * @param inVo 과제 제안 목록 조회 조건 VO
     * @return 과제 제안 목록
     */
    List<AsmtPrpApiOutVO> getList(AsmtPrpApiInVO inVo);

    /**
     * 전체 과제 제안 건수를 조회한다.
     *
     * <pre>
     * - 페이징 처리를 위한 전체 데이터 개수 조회
     * </pre>
     *
     * @param inVo 과제 제안 목록 조회 조건 VO
     * @return 전체 건수
     */
    int getListCount(AsmtPrpApiInVO inVo);

    /**
     * 과제 제안 상세 정보를 조회한다.
     *
     * <pre>
     * - 과제 제안 식별자를 기준으로 상세 내용 조회
     * </pre>
     *
     * @param inVo 과제 제안 상세 조회 조건 VO
     * @return 과제 제안 상세 정보
     */
    AsmtPrpApiOutVO getDetail(AsmtPrpApiInVO inVo);

    /**
     * 비밀번호 일치 여부를 확인한다.
     *
     * <pre>
     * - 게시글 수정을 위한 비밀번호 확인
     * </pre>
     *
     * @param inVo 과제 제안 정보 VO
     * @return 비밀번호 일치 여부 (true: 일치, false: 불일치)
     */
    boolean checkPassword(AsmtPrpApiInVO inVo);

    /**
     * 과제 제안을 등록한다.
     *
     * <pre>
     * - 과제 제안 기본 정보 등록
     * </pre>
     *
     * @param inVo 과제 제안 등록 정보 VO
     * @return 등록 결과 건수
     */
    int insertAsmtPrp(TbPpMAsmtPrpVo inVo);

    /**
     * 과제 제안 정보를 수정한다.
     *
     * <pre>
     * - 과제 제안 내용 수정 및 첨부파일 처리
     * </pre>
     *
     * @param inVo 과제 제안 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 새로 업로드할 파일 목록
     * @return 수정 결과 건수
     */
    int updateAsmtPrp(TbPpMAsmtPrpVo inVo, List<String> deleteFileIds, List<MultipartFile> files);

    /**
     * 과제 제안을 삭제한다.
     *
     * <pre>
     * - 과제 제안 정보 삭제 (논리 삭제 또는 물리 삭제)
     * </pre>
     *
     * @param inVo 과제 제안 삭제 정보 VO
     * @return 삭제 결과 건수
     */
    int deleteAsmtPrp(TbPpMAsmtPrpAnsVo inVo);

    /**
     * 과제 제안에 대한 답변 목록을 조회한다.
     *
     * <pre>
     * - 게시글 식별자(asmtPrpSn)에 해당하는 모든 답변 조회
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 답변 목록
     */
    List<AsmtPrpAnsApiOutVO> getAnswerList(long asmtPrpSn);

    /**
     * 과제 제안 답변을 등록한다.
     *
     * <pre>
     * - 과제 제안에 대한 관리자 답변 등록
     * </pre>
     *
     * @param inVo 과제 제안 답변 등록 정보 VO
     * @return 등록 결과 건수
     */
    int insertAsmtPrpAnswer(TbPpMAsmtPrpAnsVo inVo);

    /**
     * 과제 제안 답변을 수정한다.
     *
     * <pre>
     * - 답변 내용 수정 및 관련 첨부파일 업데이트
     * </pre>
     *
     * @param inVo 과제 제안 답변 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 새로 업로드할 파일 목록
     * @return 수정 결과 건수
     */
    int updateAsmtPrpAnswer(TbPpMAsmtPrpAnsVo inVo, List<String> deleteFileIds, List<MultipartFile> files);

    /**
     * 과제 제안 답변을 삭제한다.
     *
     * <pre>
     * - 답변 식별자(ansSn)를 기준으로 단건 삭제
     * </pre>
     *
     * @param ansSn 답변 식별자
     * @return 삭제 결과 건수
     */
    int deleteAsmtPrpAnswer(long ansSn);

    /**
     * 과제 제안 삭제 시 관련 답변을 일괄 비활성화한다.
     *
     * <pre>
     * - 원본 게시글 삭제 시 하위 답변들도 조회되지 않도록 처리
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 처리 결과 건수
     */
    int deleteAnswerByAsmtPrpSn(long asmtPrpSn);

    /**
     * 과제 제안 조회수를 증가시킨다.
     *
     * <pre>
     * - 상세 페이지 접근 시 게시물 조회수 1 증가
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 처리 결과 건수
     */
    int increaseViewCount(long asmtPrpSn);
}