package kr.or.kids.domain.cm.research.service;

import java.util.List;

import kr.or.kids.domain.cm.research.dto.CommentCreateRequest;
import kr.or.kids.domain.cm.research.dto.CommentResponse;
import kr.or.kids.domain.cm.research.dto.CommentUpdateRequest;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;

public interface ResearchCommentService {

  List<CommentResponse> searchComments( ResearchMemberVO memberAndInst, Long asmtSn );

  CommentResponse createComment( ResearchMemberVO memberAndInst, Long asmtSn, CommentCreateRequest request );

  void updateComment( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtCmntSn, CommentUpdateRequest request );

  void deleteComment( ResearchMemberVO memberAndInst, Long asmtSn, Long asmtCmntSn );
}
