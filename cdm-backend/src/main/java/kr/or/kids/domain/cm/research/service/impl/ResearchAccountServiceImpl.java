package kr.or.kids.domain.cm.research.service.impl;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import kr.or.kids.domain.cm.research.service.support.ResearchMemberResolver;
import kr.or.kids.domain.cm.common.vo.TbCmMAsmtPersonVO;
import kr.or.kids.domain.cm.research.dto.AsmtAccountRequest;
import kr.or.kids.domain.cm.research.dto.AsmtAccountResponse;
import kr.or.kids.domain.cm.research.dto.AsmtPersonCreateRequest;
import kr.or.kids.domain.cm.research.dto.AsmtPersonResponse;
import kr.or.kids.domain.cm.research.dto.EmpOptionResponse;
import kr.or.kids.domain.cm.research.mapper.ResearchMapper;
import kr.or.kids.domain.cm.research.service.ResearchAccountService;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.domain.cm.research.vo.TbCmMAsmtAccountVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.type.RoleType;
import kr.or.kids.global.type.YnFlagType;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResearchAccountServiceImpl implements ResearchAccountService {

  private final ResearchMapper researchMapper;
  private final ResearchMemberResolver researchMemberResolver;

  // 회원정보 조회 (연구과제 관리자 또는 참여기괸)
  @Override
  @Transactional(readOnly = true)
  public ResearchMemberVO findMemberAndInstByUser( Long asmtSn, CustomUserDetails user ) {
    return researchMemberResolver.resolve( asmtSn, user );
  }

  // 연구과제 계정 목록 조회
  @Override
  @Transactional(readOnly = true)
  public List<AsmtAccountResponse> searchAsmtAccounts( ResearchMemberVO memberAndInst ) {
    List<TbCmMAsmtAccountVO> accounts = researchMapper.searchAsmtAccounts();
    if (accounts == null || accounts.isEmpty()) {
      return Collections.emptyList();
    }

    return accounts.stream().map( vo -> {
      String typeCode = vo.getUserSeCd();
      String vdiType;
      if ("01".equals( typeCode )) {
        vdiType = "vdi";
      } else if ("02".equals( typeCode )) {
        vdiType = "db";
      } else {
        vdiType = typeCode;
      }
      return new AsmtAccountResponse( vo.getAsmtUserInfoSn(), vdiType, vo.getAsmtUserFlnm(), vo.getAsmtId(), vo.getAsmtUserIpAddr(), vo.getAsmtUserSrvcNo(), vo.getAsmtAnalysisSchema() );
    } ).toList();
  }

  // 연구과제 계정 생성
  @Override
  @Transactional
  public void createAsmtAccount( ResearchMemberVO memberAndInst, AsmtAccountRequest request ) {
    if (!RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
      throw new IllegalArgumentException( "권한이 없습니다." );
    }
    String vdiType = request.getVdiType();
    if (vdiType == null || (!"vdi".equals( vdiType ) && !"db".equals( vdiType ))) {
      throw new IllegalArgumentException( "계정 유형은 'vdi' 또는 'db'여야 합니다." );
    }
    if (request.getVdiName() == null || request.getVdiName().trim().isEmpty()) {
      throw new IllegalArgumentException( "계정명은 필수입니다." );
    }
    if ("db".equals( vdiType ) && (request.getVdiUse() == null || request.getVdiUse().trim().isEmpty())) {
      throw new IllegalArgumentException( "스키마는 필수입니다." );
    }

    String createBy = memberAndInst.getUserNo();
    LocalDateTime now = LocalDateTime.now();
    String userSeCd = "vdi".equals( vdiType ) ? "01" : "02";
    TbCmMAsmtAccountVO vo = new TbCmMAsmtAccountVO();
    vo.setUserSeCd( userSeCd );
    vo.setAsmtUserFlnm( request.getVdiName().trim() );
    if ("vdi".equals( vdiType )) {
      vo.setEnpswd( null );
      vo.setAsmtAnalysisSchema( null );
    } else {
      vo.setEnpswd( null );
      vo.setAsmtAnalysisSchema( request.getVdiUse() != null ? request.getVdiUse().trim() : null );
    }
    vo.setAsmtUserIpAddr( request.getVdiIp() != null ? request.getVdiIp().trim() : null );
    vo.setAsmtUserSrvcNo( request.getVdiPort() != null ? request.getVdiPort().trim() : null );
    vo.setAsmtSn( null );
    vo.setUseYn( YnFlagType.N.code() );
    vo.setRgtrId( createBy );
    vo.setRegDt( now );
    vo.setMdfrId( createBy );
    vo.setMdfcnDt( now );
    researchMapper.insertAsmtAccount( vo );
  }

  // 연구과제 계정 수정
  @Override
  @Transactional
  public void updateAsmtAccount( ResearchMemberVO memberAndInst, Long sqAsmtAccountSn, AsmtAccountRequest request ) {
    TbCmMAsmtAccountVO existing = researchMapper.findAsmtAccountById( sqAsmtAccountSn );
    if (existing == null) {
      throw new IllegalArgumentException( "계정을 찾을 수 없습니다." );
    }
    if (!RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
      throw new IllegalArgumentException( "권한이 없습니다." );
    }
    String vdiType = request.getVdiType();
    if (vdiType == null || (!"vdi".equals( vdiType ) && !"db".equals( vdiType ))) {
      throw new IllegalArgumentException( "계정 유형은 'vdi' 또는 'db'여야 합니다." );
    }
    if (request.getVdiName() == null || request.getVdiName().trim().isEmpty()) {
      throw new IllegalArgumentException( "계정명은 필수입니다." );
    }

    String updateBy = memberAndInst.getUserNo();
    String userSeCd = "vdi".equals( vdiType ) ? "01" : "02";
    TbCmMAsmtAccountVO vo = new TbCmMAsmtAccountVO();
    vo.setAsmtUserInfoSn( sqAsmtAccountSn );
    vo.setUserSeCd( userSeCd );
    vo.setAsmtUserFlnm( request.getVdiName().trim() );
    vo.setAsmtUserIpAddr( request.getVdiIp() != null ? request.getVdiIp().trim() : null );
    vo.setAsmtUserSrvcNo( request.getVdiPort() != null ? request.getVdiPort().trim() : null );
    vo.setAsmtAnalysisSchema( request.getVdiUse() != null ? request.getVdiUse().trim() : null );
    vo.setMdfrId( updateBy );
    vo.setMdfcnDt( LocalDateTime.now() );
    if ("vdi".equals( vdiType ) && request.getVdiPw() != null && !request.getVdiPw().trim().isEmpty()) {
      vo.setEnpswd( request.getVdiPw().trim() );
    }
    researchMapper.updateAsmtAccount( vo );
  }

  // 연구과제 계정 삭제
  @Override
  @Transactional
  public void deleteAsmtAccount( ResearchMemberVO memberAndInst, Long sqAsmtAccountSn ) {
    TbCmMAsmtAccountVO existing = researchMapper.findAsmtAccountById( sqAsmtAccountSn );
    if (existing == null) {
      throw new IllegalArgumentException( "계정을 찾을 수 없습니다." );
    }
    if (!RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
      throw new IllegalArgumentException( "권한이 없습니다." );
    }
    researchMapper.deleteAsmtAccount( existing.getAsmtUserInfoSn() );
  }

  // 담당자 드롭다운용 직원 목록 조회
  @Override
  @Transactional(readOnly = true)
  public List<EmpOptionResponse> searchEmpOptionsByDeptNos( ResearchMemberVO memberAndInst, List<String> deptNos ) {
    if (memberAndInst == null) {
      throw new IllegalArgumentException( "인증이 필요합니다." );
    }
    if (CollectionUtils.isEmpty( deptNos )) {
      return Collections.emptyList();
    }
    return researchMapper.selectEmpInfoByDeptNos( deptNos ).stream().map( EmpOptionResponse::from ).collect( Collectors.toList() );
  }

  // 담당자 목록 조회
  @Override
  @Transactional(readOnly = true)
  public List<AsmtPersonResponse> searchAsmtPersons( ResearchMemberVO memberAndInst ) {
    if (memberAndInst == null) {
      throw new IllegalArgumentException( "인증이 필요합니다." );
    }
    return researchMapper.selectAsmtPersonList().stream().map( AsmtPersonResponse::from ).collect( Collectors.toList() );
  }

  // 담당자 등록
  @Override
  @Transactional
  public void addAsmtPerson( ResearchMemberVO memberAndInst, AsmtPersonCreateRequest request ) {
    if (memberAndInst == null) {
      throw new IllegalArgumentException( "인증이 필요합니다." );
    }
    if (!RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
      throw new IllegalArgumentException( "권한이 없습니다." );
    }
    if (request == null || request.getPersonEmpNo() == null || request.getPersonEmpNo().isBlank()) {
      throw new IllegalArgumentException( "담당자 사번이 필요합니다." );
    }
    TbCmMAsmtPersonVO vo = new TbCmMAsmtPersonVO();
    vo.setEmpNo( request.getPersonEmpNo().trim() );
    vo.setRgtrId( memberAndInst.getUserNo() );
    vo.setMdfrId( memberAndInst.getUserNo() );
    researchMapper.insertAsmtPerson( vo );
  }

  // 담당자 삭제
  @Override
  @Transactional
  public void removeAsmtPerson( ResearchMemberVO memberAndInst, Long personSn ) {
    if (memberAndInst == null) {
      throw new IllegalArgumentException( "인증이 필요합니다." );
    }
    if (!RoleType.ADMIN.code().equals( memberAndInst.getUserType() )) {
      throw new IllegalArgumentException( "권한이 없습니다." );
    }
    if (personSn == null) {
      throw new IllegalArgumentException( "담당자 일련번호가 필요합니다." );
    }
    researchMapper.deleteAsmtPerson( personSn );
  }
}
