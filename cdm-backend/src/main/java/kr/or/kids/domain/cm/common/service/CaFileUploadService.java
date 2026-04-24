package kr.or.kids.domain.cm.common.service;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

/**
 * CA 파일 서버를 이용한 파일 업로드 및 tb_cm_m_file_uld 매핑을 담당하는 공통 서비스.
 */
public interface CaFileUploadService {

    /**
     * CA 파일 서버로 파일을 업로드하고, tb_cm_m_file_uld 에 업로드 이력을 등록한다.
     *
     * @param pstSn 게시글/과제 일련번호 등 업로드 대상 일련번호
     * @param ptcpInstSn 참여기관 일련번호 (없으면 null)
     * @param files 업로드할 파일 목록
     * @param rgtrId 등록자 ID
     * @param taskSeCd 업무구분 코드 (예: KidsTaskCodeType.CDM.code())
     * @param uldTaskSeCd 업로드 업무구분 코드
     * @param fileSeCd 파일구분 코드
     * @return 생성된 CA 첨부파일 그룹 ID (파일이 없으면 null)
     */
    String uploadWithCaAndUld( Long pstSn, Long ptcpInstSn, List<MultipartFile> files, String rgtrId, String taskSeCd, String uldTaskSeCd, String fileSeCd );

    /**
     * 파일 업로드 없이 tb_cm_m_file_uld 이력만 등록한다.
     *
     * @param pstSn 게시글/과제 일련번호 등 업로드 대상 일련번호
     * @param ptcpInstSn 참여기관 일련번호 (없으면 null)
     * @param rgtrId 등록자 ID
     * @param atchFileId 저장할 첨부파일 식별값(요청사항: 실제 파일명 사용 가능)
     * @param uldTaskSeCd 업로드 업무구분 코드
     * @param fileSeCd 파일구분 코드
     */
    void insertFileUldOnly( Long pstSn, Long ptcpInstSn, String rgtrId, String atchFileId, String uldTaskSeCd, String fileSeCd );



    /**
     * CA 파일 서버에 저장할 상대경로를 생성한다. 현재는 /attach/yyyyMM 형태로 생성하며, 향후 taskSeCd/uldTaskSeCd/fileSeCd 와 결합해 확장 가능하다.
     *
     * @param taskSeCd 업무구분 코드
     * @param uldTaskSeCd 업로드 업무구분 코드
     * @param fileSeCd 파일구분 코드
     * @return CA 저장 경로 (예: /attach/202603)
     */
    String buildCaSavePath( String taskSeCd, String uldTaskSeCd, String fileSeCd );
}
