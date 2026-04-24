package kr.or.kids.domain.cm.research.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import kr.or.kids.domain.cm.common.service.DecryptApiService;
import kr.or.kids.domain.cm.research.dto.CommentCreateRequest;
import kr.or.kids.domain.cm.research.dto.CommentResponse;
import kr.or.kids.domain.cm.research.dto.CommentUpdateRequest;
import kr.or.kids.domain.cm.research.mapper.ResearchMapper;
import kr.or.kids.domain.cm.research.vo.CommentRowVO;
import kr.or.kids.domain.cm.research.service.ResearchCommentService;
import kr.or.kids.domain.cm.research.type.ParticipationStatus;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtCmntVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtPrcpVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtVO;
import kr.or.kids.global.type.RoleType;
import kr.or.kids.global.type.YnFlagType;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResearchCommentServiceImpl implements ResearchCommentService {

  private final ResearchMapper researchMapper;
  private final DecryptApiService decryptApiService;

  // 댓글 목록 조회
  @Override
  @Transactional
  public List<CommentResponse> searchComments( ResearchMemberVO memberAndInst, Long asmtSn ) {
    List<CommentRowVO> rows = researchMapper.selectComments( asmtSn );
    if (rows == null || rows.isEmpty()) {
      return List.of();
    }
    List<CommentResponse> comments = rows.stream().map( CommentResponse::from ).collect( Collectors.toList() );
    for (CommentResponse c : comments) {
      String empNm = c.getEmpNm();
      if (empNm != null && !empNm.isBlank()) {
        // 직원명 있는 경우: 회원명(암호화값) 노출 방지
        c.setMbrNm( null );
        continue;
      }
      if (c.getMbrNm() != null && !c.getMbrNm().isBlank()) {
        c.setMbrNm( decryptApiService.decryptMbrFlnm( c.getMbrNm() ) );
      }
    }
    return comments;
  }

  // 댓글 등록
  @Override
  @Transactional
  public CommentResponse createComment( ResearchMemberVO memberAndInst, Long asmtSn, CommentCreateRequest request ) {
    validateResearchAccessible( memberAndInst, asmtSn );
    if (request.getCmntDtlCn() == null || request.getCmntDtlCn().trim().isEmpty()) {
      throw new IllegalArgumentException( "댓글 내용을 입력해 주세요." );
    }
    String userNo = memberAndInst.getUserNo();
    String instId = memberAndInst.getInstBrno();
    LocalDateTime now = LocalDateTime.now();

    TbCmMAsmtCmntVO vo = new TbCmMAsmtCmntVO();
    vo.setAsmtSn( asmtSn );
    vo.setInstId( instId );
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
      Long nextSn = researchMapper.nextCmntAnsSn( asmtSn, null );
      vo.setCmntAnsSn( nextSn );
    } else {
      TbCmMAsmtCmntVO parent = researchMapper.findCommentByAsmtCmntSn( upCmntAnsSn );
      if (parent == null || !parent.getAsmtSn().equals( asmtSn )) {
        throw new IllegalArgumentException( "상위 댓글을 찾을 수 없습니다." );
      }
      Long orgnl = parent.getOrgnlUpCmntAnsSn() != null ? parent.getOrgnlUpCmntAnsSn() : parent.getAsmtCmntSn();
      vo.setOrgnlUpCmntAnsSn( orgnl );
      vo.setUpCmntAnsSn( upCmntAnsSn );
      vo.setCmntAnsDepth( (parent.getCmntAnsDepth() != null ? parent.getCmntAnsDepth() : 0L) + 1 );
      Long nextSn = researchMapper.nextCmntAnsSn( asmtSn, orgnl );
      vo.setCmntAnsSn( nextSn );
    }

    researchMapper.insertComment( vo );
    Long asmtCmntSn = vo.getAsmtCmntSn();
    CommentResponse response = new CommentResponse();
    response.setAsmtCmntSn( asmtCmntSn );
    response.setAsmtSn( asmtSn );
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

  // 댓글 수정
  @Override
  @Transactional
  public void updateComment( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtCmntSn, CommentUpdateRequest request ) {
    validateResearchAccessible( memberAndInst, asmtSn );
    TbCmMAsmtCmntVO comment = researchMapper.findCommentByAsmtCmntSn( asmtCmntSn );
    if (comment == null || !comment.getAsmtSn().equals( asmtSn )) {
      throw new IllegalArgumentException( "댓글을 찾을 수 없습니다." );
    }
    if (comment.getRgtrId() == null || !comment.getRgtrId().equals( memberAndInst.getUserNo() )) {
      throw new IllegalArgumentException( "본인이 작성한 댓글만 수정할 수 있습니다." );
    }
    if (request.getCmntDtlCn() != null && !request.getCmntDtlCn().trim().isEmpty()) {
      comment.setCmntDtlCn( request.getCmntDtlCn().trim() );
    }
    comment.setMdfrId( memberAndInst.getUserNo() );
    comment.setMdfcnDt( LocalDateTime.now() );
    researchMapper.updateComment( comment );
  }

  // 댓글 삭제
  @Override
  @Transactional
  public void deleteComment( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtCmntSn ) {
    validateResearchAccessible( memberAndInst, asmtSn );
    TbCmMAsmtCmntVO comment = researchMapper.findCommentByAsmtCmntSn( asmtCmntSn );
    if (comment == null || !comment.getAsmtSn().equals( asmtSn )) {
      throw new IllegalArgumentException( "댓글을 찾을 수 없습니다." );
    }
    if (comment.getRgtrId() == null || !comment.getRgtrId().equals( memberAndInst.getUserNo() )) {
      throw new IllegalArgumentException( "본인이 작성한 댓글만 삭제할 수 있습니다." );
    }
    researchMapper.deleteComment( asmtCmntSn, memberAndInst.getUserNo() );
  }

  // 연구과제 접근 가능 여부 체크
  private void validateResearchAccessible( ResearchMemberVO memberAndInst, Long asmtSn ) {
    TbCmMAsmtVO asmt = memberAndInst.getAsmt();
    if (asmt == null) {
      throw new IllegalArgumentException( "연구과제를 찾을 수 없습니다. id: " + asmtSn );
    }

    if (!RoleType.ADMIN.code().equals( memberAndInst.getUserType() ) && !asmt.getInstId().equals( memberAndInst.getInstBrno() )) {
      TbCmMAsmtPrcpVO partner = memberAndInst.getPartner();
      if (partner == null || ParticipationStatus.NOT_PARTICIPATING.code().equals( partner.getPtcpPrgrsSttsCd() )) {
        throw new IllegalArgumentException( "권한이 없습니다." );
      }
    }
  }
}
