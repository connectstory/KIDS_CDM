package kr.or.kids.domain.cm.research.controller;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import kr.or.kids.domain.cm.common.dto.ApiResponse;
import kr.or.kids.domain.cm.research.dto.AsmtAccountRequest;
import kr.or.kids.domain.cm.research.dto.AsmtAccountResponse;
import kr.or.kids.domain.cm.research.dto.AsmtPersonCreateRequest;
import kr.or.kids.domain.cm.research.dto.AsmtPersonResponse;
import kr.or.kids.domain.cm.research.dto.EmpOptionResponse;
import kr.or.kids.domain.cm.research.service.ResearchAccountService;
import kr.or.kids.domain.cm.research.service.support.ResearchMemberResolver;
import kr.or.kids.domain.cm.research.vo.ResearchMemberVO;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.global.type.RoleType;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/researches")
@RequiredArgsConstructor
public class ResearchAccountController {

  private final ResearchAccountService researchAccountService;
  private final ResearchMemberResolver researchMemberResolver;

  private Optional<ResearchMemberVO> requireMember( Long asmtSn, CustomUserDetails user ) {
    if (user == null) {
      return Optional.empty();
    }
    return Optional.of( researchMemberResolver.resolve( asmtSn, user ) );
  }

  // 과제별 VDI/DB 계정 목록 조회
  @GetMapping("/accounts")
  public ResponseEntity<ApiResponse<List<AsmtAccountResponse>>> searchAsmtAccounts( @AuthenticationPrincipal CustomUserDetails user ) {
    Optional<ResearchMemberVO> opt = requireMember( null, user );
    if (opt.isEmpty())
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    ResearchMemberVO memberAndInst = opt.get();

    try {
      List<AsmtAccountResponse> data = researchAccountService.searchAsmtAccounts( memberAndInst );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "연구과제 계정 목록 조회 성공", data );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // VDI/DB 계정 등록 (ADMIN 전용)
  @PostMapping("/accounts")
  public ResponseEntity<ApiResponse<Void>> createAsmtAccount( @AuthenticationPrincipal CustomUserDetails user, @RequestBody AsmtAccountRequest request ) {
    Optional<ResearchMemberVO> opt = requireMember( null, user );
    if (opt.isEmpty())
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    if (!RoleType.ADMIN.code().equals( user.getUserType() )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "권한이 없습니다." );
    }
    ResearchMemberVO memberAndInst = opt.get();

    try {
      researchAccountService.createAsmtAccount( memberAndInst, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "계정이 등록되었습니다.", null );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // VDI/DB 계정 수정 (ADMIN 전용)
  @PutMapping("/accounts/{sqAsmtAccountSn}")
  public ResponseEntity<ApiResponse<Void>> updateAsmtAccount( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long sqAsmtAccountSn, @RequestBody AsmtAccountRequest request ) {
    Optional<ResearchMemberVO> opt = requireMember( null, user );
    if (opt.isEmpty())
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    if (!RoleType.ADMIN.code().equals( user.getUserType() )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "권한이 없습니다." );
    }
    ResearchMemberVO memberAndInst = opt.get();

    try {
      researchAccountService.updateAsmtAccount( memberAndInst, sqAsmtAccountSn, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "계정이 수정되었습니다.", null );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // VDI/DB 계정 삭제 (ADMIN 전용)
  @DeleteMapping("/accounts/{sqAsmtAccountSn}")
  public ResponseEntity<ApiResponse<Void>> deleteAsmtAccount( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long sqAsmtAccountSn ) {
    Optional<ResearchMemberVO> opt = requireMember( null, user );
    if (opt.isEmpty())
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    if (!RoleType.ADMIN.code().equals( user.getUserType() )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "권한이 없습니다." );
    }
    ResearchMemberVO memberAndInst = opt.get();

    try {
      researchAccountService.deleteAsmtAccount( memberAndInst, sqAsmtAccountSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "계정이 삭제되었습니다.", null );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 담당자 드롭다운용 직원 목록 (deptNos: 0000004,0000080 등)
  @GetMapping("/asmt-persons/emp-options")
  public ResponseEntity<ApiResponse<List<EmpOptionResponse>>> searchAsmtPersonEmpOptions( @AuthenticationPrincipal CustomUserDetails user, @RequestParam(required = false) String deptNos ) {
    Optional<ResearchMemberVO> opt = requireMember( null, user );
    if (opt.isEmpty())
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    ResearchMemberVO memberAndInst = opt.get();
    List<String> deptNoList = (deptNos != null && !deptNos.isBlank()) ? Arrays.stream( deptNos.split( "," ) ).map( String::trim ).filter( s -> !s.isEmpty() ).collect( Collectors.toList() ) : List.of();
    try {
      List<EmpOptionResponse> data = researchAccountService.searchEmpOptionsByDeptNos( memberAndInst, deptNoList );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "직원 목록 조회 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 담당자 목록 (emp_nm, dept_no 포함)
  @GetMapping("/asmt-persons")
  public ResponseEntity<ApiResponse<List<AsmtPersonResponse>>> searchAsmtPersons( @AuthenticationPrincipal CustomUserDetails user ) {
    Optional<ResearchMemberVO> opt = requireMember( null, user );
    if (opt.isEmpty())
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    ResearchMemberVO memberAndInst = opt.get();
    try {
      List<AsmtPersonResponse> data = researchAccountService.searchAsmtPersons( memberAndInst );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "담당자 목록 조회 성공", data );
    } catch (IllegalArgumentException e) {
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 담당자 등록 (ADMIN 전용)
  @PostMapping("/asmt-persons")
  public ResponseEntity<ApiResponse<Void>> addAsmtPerson( @AuthenticationPrincipal CustomUserDetails user, @RequestBody AsmtPersonCreateRequest request ) {
    Optional<ResearchMemberVO> opt = requireMember( null, user );
    if (opt.isEmpty())
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    if (!RoleType.ADMIN.code().equals( user.getUserType() )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "권한이 없습니다." );
    }
    ResearchMemberVO memberAndInst = opt.get();
    try {
      researchAccountService.addAsmtPerson( memberAndInst, request );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "담당자가 등록되었습니다.", null );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }

  // 담당자 삭제 (ADMIN 전용)
  @DeleteMapping("/asmt-persons/{personSn}")
  public ResponseEntity<ApiResponse<Void>> removeAsmtPerson( @AuthenticationPrincipal CustomUserDetails user, @PathVariable Long personSn ) {
    Optional<ResearchMemberVO> opt = requireMember( null, user );
    if (opt.isEmpty())
      return ApiResponse.error( HttpStatus.UNAUTHORIZED, "인증이 필요합니다." );
    if (!RoleType.ADMIN.code().equals( user.getUserType() )) {
      return ApiResponse.error( HttpStatus.FORBIDDEN, "권한이 없습니다." );
    }
    ResearchMemberVO memberAndInst = opt.get();
    try {
      researchAccountService.removeAsmtPerson( memberAndInst, personSn );
      return ApiResponse.ok( ApiResponse.STATUS_SUCCESS, "담당자가 삭제되었습니다.", null );
    } catch (IllegalArgumentException e) {
      if ("권한이 없습니다.".equals( e.getMessage() )) {
        return ApiResponse.error( HttpStatus.FORBIDDEN, e.getMessage() );
      }
      return ApiResponse.error( HttpStatus.BAD_REQUEST, e.getMessage() );
    }
  }
}
