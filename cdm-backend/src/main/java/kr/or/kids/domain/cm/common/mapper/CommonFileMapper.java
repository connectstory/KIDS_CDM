package kr.or.kids.domain.cm.common.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.common.vo.TbCaEFileGroupTrsmVo;
import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;

@Mapper
public interface CommonFileMapper {

  int insertFileUld( TbCmMFileUldVO vo );

  List<TbCmMFileUldVO> selectFileUldList( @Param("pstSn") Long pstSn, @Param("uldTaskSeCd") String uldTaskSeCd, @Param("fileSeCd") String fileSeCd );

  List<TbCmMFileUldVO> selectFileUldListByAsmtSnAndPtcpInstSn( @Param("pstSn") Long pstSn, @Param("ptcpInstSn") Long ptcpInstSn );

  /** pst_sn + uld_task_se_cd + file_se_cd 기준 ULD 조회 (DRB 등) */
  List<TbCmMFileUldVO> selectFileUldListByPstSnAndTaskAndFileSeCd( @Param("pstSn") Long pstSn, @Param("uldTaskSeCd") String uldTaskSeCd, @Param("fileSeCd") String fileSeCd );

  /** pst_sn + uld_task_se_cd + file_se_cd + inst_id 기준 ULD 조회 */
  List<TbCmMFileUldVO> selectFileUldListByPstSnAndTaskAndFileSeCdAndInstId( @Param("pstSn") Long pstSn, @Param("uldTaskSeCd") String uldTaskSeCd, @Param("fileSeCd") String fileSeCd, @Param("instId") String instId );

  int deleteFileUld( TbCmMFileUldVO vo );

  int insertFileGroup( TbCaEFileGroupTrsmVo vo );

  TbCaEFileGroupTrsmVo selectFileGroup( String atchFileGroupId );

  int deleteFileGroup( TbCaEFileGroupTrsmVo vo );

  int insertFile( TbCaEFileTrsmVo vo );

  List<TbCaEFileTrsmVo> selectFileListByGroup( String atchFileGroupId );

  int deleteFile( TbCaEFileTrsmVo vo );

  int deleteFileById( TbCaEFileTrsmVo vo );

  int insertFileBatch( List<TbCaEFileTrsmVo> list );

  /** 로컬 전용: tb_ca_e_file_trsm 물리 삭제 (그룹 단위) */
  int hardDeleteFile( TbCaEFileTrsmVo vo );

  /** 로컬 전용: tb_ca_e_file_trsm 물리 삭제 (단건) */
  int hardDeleteFileById( TbCaEFileTrsmVo vo );

  /** 로컬 전용: tb_ca_e_file_group_trsm 물리 삭제 */
  int hardDeleteFileGroup( TbCaEFileGroupTrsmVo vo );

  TbCaEFileTrsmVo selectFile( String atchFileId );

  TbCaEFileTrsmVo selectFileByGroupId( String atchFileGroupId );

  TbCaEFileTrsmVo selectFileBySrvrFileNm( @Param("srvrFileNm") String srvrFileNm );
}
