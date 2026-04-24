package kr.or.kids.domain.cm.common.service.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import kr.or.kids.domain.cm.common.mapper.CommonFileMapper;
import kr.or.kids.domain.cm.common.service.CaFileUploadService;
import kr.or.kids.domain.cm.common.service.FileApiService;
import kr.or.kids.domain.cm.common.vo.TbCmMFileUldVO;
import kr.or.kids.global.type.YnFlagType;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CaFileUploadServiceImpl implements CaFileUploadService {

    private final FileApiService fileApiService;
    private final CommonFileMapper commonFileMapper;

    @Override
    @Transactional
    public String uploadWithCaAndUld( Long pstSn, Long ptcpInstSn, List<MultipartFile> files, String rgtrId, String taskSeCd, String uldTaskSeCd, String fileSeCd ) {
        if (files == null || files.isEmpty()) {
            return null;
        }

        String groupId = fileApiService.groupInsert( rgtrId );
        String savePath = "cm";

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) {
                continue;
            }
            fileApiService.uploadFiles( groupId, file, savePath );
        }

        /* AtchFileId는 AtchFileGroupId와 동일 */
        TbCmMFileUldVO uldVo = new TbCmMFileUldVO();
        uldVo.setPstSn( pstSn );
        uldVo.setAtchFileId( groupId );
        uldVo.setUldTaskSeCd( uldTaskSeCd );
        uldVo.setFileSeCd( fileSeCd );
        if (ptcpInstSn != null) {
            uldVo.setPtcpInstSn( ptcpInstSn );
        }
        uldVo.setDelYn( YnFlagType.N.code() );
        uldVo.setRgtrId( rgtrId );
        uldVo.setRegPrgmId( "FileUpload" );
        commonFileMapper.insertFileUld( uldVo );

        return groupId;
    }

    @Override
    @Transactional
    public void insertFileUldOnly( Long pstSn, Long ptcpInstSn, String rgtrId, String atchFileId, String uldTaskSeCd, String fileSeCd ) {
        TbCmMFileUldVO uldVo = new TbCmMFileUldVO();
        uldVo.setPstSn( pstSn );
        uldVo.setAtchFileId( atchFileId );
        uldVo.setUldTaskSeCd( uldTaskSeCd );
        uldVo.setFileSeCd( fileSeCd );
        if (ptcpInstSn != null) {
            uldVo.setPtcpInstSn( ptcpInstSn );
        }
        uldVo.setDelYn( YnFlagType.N.code() );
        uldVo.setRgtrId( rgtrId );
        uldVo.setRegPrgmId( "FileUpload" );
        commonFileMapper.insertFileUld( uldVo );
    }

    @Override
    public String buildCaSavePath( String taskSeCd, String uldTaskSeCd, String fileSeCd ) {
        String yearMonth = LocalDateTime.now().format( DateTimeFormatter.ofPattern( "yyyyMM" ) );
        // 현재는 기존 구현과 동일하게 /attach/yyyyMM 만 사용한다.
        // 향후 taskSeCd/uldTaskSeCd/fileSeCd 와 결합해 확장할 수 있다.
        return "/attach/" + yearMonth;
    }
}
