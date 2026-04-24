package kr.or.kids.domain.cm.community.asmtprp.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.common.mapper.CommonFileMapper;
import kr.or.kids.domain.cm.common.mapper.PartnerMapper;
import kr.or.kids.domain.cm.common.service.CaFileUploadService;
import kr.or.kids.domain.cm.common.service.DecryptApiService;
import kr.or.kids.domain.cm.common.service.EncryptApiService;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;
import kr.or.kids.global.type.CmTaskCodeType;
import kr.or.kids.global.type.FileCodeType;
import org.springframework.stereotype.Service;

import kr.or.kids.domain.cm.community.asmtprp.mapper.AsmtPrpApiMapper;
import kr.or.kids.domain.cm.community.asmtprp.service.AsmtPrpApiService;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpAnsApiOutVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpApiInVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.AsmtPrpApiOutVO;
import kr.or.kids.domain.cm.community.asmtprp.vo.TbPpMAsmtPrpAnsVo;
import kr.or.kids.domain.cm.community.asmtprp.vo.TbPpMAsmtPrpVo;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * <pre>
 * 과제 제안 서비스 구현 클래스
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
public class AsmtPrpApiServiceImpl implements AsmtPrpApiService {

    private final AsmtPrpApiMapper mapper;
    private final CaFileUploadService caFileUploadService;
    private final FileApiService fileApiService;
    private final CommonFileMapper commonFileMapper;
    private final DecryptApiService decryptApiService;
    private final EncryptApiService encryptApiService;
    private final PartnerMapper partnerMapper;

    /**
     * 과제 제안 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건에 따른 목록 조회 및 페이징 처리
     * - 작성자 정보(기관명/이름) 복호화 처리
     * </pre>
     *
     * @param inVo 과제 제안 목록 조회 조건 VO
     * @return 과제 제안 목록
     */
    @Override
    public List<AsmtPrpApiOutVO> getList(AsmtPrpApiInVO inVo) {
        resolveWriterSearchKeyword(inVo);
        List<AsmtPrpApiOutVO> list = mapper.selectAsmtPrpList(inVo);
        for (AsmtPrpApiOutVO item : list) {
            Map<String, String> info = decryptApiService.getInstAndDecryptedName(item.getRgtrId());
            String instNm  = info.getOrDefault("instNm",  "");
            String mbrFlnm = info.getOrDefault("mbrFlnm", "");
            item.setAsmtPrpsrNm(mbrFlnm + "/" + instNm);
        }
        return list;
    }

    /**
     * 전체 과제 제안 건수를 조회한다.
     *
     * @param inVo 과제 제안 목록 조회 조건 VO
     * @return 전체 건수
     */
    @Override
    public int getListCount(AsmtPrpApiInVO inVo) {
        resolveWriterSearchKeyword(inVo);
        return mapper.selectAsmtPrpListCount(inVo);
    }

    /**
     * 작성자 검색 시 검색어를 암호화하여 세팅한다.
     *
     * <pre>
     * - searchType이 'writer'인 경우 검색 키워드를 암호화하여 DB 비교 용도로 사용
     * </pre>
     *
     * @param inVo 과제 제안 목록 조회 조건 VO
     */
    private void resolveWriterSearchKeyword(AsmtPrpApiInVO inVo) {
        if (!"writer".equals(inVo.getSearchType())) return;
        if (inVo.getSearchKeyword() == null || inVo.getSearchKeyword().isBlank()) return;

        String encrypted = encryptApiService.encryptMbrFlnm(inVo.getSearchKeyword());
        inVo.setEncryptedWriterKeyword(encrypted);
    }

