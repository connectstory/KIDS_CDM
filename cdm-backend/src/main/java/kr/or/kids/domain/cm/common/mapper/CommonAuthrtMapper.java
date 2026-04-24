package kr.or.kids.domain.cm.common.mapper;

import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.common.vo.MemberAndInstVO;
import kr.or.kids.domain.cm.common.vo.TbPpMAuthrtVO;
import kr.or.kids.domain.cm.common.vo.TbPpMDeptAuthrtVO;
import kr.or.kids.domain.cm.common.vo.TbPpMEmpInfoVO;
import kr.or.kids.domain.cm.common.vo.TbPpMExprtAuthrtVO;

@Mapper
public interface CommonAuthrtMapper {

  /**
   * 회원 권한 목록 조회
   *
   * @param mbrNo 회원번호
   * @return 권한 리스트
   */
  List<TbPpMAuthrtVO> selectMemberAuthList( @Param("mbrNo") String mbrNo );

  /**
   * 회원번호로 전문가 권한 1건 조회 (authrt_cd 취득용)
   *
   * @param mbrNo 회원번호
   * @return 전문가 권한 정보, 없으면 null
   */
  TbPpMExprtAuthrtVO selectOneExprtAuthrtByMbrNo( @Param("mbrNo") String mbrNo );

  /**
   * 권한코드로 부서권한 1건 조회 (dept_no 취득용)
   *
   * @param authrtCd 권한코드
   * @return 부서권한 정보, 없으면 null
   */
  TbPpMDeptAuthrtVO selectOneDeptAuthrtByAuthrtCd( @Param("authrtCd") String authrtCd );

  /**
   * 직원번호로 직원 정보 1건 조회
   *
   * @param empNo 직원번호
   * @return 직원 정보, 없으면 null
   */
  TbPpMEmpInfoVO selectEmpInfoByEmpNo( @Param("empNo") String empNo );

  /**
   * 회원정보와 기관정보 조회 (mbr_id로)
   *
   * @param mbrId 회원 아이디
   * @return 회원·기관 정보 VO, 없으면 null
   */
  MemberAndInstVO selectMemberAndInstByMbrId( @Param("mbrId") String mbrId );

  /**
   * 협력기관 사용자용 메뉴 목록 조회 (CM/E 타입)
   *
   * @return menuAuthList 구조와 동일한 메뉴 목록
   */
  List<Map<String, Object>> selectPartnerMenuAuthList();
}
