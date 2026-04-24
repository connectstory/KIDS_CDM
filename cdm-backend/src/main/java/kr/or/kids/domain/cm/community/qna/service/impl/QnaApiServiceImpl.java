package kr.or.kids.domain.cm.community.qna.service.impl;

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
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.community.qna.mapper.QnaApiMapper;
import kr.or.kids.domain.cm.community.qna.service.QnaApiService;
import kr.or.kids.domain.cm.community.qna.vo.QnaAnsApiOutVO;
import kr.or.kids.domain.cm.community.qna.vo.QnaApiInVO;
import kr.or.kids.domain.cm.community.qna.vo.QnaApiOutVO;
import kr.or.kids.domain.cm.community.qna.vo.TbPpMQnaAnsVo;
import kr.or.kids.domain.cm.community.qna.vo.TbPpMQnaVo;
import lombok.RequiredArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

/**
 * <pre>
 * Q&A 서비스 구현체
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 */
@Service
@RequiredArgsConstructor
public class QnaApiServiceImpl implements QnaApiService {

    private final QnaApiMapper mapper;
    private final CaFileUploadService caFileUploadService;
    private final FileApiService fileApiService;
    private final CommonFileMapper commonFileMapper;
    private final DecryptApiService decryptApiService;
    private final EncryptApiService encryptApiService;
    private final PartnerMapper partnerMapper;

    /**
     * Q&A 질문 목록을 조회한다.
     *
     * <pre>
     * - 검색 조건 및 페이징 처리가 포함된 목록 조회
     * - 작성자 검색 시 resolveWriterSearchKeyword 전처리 수행
     * - 각 항목의 질문자명을 DecryptApiService 를 통해 "이름/기관명" 형식으로 변환
     * </pre>
     *
     * @param inVo 질문 목록 조회 조건 VO
     * @return 질문 목록
     */
    @Override
    public List<QnaApiOutVO> selectQnaList(QnaApiInVO inVo) {
        resolveWriterSearchKeyword(inVo);
        List<QnaApiOutVO> list = mapper.selectQnaList(inVo);

        for (QnaApiOutVO item : list) {
            Map<String, String> info = decryptApiService.getInstAndDecryptedName(item.getRgtrId());
            String instNm  = info.getOrDefault("instNm",  "");
            String mbrFlnm = info.getOrDefault("mbrFlnm", "");
            item.setQstnrNm(mbrFlnm + "/" + instNm);
        }
        return list;
    }

    /**
     * 전체 Q&A 질문 건수를 조회한다.
     *
     * <pre>
     * - 페이징 처리를 위한 전체 데이터 개수 조회
     * - 작성자 검색 시 resolveWriterSearchKeyword 전처리 수행
     * </pre>
     *
     * @param inVo 질문 목록 조회 조건 VO
     * @return 전체 건수
     */
    @Override
    public int getListCount(QnaApiInVO inVo) {
        resolveWriterSearchKeyword(inVo);
        return mapper.selectQnaListCount(inVo);
    }

    /**
     * searchType 이 'writer' 일 때 검색 키워드를 전처리한다.
     *
     * <pre>
     * - 작성자 이름을 암호화하여 encryptedWriterKeyword 세팅
     * </pre>
     *
     * @param inVo 질문 목록 조회 조건 VO
     */
    private void resolveWriterSearchKeyword(QnaApiInVO inVo) {
        if (!"writer".equals(inVo.getSearchType())) return;
        if (inVo.getSearchKeyword() == null || inVo.getSearchKeyword().isBlank()) return;

        String encrypted = encryptApiService.encryptMbrFlnm(inVo.getSearchKeyword());
        inVo.setEncryptedWriterKeyword(encrypted);
    }

    /**
     * Q&A 질문 상세 정보를 조회한다.
     *
     * <pre>
     * - 질문 식별자(qstnSn)를 기준으로 상세 정보 조회
     * - 질문자명을 DecryptApiService 를 통해 "이름/기관명" 형식으로 변환
     * - 첨부파일 목록 조회 및 응답에 포함
     * </pre>
     *
     * @param qstnSn 질문 일련번호
     * @param bbsId  게시판 ID
     * @return 질문 상세 정보, 없으면 null
     */
    @Override
    public QnaApiOutVO selectQnaDetail(long qstnSn, String bbsId) {

        QnaApiInVO vo = new QnaApiInVO();
        vo.setQstnSn(qstnSn);
        vo.setBbsId(bbsId);

        QnaApiOutVO detail = mapper.selectQnaDetail(vo);
        if (detail != null) {
            Map<String, String> info = decryptApiService.getInstAndDecryptedName(detail.getRgtrId());
            String instNm  = info.getOrDefault("instNm",  "");
            String mbrFlnm = info.getOrDefault("mbrFlnm", "");
            detail.setQstnrNm(mbrFlnm + "/" + instNm);
            detail.setFileList( buildFileList(qstnSn, FileCodeType.QNA) );
        }
        return detail;
    }

