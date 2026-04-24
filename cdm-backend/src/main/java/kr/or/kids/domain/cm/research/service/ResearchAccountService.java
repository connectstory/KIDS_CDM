package kr.or.kids.domain.cm.research.service;

import java.util.List;

import kr.or.kids.domain.cm.research.dto.AsmtAccountRequest;
import kr.or.kids.domain.cm.research.dto.AsmtAccountResponse;
import kr.or.kids.domain.cm.research.dto.AsmtPersonCreateRequest;
import kr.or.kids.domain.cm.research.dto.AsmtPersonResponse;
import kr.or.kids.domain.cm.research.dto.EmpOptionResponse;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.global.common.CustomUserDetails;

public interface ResearchAccountService {

  ResearchMemberVO findMemberAndInstByUser( Long asmtSn, CustomUserDetails user );

  List<AsmtAccountResponse> searchAsmtAccounts( ResearchMemberVO memberAndInst );

  void createAsmtAccount( ResearchMemberVO memberAndInst, AsmtAccountRequest request );

  void updateAsmtAccount( ResearchMemberVO memberAndInst, Long sqAsmtAccountSn, AsmtAccountRequest request );

  void deleteAsmtAccount( ResearchMemberVO memberAndInst, Long sqAsmtAccountSn );

  List<EmpOptionResponse> searchEmpOptionsByDeptNos( ResearchMemberVO memberAndInst, List<String> deptNos );

  List<AsmtPersonResponse> searchAsmtPersons( ResearchMemberVO memberAndInst );

  void addAsmtPerson( ResearchMemberVO memberAndInst, AsmtPersonCreateRequest request );

  void removeAsmtPerson( ResearchMemberVO memberAndInst, Long personSn );
}
