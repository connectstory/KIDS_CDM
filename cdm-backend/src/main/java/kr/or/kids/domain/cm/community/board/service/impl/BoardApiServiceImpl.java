package kr.or.kids.domain.cm.community.board.service.impl;

import kr.or.kids.domain.cm.common.dto.CaFileItem;
import kr.or.kids.domain.cm.common.mapper.CommonFileMapper;
import kr.or.kids.domain.cm.common.mapper.PartnerMapper;
import kr.or.kids.domain.cm.common.service.CaFileUploadService;
import kr.or.kids.domain.cm.common.service.DecryptApiService;
import kr.or.kids.domain.cm.common.service.EncryptApiService;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;
import kr.or.kids.domain.cm.community.board.mapper.BoardApiMapper;
import kr.or.kids.domain.cm.community.board.service.BoardApiService;
import kr.or.kids.domain.cm.community.board.vo.BoardApiInVO;
import kr.or.kids.domain.cm.community.board.vo.BoardApiOutVO;
import kr.or.kids.domain.cm.community.board.vo.TbPpMPstVo;
import kr.or.kids.domain.cm.research.dto.CommentCreateRequest;
import kr.or.kids.domain.cm.research.dto.CommentResponse;
import kr.or.kids.domain.cm.research.dto.CommentUpdateRequest;
import kr.or.kids.domain.cm.research.vo.CommentRowVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtCmntVO;
import kr.or.kids.global.type.CmTaskCodeType;
import kr.or.kids.global.type.FileCodeType;
import kr.or.kids.global.type.YnFlagType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * <pre>
 * 게시판 서비스 구현체
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.2
 *
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BoardApiServiceImpl implements BoardApiService {

    private final BoardApiMapper mapper;
    private final CaFileUploadService caFileUploadService;
    private final FileApiService fileApiService;
    private final CommonFileMapper commonFileMapper;
    private final DecryptApiService decryptApiService;
    private final EncryptApiService encryptApiService;
    private final PartnerMapper partnerMapper;

    private static final String PARTNER_BBS_ID = "CDM0000007";

    /**
     * rgtrId 를 기반으로 작성자 표시명을 반환한다.
     *
     * <pre>
     * - CDM0000007(협력기관 게시판): DecryptApiService → "mbrFlnm"
     * - 그 외(내부 게시판): PartnerMapper → "empNm"
     * </pre>
     *
     * @param bbsId  게시판 ID
     * @param rgtrId 작성자 ID (회원번호 또는 사번)
     * @return 작성자 표시명
     */
    private String resolveRgtrLabel(String bbsId, String rgtrId) {
        if (rgtrId == null || rgtrId.isBlank()) return rgtrId;
        if (PARTNER_BBS_ID.equals(bbsId)) {
            Map<String, String> info = decryptApiService.getInstAndDecryptedName(rgtrId);
            if (info == null) return rgtrId;
            return info.getOrDefault("mbrFlnm", "");
        } else {
            Map<String, String> info = partnerMapper.selectEmpInfoByEmpNo(rgtrId);
            if (info == null) return rgtrId;
            return info.getOrDefault("empNm",  "");
        }
    }

    /**
     * 게시판 게시글 목록을 조회한다.
     *
     * <pre>
     * - 게시판 유형(bbsId)에 따른 게시글 목록 조회
     * - 검색 조건(제목/내용/작성자) 처리
     * - 작성자 검색 시 resolveWriterSearchKeyword 전처리 수행
     * - 목록 각 항목의 작성자명을 resolveRgtrLabel 로 변환
     * </pre>
     *
     * @param inVo 게시글 목록 조회 조건 VO
     * @return 게시글 목록
     */
    @Override
    public List<BoardApiOutVO> getList(BoardApiInVO inVo)  {
        resolveWriterSearchKeyword(inVo);
        List<BoardApiOutVO> list = mapper.selectBoardList(inVo);
        String bbsId = inVo.getBbsId();
        for (BoardApiOutVO item : list) {
            item.setRgtrId(resolveRgtrLabel(bbsId, item.getRgtrId()));
        }
        return list;
    }

    /**
     * 전체 게시글 건수를 조회한다.
     *
     * <pre>
     * - 페이징 처리를 위한 전체 데이터 개수 조회
     * - 작성자 검색 시 resolveWriterSearchKeyword 전처리 수행
     * </pre>
     *
     * @param inVo 게시글 목록 조회 조건 VO
     * @return 전체 건수
     */
    @Override
    public int getListCount(BoardApiInVO inVo)  {
        resolveWriterSearchKeyword(inVo);
        return mapper.selectBoardListCount(inVo);
    }

    /**
     * searchType 이 'writer' 일 때 검색 키워드를 전처리한다.
     *
     * <pre>
     * - 협력기관 게시판: 이름을 암호화하여 encryptedWriterKeyword 세팅
     * - 내부 게시판: searchKeyword 그대로 사용 (emp_nm 검색)
     * </pre>
     *
     * @param inVo 게시글 목록 조회 조건 VO
     */
    private void resolveWriterSearchKeyword(BoardApiInVO inVo) {
        if (!"writer".equals(inVo.getSearchType())) return;
        if (inVo.getSearchKeyword() == null || inVo.getSearchKeyword().isBlank()) return;

        if (PARTNER_BBS_ID.equals(inVo.getBbsId())) {
            String encrypted = encryptApiService.encryptMbrFlnm(inVo.getSearchKeyword());
            inVo.setEncryptedWriterKeyword(encrypted);
        }
    }

    /**
     * 게시판 게시글 상세 정보를 조회한다.
     *
     * <pre>
     * - 게시글 식별자(pstSn)를 기준으로 상세 정보 조회
     * - 작성자 표시명을 bbsId 기준으로 변환
     * - 첨부파일 목록 조회 및 응답에 포함
     * </pre>
     *
     * @param inVo 게시글 상세 조회 조건 VO
     * @return 게시글 상세 정보, 없으면 null
     */
    @Override
    public BoardApiOutVO getDetail(BoardApiInVO inVo)  {
        long pstSn = inVo.getPstSn();

        BoardApiOutVO boardData = mapper.selectBoardDetail(pstSn);
        if (boardData == null) {
            return null;
        }

        // 작성자 표시명 처리 (bbsId에 따라 협력기관/내부직원 구분)
        boardData.setRgtrId(resolveRgtrLabel(boardData.getBbsId(), boardData.getRgtrId()));

        // 첨부파일 목록 조회 (fileSeCd 14: RESEARCH_ATTACHED 첨부파일, 05: RESEARCH_QUERIES 분석질의)
        List<CaFileItem> fileList = new ArrayList<>();
        List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldList( pstSn, CmTaskCodeType.COMMUNITY.code(), FileCodeType.BOARD.code() );
        for (TbCmMFileUldVO uld : uldList) {
            String groupId = uld.getAtchFileId();
            String fileSeCd = uld.getFileSeCd();
            if (groupId == null || groupId.isBlank() || fileSeCd == null) {
                continue;
            }
            fileList.addAll(FileApiService.toCaFileItemsFromCa( fileApiService, groupId ));
        }

        boardData.setFileList(fileList);

        return boardData;
    }

    /**
     * 게시판 게시글을 등록한다.
     *
     * <pre>
     * - 게시글 기본 정보 저장
     * - 첨부파일이 존재하는 경우 CA API 를 통해 업로드 및 연계 처리
     * </pre>
     *
     * @param inVo 게시글 등록 정보 VO
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int insertBoard(TbPpMPstVo inVo)  {

        // 1. 게시글 먼저 insert → pstSn 생성
        mapper.insertBoard(inVo);

        // 2. 파일 업로드
        List<MultipartFile> files = inVo.getFiles();
        if (files != null && !files.isEmpty()) {
            caFileUploadService.uploadWithCaAndUld( inVo.getPstSn(), null, files, inVo.getRgtrId(), "cm", "06", "09" );
        }

        return 1;
    }

    /**
     * 게시판 게시글 정보를 수정한다.
     *
     * <pre>
     * - 삭제 대상 파일 ID 목록이 있는 경우 CA API 를 통해 개별 삭제 처리
     * - 신규 파일이 있는 경우 CA API 를 통해 업로드 및 연계 처리
     * - 게시글 기본 정보 수정
     * </pre>
     *
     * @param inVo          게시글 수정 정보 VO
     * @param deleteFileIds 삭제 대상 파일 ID 목록
     * @param files         새로 업로드할 파일 목록
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int updateBoard(TbPpMPstVo inVo, List<String> deleteFileIds, List<MultipartFile> files)  {

        long pstSn = inVo.getPstSn();

        // 1. 개별 파일 삭제 처리 (CA API 호출)
        if (deleteFileIds != null && !deleteFileIds.isEmpty()) {
            Map<String, String> fileIndex = buildFileIdToGroupIdIndex(pstSn);
            for (String fileId : deleteFileIds) {
                String groupId = fileIndex.get(fileId);
                if (groupId != null) {
                    fileApiService.deleteFileOne(fileId, groupId);
                }
            }
        }

        // 2. 신규 파일 업로드
        if (files != null && !files.isEmpty()) {
            String groupId = caFileUploadService.uploadWithCaAndUld( inVo.getPstSn(), null, files, inVo.getMdfrId(), "cm", "06", "09" );
            inVo.setAtchFileGroupId(groupId);
        }

        // 3. 게시글 수정
        return mapper.updateBoard(inVo);
    }

    /**
     * 게시판 게시글을 삭제한다.
     *
     * <pre>
     * - 게시글에 연결된 첨부파일 그룹을 CA API 를 통해 삭제
     * - 게시글 삭제 처리
     * </pre>
     *
     * @param inVo 게시글 삭제 정보 VO
     * @return 처리 건수
     */
    @Override
    @Transactional
    public int deleteBoard(TbPpMPstVo inVo)  {
        long pstSn = inVo.getPstSn();

        // 1. 게시글에 연결된 파일 그룹들 조회
        List<TbCmMFileUldVO> uldList = commonFileMapper.selectFileUldList(pstSn, CmTaskCodeType.COMMUNITY.code(), FileCodeType.BOARD.code());

        // 2. CA API로 파일 그룹 삭제
        for (TbCmMFileUldVO uld : uldList) {
            String groupId = uld.getAtchFileId();
            if (groupId == null || groupId.isBlank()) continue;
            fileApiService.deleteGroupFiles(groupId);
        }

        // 3. 게시글 삭제
        return mapper.deleteBoard(pstSn);
    }

    /**
     * 게시판 조회수를 증가시킨다.
     *
     * <pre>
     * - 게시글 상세 페이지 접근 시 호출
     * - 조회수(pst_inq_cnt) 1 증가
     * </pre>
     *
     * @param pstSn 게시글 일련번호
     * @return 처리 건수
     */
    @Override
    public int increaseViewCount(long pstSn) {
        return mapper.updateBoardViewCount(pstSn);
    }

    /**
     * 게시글 식별자로 파일 ID → 그룹 ID 인덱스를 생성한다.
     *
     * <pre>
     * - 파일 삭제 시 fileId 로 groupId 를 빠르게 조회하기 위한 Map 생성
     * </pre>
     *
     * @param pstSn 게시글 일련번호
     * @return fileId → groupId 매핑 Map
     */
    private Map<String, String> buildFileIdToGroupIdIndex(long pstSn) {
        List<TbCmMFileUldVO> ulds = commonFileMapper.selectFileUldList(pstSn, CmTaskCodeType.COMMUNITY.code(), FileCodeType.BOARD.code());
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
     * 게시판 댓글 목록을 조회한다.
     *
     * <pre>
     * - 게시글 식별자(pstSn)와 게시판 ID(bbsId) 기준으로 댓글 목록 조회
     * - 내부직원(empNm 존재): mbrNm 을 null 로 처리
     * - 협력기관 회원(mbrNm 존재): DecryptApiService 를 통해 이름 복호화
     * </pre>
     *
     * @param pstSn 게시글 일련번호
     * @param bbsId 게시판 ID
     * @return 댓글 목록
     */
    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> searchComments( Long pstSn, String bbsId ) {
        List<CommentRowVO> rows = mapper.selectBoardComments( pstSn, bbsId );
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        List<CommentResponse> comments = rows.stream().map( CommentResponse::from ).toList();
        for (CommentResponse c : comments) {
            String empNm = c.getEmpNm();
            if (empNm != null && !empNm.isBlank()) {
                c.setMbrNm( null );
                continue;
            }
            if (c.getMbrNm() != null && !c.getMbrNm().isBlank()) {
                c.setMbrNm( decryptApiService.decryptMbrFlnm( c.getMbrNm() ) );
            }
        }
        return comments;
    }

    /**
     * 게시판 댓글을 등록한다.
     *
     * <pre>
     * - 댓글 내용 유효성 검사
     * - 최상위 댓글 또는 대댓글 여부에 따라 cmntAnsSn, cmntAnsDepth 계산
     * - 등록 후 생성된 댓글 정보 반환
     * </pre>
     *
     * @param pstSn   게시글 일련번호
     * @param bbsId   게시판 ID
     * @param userNo  등록자 회원번호
     * @param instId  기관 ID
     * @param request 댓글 등록 요청 DTO
     * @return 등록된 댓글 정보
     */
    @Override
    @Transactional
    public CommentResponse createComment( Long pstSn, String bbsId, String userNo, String instId, CommentCreateRequest request ) {
        if (request.getCmntDtlCn() == null || request.getCmntDtlCn().trim().isEmpty()) {
            throw new IllegalArgumentException( "댓글 내용을 입력해 주세요." );
        }
        LocalDateTime now = LocalDateTime.now();
        TbCmMAsmtCmntVO vo = new TbCmMAsmtCmntVO();
        vo.setAsmtSn( pstSn );
        vo.setBbsId( bbsId );
        // inst_id NOT NULL 제약: instId가 없는 일반 회원은 userNo로 대체
        vo.setInstId( (instId != null && !instId.isBlank()) ? instId : userNo );
        vo.setCmntDtlCn( request.getCmntDtlCn().trim() );
        vo.setDelYn( YnFlagType.N.code() );
        vo.setRgtrId( userNo );
        vo.setRegDt( now );
        vo.setMdfrId( userNo );
        vo.setMdfcnDt( now );

        Long upCmntAnsSn = request.getUpCmntAnsSn();
        if (upCmntAnsSn == null) {
            vo.setOrgnlUpCmntAnsSn( null );
            vo.setUpCmntAnsSn( null );
            vo.setCmntAnsDepth( 0L );
            vo.setCmntAnsSn( mapper.nextBoardCmntAnsSn( pstSn, bbsId, null ) );
        } else {
            TbCmMAsmtCmntVO parent = mapper.findBoardCommentById( upCmntAnsSn, pstSn, bbsId );
            if (parent == null) {
                throw new IllegalArgumentException( "상위 댓글을 찾을 수 없습니다." );
            }
            Long orgnl = parent.getOrgnlUpCmntAnsSn() != null ? parent.getOrgnlUpCmntAnsSn() : parent.getAsmtCmntSn();
            vo.setOrgnlUpCmntAnsSn( orgnl );
            vo.setUpCmntAnsSn( upCmntAnsSn );
            vo.setCmntAnsDepth( (parent.getCmntAnsDepth() != null ? parent.getCmntAnsDepth() : 0L) + 1 );
            vo.setCmntAnsSn( mapper.nextBoardCmntAnsSn( pstSn, bbsId, orgnl ) );
        }

        mapper.insertBoardComment( vo );

        CommentResponse response = new CommentResponse();
        response.setAsmtCmntSn( vo.getAsmtCmntSn() );
        response.setAsmtSn( pstSn );
        response.setInstId( vo.getInstId() );
        response.setCmntDtlCn( vo.getCmntDtlCn() );
        response.setOrgnlUpCmntAnsSn( vo.getOrgnlUpCmntAnsSn() );
        response.setUpCmntAnsSn( vo.getUpCmntAnsSn() );
        response.setCmntAnsDepth( vo.getCmntAnsDepth() );
        response.setCmntAnsSn( vo.getCmntAnsSn() );
        response.setDelYn( vo.getDelYn() );
        response.setRgtrId( vo.getRgtrId() );
        response.setRegDt( vo.getRegDt() );
        response.setMdfrId( vo.getMdfrId() );
        response.setMdfcnDt( vo.getMdfcnDt() );
        return response;
    }

    /**
     * 게시판 댓글을 수정한다.
     *
     * <pre>
     * - 댓글 존재 여부 확인
     * - 본인이 작성한 댓글만 수정 가능
     * - 댓글 내용 및 수정자/수정일시 업데이트
     * </pre>
     *
     * @param pstSn       게시글 일련번호
     * @param bbsId       게시판 ID
     * @param asmtCmntSn  댓글 일련번호
     * @param userNo      수정자 회원번호
     * @param request     댓글 수정 요청 DTO
     */
    @Override
    @Transactional
    public void updateComment( Long pstSn, String bbsId, Long asmtCmntSn, String userNo, CommentUpdateRequest request ) {
        TbCmMAsmtCmntVO comment = mapper.findBoardCommentById( asmtCmntSn, pstSn, bbsId );
        if (comment == null) {
            throw new IllegalArgumentException( "댓글을 찾을 수 없습니다." );
        }
        if (!userNo.equals( comment.getRgtrId() )) {
            throw new IllegalArgumentException( "본인이 작성한 댓글만 수정할 수 있습니다." );
        }
        if (request.getCmntDtlCn() != null && !request.getCmntDtlCn().trim().isEmpty()) {
            comment.setCmntDtlCn( request.getCmntDtlCn().trim() );
        }
        comment.setMdfrId( userNo );
        comment.setMdfcnDt( LocalDateTime.now() );
        mapper.updateBoardComment( comment );
    }

    /**
     * 게시판 댓글을 삭제한다.
     *
     * <pre>
     * - 댓글 존재 여부 확인
     * - 본인이 작성한 댓글만 삭제 가능
     * - 댓글 논리 삭제 처리
     * </pre>
     *
     * @param pstSn      게시글 일련번호
     * @param bbsId      게시판 ID
     * @param asmtCmntSn 댓글 일련번호
     * @param userNo     삭제자 회원번호
     */
    @Override
    @Transactional
    public void deleteComment( Long pstSn, String bbsId, Long asmtCmntSn, String userNo ) {
        TbCmMAsmtCmntVO comment = mapper.findBoardCommentById( asmtCmntSn, pstSn, bbsId );
        if (comment == null) {
            throw new IllegalArgumentException( "댓글을 찾을 수 없습니다." );
        }
        if (!userNo.equals( comment.getRgtrId() )) {
            throw new IllegalArgumentException( "본인이 작성한 댓글만 삭제할 수 있습니다." );
        }
        mapper.deleteBoardComment( asmtCmntSn, userNo );
    }
}