    /**
     * 비밀번호 일치 여부를 확인한다.
     *
     * <pre>
     * - 게시글 수정을 위한 비밀번호 확인
     * </pre>
     *
     * @param inVo 질문 정보 VO
     * @return 비밀번호 일치 여부 (true: 일치, false: 불일치)
     */
    @Override
    public boolean checkPassword(QnaApiInVO inVo) {
        int count = mapper.checkPassword(inVo);
        return count > 0;
    }

    /**
     * Q&A 질문을 등록한다.
     *
     * <pre>
     * - 질문 기본 정보 저장
     * - 첨부파일이 존재하는 경우 CA API 를 통해 업로드 및 연계 처리
     * </pre>
     *
     * @param inVo 질문 등록 정보 VO
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int insertQna(TbPpMQnaVo inVo) {
        mapper.insertQna(inVo);

        // 2. 파일 업로드
        List<MultipartFile> files = inVo.getFiles();
        if (files != null && !files.isEmpty()) {
            caFileUploadService.uploadWithCaAndUld( inVo.getQstnSn(), null, files, inVo.getRgtrId(), "cm", "06", "10" );
        }

        return 1;
    }

    /**
     * Q&A 질문 정보를 수정한다.
     *
     * <pre>
     * - 삭제 대상 파일 ID 목록이 있는 경우 CA API 를 통해 개별 삭제 처리
     * - 신규 파일이 있는 경우 CA API 를 통해 업로드 및 연계 처리
     * - 질문 기본 정보 수정
     * </pre>
     *
     * @param inVo          질문 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files         새로 업로드할 파일 목록
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int updateQna(TbPpMQnaVo inVo, List<String> deleteFileIds, List<MultipartFile> files) {
        long qstnSn = inVo.getQstnSn();

        // 1. 개별 파일 삭제 처리 (CA API 호출)
        if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
            Map<String, String> fileIndex = buildFileIdToGroupIdIndex(qstnSn, FileCodeType.QNA);
            for (String fileId : deleteFileIds) {
                String groupId = fileIndex.get(fileId);
                if (groupId != null) {
                    fileApiService.deleteFileOne(fileId, groupId);
                }
            }
        }

        // 2. 신규 파일 업로드
        if (files != null && !files.isEmpty()) {
            String groupId = caFileUploadService.uploadWithCaAndUld( inVo.getQstnSn(), null, files, inVo.getMdfrId(), "cm", "06", "10" );
            inVo.setAtchFileGroupId(groupId);
        }

        return mapper.updateQna(inVo);
    }

    /**
     * Q&A 질문을 삭제한다.
     *
     * <pre>
     * - 질문 첨부파일 CA API 삭제
     * - 답변 첨부파일 CA API 삭제
     * - 하위 답변 일괄 삭제 후 질문 삭제
     * </pre>
     *
     * @param inVo 질문 삭제 정보 VO
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int deleteQna(TbPpMQnaAnsVo inVo) {

        // 질문 파일 삭제
        deleteAllFilesByPstSn(inVo.getQstnSn(), FileCodeType.QNA);

        // 답변 파일 삭제
        deleteAllFilesByPstSn(inVo.getAnsSn(), FileCodeType.QNA_REPLY);

        // 답변 삭제
        mapper.deleteAnswerByQstnSn(inVo.getQstnSn());

        // 질문 삭제
        return mapper.deleteQna(inVo.getQstnSn());
    }

    /**
     * Q&A 답변 정보를 조회한다.
     *
     * <pre>
     * - 질문 식별자(qstnSn)를 기준으로 답변 1건 조회
     * - 답변자명을 PartnerMapper 를 통해 "이름/부서명" 형식으로 변환
     * - 첨부파일 목록 조회 및 응답에 포함
     * </pre>
     *
     * @param qstnSn 질문 일련번호
     * @return 답변 정보, 없으면 null
     */
    @Override
    public QnaAnsApiOutVO selectQnaAnswer(long qstnSn) {
        QnaAnsApiOutVO ansData = mapper.selectQnaAnswer(qstnSn);
        if (ansData != null) {
            Map<String, String> empInfo = partnerMapper.selectEmpInfoByEmpNo(ansData.getRgtrId());
            if (empInfo != null) {
                String empNm  = empInfo.getOrDefault("empNm",  "");
                String deptNm = empInfo.getOrDefault("deptNm", "");
                ansData.setAnsNm(empNm + "/" + deptNm);
            }
            ansData.setFileList( buildFileList(ansData.getAnsSn(), FileCodeType.QNA_REPLY) );
        }
        return ansData;
    }

