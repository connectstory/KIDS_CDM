package kr.or.kids.domain.cm.common.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.vo.TbCaEFileTrsmVo;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;

public interface CommonFileService {

  /**
   * 파일 그룹 + 파일 저장 (공지, 게시판 공용)
   * 
   * @param pstSnForUld tb_cm_m_file_uld.pst_sn에 넣을 값 (null이면 taskSeTrgtId를 Long으로 파싱)
   * @param ptcpInstSnForUld tb_cm_m_file_uld.ptcp_inst_sn에 넣을 값 (null 가능)
   */
  String uploadFileGroup( String atchFileGroupId, String taskSeCd, String taskSeTrgtId, List<MultipartFile> files, String rgtrId, String uldTaskSeCd, String fileSeCd, Long pstSnForUld, Long ptcpInstSnForUld );

  /**
   * 그룹 기준 파일 조회
   */
  List<TbCaEFileTrsmVo> selectFileListByGroup( String atchFileGroupId );

  /**
   * 파일 그룹 삭제
   */
  void deleteFileGroup( String atchFileGroupId, String mdfrId );

  /**
   * 파일 단건 삭제 (논리삭제)
   */
  void deleteFile( String atchFileGroupId );

  void deleteFileById( String atchFileId );

  /**
   * 파일 단건 삭제 (논리삭제)
   */
  void deleteFileUld( TbCmMFileUldVO vo );

  /** 게시글 기준 연결 조회 */
  List<TbCmMFileUldVO> selectFileUldList( Long pstSn );

  /** 게시글 + 참여기관 기준 연결 조회 (IRB 등) */
  List<TbCmMFileUldVO> selectFileUldListByAsmtSnAndPtcpInstSn( Long pstSn, Long ptcpInstSn );

  /** pst_sn + uld_task_se_cd + file_se_cd 기준 연결 조회 (DRB 등) */
  List<TbCmMFileUldVO> selectFileUldListByPstSnAndTaskAndFileSeCd( Long pstSn, String uldTaskSeCd, String fileSeCd );

  /**
   * 파일 단건 조회 (다운로드용)
   */
  TbCaEFileTrsmVo selectFile( String atchFileId );

  /**
   * 파일 그룹 기준 조회
   */
  TbCaEFileTrsmVo selectFileByGroupId( String atchFileGroupId );
}