    /**
     * 과제 제안 상세 정보를 조회한다.
     *
     * <pre>
     * - 상세 데이터 조회 및 작성자 정보 복호화
     * - 게시글에 첨부된 파일 목록 조회 및 구성
     * </pre>
     *
     * @param inVo 과제 제안 상세 조회 조건 VO
     * @return 과제 제안 상세 정보
     */
    @Override
    public AsmtPrpApiOutVO getDetail(AsmtPrpApiInVO inVo) {
        AsmtPrpApiOutVO detail = mapper.selectAsmtPrpDetail(inVo.getAsmtPrpSn());
        if (detail != null) {
            Map<String, String> info = decryptApiService.getInstAndDecryptedName(detail.getRgtrId());
            String instNm  = info.getOrDefault("instNm",  "");
            String mbrFlnm = info.getOrDefault("mbrFlnm", "");
            detail.setAsmtPrpsrNm(mbrFlnm + "/" + instNm);
            detail.setFileList(buildFileList(inVo.getAsmtPrpSn(), FileCodeType.RESEARCH_PROPOSAL));
        }
        return detail;
    }

    /**
     * 비밀번호를 확인한다.
     *
     * @param inVo 과제 제안 정보 VO
     * @return 일치 여부
     */
    @Override
    public boolean checkPassword(AsmtPrpApiInVO inVo) {
        int count = mapper.checkPassword(inVo);
        return count > 0;
    }

    /**
     * 과제 제안을 등록한다.
     *
     * <pre>
     * - 기본 정보 저장
     * - 첨부파일 존재 시 CA API를 통한 파일 업로드 처리
     * </pre>
     *
     * @param inVo 과제 제안 등록 정보 VO
     * @return 등록 결과 건수
     */
    @Override
    @Transactional
    public int insertAsmtPrp(TbPpMAsmtPrpVo inVo) {
        mapper.insertAsmtPrp(inVo);

        List<MultipartFile> files = inVo.getFiles();
        if (files != null && !files.isEmpty()) {
            caFileUploadService.uploadWithCaAndUld(inVo.getAsmtPrpSn(), null, files, inVo.getRgtrId(), "cm", "06", "12");
        }

        return 1;
    }

    /**
     * 과제 제안 정보를 수정한다.
     *
     * <pre>
     * - 요청된 삭제 대상 파일 물리 삭제 처리
     * - 신규 파일 업로드 및 게시글 정보 업데이트
     * </pre>
     *
     * @param inVo 과제 제안 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 신규 추가 파일 목록
     * @return 수정 결과 건수
     */
    @Override
    @Transactional
    public int updateAsmtPrp(TbPpMAsmtPrpVo inVo, List<String> deleteFileIds, List<MultipartFile> files) {
        long asmtPrpSn = inVo.getAsmtPrpSn();

        if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
            Map<String, String> fileIndex = buildFileIdToGroupIdIndex(asmtPrpSn, FileCodeType.RESEARCH_PROPOSAL);
            for (String fileId : deleteFileIds) {
                String groupId = fileIndex.get(fileId);
                if (groupId != null) {
                    fileApiService.deleteFileOne(fileId, groupId);
                }
            }
        }

        if (files != null && !files.isEmpty()) {
            String groupId = caFileUploadService.uploadWithCaAndUld(inVo.getAsmtPrpSn(), null, files, inVo.getMdfrId(), "cm", "06", "12");
            inVo.setAtchFileGroupId(groupId);
        }