    /**
     * Q&A 답변을 등록한다.
     *
     * <pre>
     * - 답변 기본 정보 저장
     * - 질문 상태를 답변 완료로 변경
     * - 첨부파일이 존재하는 경우 CA API 를 통해 업로드 및 연계 처리
     * </pre>
     *
     * @param inVo 답변 등록 정보 VO
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int insertQnaAnswer(TbPpMQnaAnsVo inVo) {
        mapper.insertQnaAnswer(inVo);
        mapper.updateQnaStatusAnswered(inVo.getQstnSn());

        // 2. 파일 업로드
        List<MultipartFile> files = inVo.getFiles();
        if (files != null && !files.isEmpty()) {
            caFileUploadService.uploadWithCaAndUld( inVo.getAnsSn(), null, files, inVo.getRgtrId(), "cm", "06", "11" );
        }

        return 1;
    }

    /**
     * Q&A 답변 정보를 수정한다.
     *
     * <pre>
     * - 삭제 대상 파일 ID 목록이 있는 경우 CA API 를 통해 개별 삭제 처리
     * - 신규 파일이 있는 경우 CA API 를 통해 업로드 및 연계 처리
     * - 답변 기본 정보 수정
     * </pre>
     *
     * @param inVo          답변 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files         새로 업로드할 파일 목록
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int updateQnaAnswer(TbPpMQnaAnsVo inVo, List<String> deleteFileIds, List<MultipartFile> files) {
        long ansSn = inVo.getAnsSn();

        // 1. 개별 파일 삭제 처리 (CA API 호출)
        if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
            Map<String, String> fileIndex = buildFileIdToGroupIdIndex(ansSn, FileCodeType.QNA_REPLY);
            for (String fileId : deleteFileIds) {
                String groupId = fileIndex.get(fileId);
                if (groupId != null) {
                    fileApiService.deleteFileOne(fileId, groupId);
                }
            }
        }

        // 2. 신규 파일 업로드
        if (files != null && !files.isEmpty()) {
            String groupId = caFileUploadService.uploadWithCaAndUld( inVo.getAnsSn(), null, files, inVo.getMdfrId(), "cm", "06", "11" );
            inVo.setAtchFileGroupId(groupId);
        }

        return mapper.updateQnaAnswer(inVo);
    }

    /**
     * Q&A 답변을 삭제한다.
     *
     * <pre>
     * - 답변 첨부파일 CA API 삭제
     * - 답변 삭제 후 질문 상태를 답변 대기로 변경
     * </pre>
     *
     * @param inVo 답변 삭제 정보 VO
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int deleteQnaAnswer(TbPpMQnaAnsVo inVo) {
        // 답변 파일 삭제
        deleteAllFilesByPstSn(inVo.getAnsSn(), FileCodeType.QNA_REPLY);

        int result = mapper.deleteQnaAnswer(inVo);
        mapper.updateQnaStatusWaiting(inVo.getQstnSn());
        return result;
    }

    /**
     * Q&A 조회수를 증가시킨다.
     *
     * <pre>
     * - 질문 상세 페이지 접근 시 호출
     * - 조회수 1 증가
     * </pre>
     *
     * @param qstnSn 질문 일련번호
     * @return 처리 건수
     */
    @Override
    public int increaseViewCount(long qstnSn) {
        return mapper.updateQnaViewCount(qstnSn);
    }

    /**
     * 게시글 식별자로 파일 ID → 그룹 ID 인덱스를 생성한다.
     *
     * <pre>
     * - 파일 삭제 시 fileId 로 groupId 를 빠르게 조회하기 위한 Map 생성
     * </pre>
     *
     * @param pstSn        게시글 일련번호
     * @param fileCodeType 파일 구분 코드 타입
     * @return fileId → groupId 매핑 Map
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
     * 게시글에 연결된 첨부파일 목록을 조회한다.
     *
     * <pre>
     * - CA API 를 통해 파일 그룹별 파일 목록 조회
     * </pre>
     *
     * @param pstSn        게시글 일련번호
     * @param fileCodeType 파일 구분 코드 타입
     * @return 첨부파일 목록
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
     * 게시글에 연결된 모든 첨부파일을 삭제한다.
     *
     * <pre>
     * - CA API 를 통해 파일 그룹 단위로 일괄 삭제
     * </pre>
     *
     * @param pstSn        게시글 일련번호
     * @param fileCodeType 파일 구분 코드 타입
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