        return mapper.updateAsmtPrp(inVo);
    }

    /**
     * 과제 제안을 삭제한다.
     *
     * <pre>
     * - 질문(제안) 게시글과 연결된 모든 파일 삭제
     * - 해당 질문에 대한 답변 파일 일괄 삭제
     * - 게시글 데이터 삭제
     * </pre>
     *
     * @param inVo 과제 제안 삭제 정보 VO
     * @return 삭제 결과 건수
     */
    @Override
    @Transactional
    public int deleteAsmtPrp(TbPpMAsmtPrpAnsVo inVo) {
        deleteAllFilesByPstSn(inVo.getAsmtPrpSn(), FileCodeType.RESEARCH_PROPOSAL);
        deleteAllFilesByPstSn(inVo.getAnsSn(), FileCodeType.RESEARCH_PROPOSAL_REPLY);

        mapper.deleteAnswerByAsmtPrpSn(inVo.getAsmtPrpSn());

        return mapper.deleteAsmtPrp(inVo.getAsmtPrpSn());
    }

    /**
     * 과제 제안 답변 목록을 조회한다.
     *
     * <pre>
     * - 답변 정보 및 관리자(담당자) 이름/부서 정보 조회
     * - 답변별 첨부파일 목록 구성
     * </pre>
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 답변 목록
     */
    @Override
    public List<AsmtPrpAnsApiOutVO> getAnswerList(long asmtPrpSn) {
        List<AsmtPrpAnsApiOutVO> answers = mapper.selectAsmtPrpAnswer(asmtPrpSn);
        if (answers != null) {
            for (AsmtPrpAnsApiOutVO ans : answers) {
                Map<String, String> empInfo = partnerMapper.selectEmpInfoByEmpNo(ans.getRgtrId());
                if (empInfo != null) {
                    String empNm  = empInfo.getOrDefault("empNm",  "");
                    String deptNm = empInfo.getOrDefault("deptNm", "");
                    ans.setAnsNm(empNm + "/" + deptNm);
                }
                ans.setFileList(buildFileList(ans.getAnsSn(), FileCodeType.RESEARCH_PROPOSAL_REPLY));
            }
        }
        return answers;
    }

    /**
     * 과제 제안 답변을 등록한다.
     *
     * <pre>
     * - 답변 정보 저장 및 원본 게시글 상태 '답변완료' 변경
     * - 답변 관련 첨부파일 업로드
     * </pre>
     *
     * @param inVo 답변 등록 정보 VO
     * @return 등록 결과 건수
     */
    @Override
    @Transactional
    public int insertAsmtPrpAnswer(TbPpMAsmtPrpAnsVo inVo) {
        mapper.insertAsmtPrpAnswer(inVo);
        mapper.updateAsmtPrpStatusAnswered(inVo.getAsmtPrpSn());

        List<MultipartFile> files = inVo.getFiles();
        if (files != null && !files.isEmpty()) {
            caFileUploadService.uploadWithCaAndUld(inVo.getAnsSn(), null, files, inVo.getRgtrId(), "cm", "06", "13");
        }

        return 1;
    }

    /**
     * 과제 제안 답변을 수정한다.
     *
     * <pre>
     * - 답변 내용 수정 및 파일 삭제/추가 처리
     * </pre>
     *
     * @param inVo 답변 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files 신규 추가 파일 목록
     * @return 수정 결과 건수
     */
    @Override
    @Transactional
    public int updateAsmtPrpAnswer(TbPpMAsmtPrpAnsVo inVo, List<String> deleteFileIds, List<MultipartFile> files) {
        long ansSn = inVo.getAnsSn();

        if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
            Map<String, String> fileIndex = buildFileIdToGroupIdIndex(ansSn, FileCodeType.RESEARCH_PROPOSAL_REPLY);
            for (String fileId : deleteFileIds) {
                String groupId = fileIndex.get(fileId);
                if (groupId != null) {
                    fileApiService.deleteFileOne(fileId, groupId);
                }
            }
        }

        if (files != null && !files.isEmpty()) {
            String groupId = caFileUploadService.uploadWithCaAndUld(inVo.getAnsSn(), null, files, inVo.getMdfrId(), "cm", "06", "13");
            inVo.setAtchFileGroupId(groupId);
        }

        return mapper.updateAsmtPrpAnswer(inVo);
    }

    /**
     * 과제 제안 답변을 삭제한다.
     *
     * <pre>
     * - 답변 파일 삭제 및 데이터 삭제
     * - 원본 게시글의 상태를 '답변대기'로 복구
     * </pre>
     *
     * @param ansSn 답변 식별자
     * @return 삭제 결과 건수
     */
    @Override
    @Transactional
    public int deleteAsmtPrpAnswer(long ansSn) {
        long asmtPrpSn = mapper.selectAsmtPrpSnByAnsSn(ansSn);

        deleteAllFilesByPstSn(ansSn, FileCodeType.RESEARCH_PROPOSAL_REPLY);

        int result = mapper.deleteAsmtPrpAnswer(ansSn);

        mapper.updateAsmtPrpStatusWaiting(asmtPrpSn);

        return result;
    }

    /**
     * 과제 제안 삭제 시 답변을 일괄 비활성화한다.
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 처리 결과 건수
     */
    @Override
    @Transactional
    public int deleteAnswerByAsmtPrpSn(long asmtPrpSn) {
        return mapper.deleteAnswerByAsmtPrpSn(asmtPrpSn);
    }

    /**
     * 조회수를 증가시킨다.
     *
     * @param asmtPrpSn 과제 제안 식별자
     * @return 수정 결과 건수
     */
    @Override
    @Transactional
    public int increaseViewCount(long asmtPrpSn) {
        return mapper.updateAsmtPrpViewCount(asmtPrpSn);
    }

    /**
     * 파일 ID와 그룹 ID 간의 매핑 인덱스를 생성한다. (내부 헬퍼 메서드)
     *
     * @param pstSn 게시물 식별자
     * @param fileCodeType 파일 코드 타입
     * @return 파일 ID를 키로, 그룹 ID를 값으로 갖는 맵
     */
    private Map<String, String> buildFileIdToGroupIdIndex(long pstSn, FileCodeType fileCodeType) {
        List<TbCmMFileUldVO> ulds = commonFileMapper.selectFileUldList(pstSn, CmTaskCodeType.COMMUNITY.code(), fileCodeType.code());
        Map<String, String> index = new HashMap<>();
        if (ulds == null) return index;
        for (TbCmMFileUldVO uld : ulds) {
            String groupId = uld.getAtchFileId();
            if (groupId == null || groupId.isBlank()) continue;
            for (CaFileItem item : FileApiService.toCaFileItemsFromCa(fileApiService, groupId)) {
                index.putIfAbsent(item.atchFileId(), groupId);
            }
        }
        return index;
    }

    /**
     * 게시물에 연관된 파일 목록을 빌드한다. (내부 헬퍼 메서드)
     *
     * @param pstSn 게시물 식별자
     * @param fileCodeType 파일 코드 타입
     * @return CA 파일 정보 목록
     */
    private List<CaFileItem> buildFileList(Long pstSn, FileCodeType fileCodeType) {
        List<CaFileItem> fileList = new ArrayList<>();
        List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldList(pstSn, CmTaskCodeType.COMMUNITY.code(), fileCodeType.code());
        for (TbCmMFileUldVO uld : uldList) {
            String groupId = uld.getAtchFileId();
            String fileSeCd = uld.getFileSeCd();
            if (groupId == null || groupId.isBlank() || fileSeCd == null) continue;
            fileList.addAll(FileApiService.toCaFileItemsFromCa(fileApiService, groupId));
        }
        return fileList;
    }

    /**
     * 게시물 식별자를 기준으로 모든 연관 파일을 삭제한다. (내부 헬퍼 메서드)
     *
     * @param pstSn 게시물 식별자
     * @param fileCodeType 파일 코드 타입
     */
    private void deleteAllFilesByPstSn(Long pstSn, FileCodeType fileCodeType) {
        if (pstSn == null) return;
        List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldList(pstSn, CmTaskCodeType.COMMUNITY.code(), fileCodeType.code());
        for (TbCmMFileUldVO uld : uldList) {
            String groupId = uld.getAtchFileId();
            if (groupId == null || groupId.isBlank()) continue;
            fileApiService.deleteGroupFiles(groupId);
        }
    }
}