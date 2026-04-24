package kr.or.kids.domain.cm.upload.controller;

import kr.or.kids.domain.cm.upload.dto.CommitRequest;
import kr.or.kids.domain.cm.upload.dto.CommitResponse;
import kr.or.kids.domain.cm.upload.service.CommitService;
import kr.or.kids.global.common.CustomUserDetails;
import kr.or.kids.domain.cm.upload.util.UploadAuthUtil;
import org.springframework.http.HttpStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * 업로드 관련 API 요청을 처리한다.
 *
 * <pre>
 * 업로드 업무 흐름에 따라 필요한 처리를 수행한다.
 * </pre>
 */
@RestController
@RequestMapping("/commit")
@RequiredArgsConstructor
public class CommitController {

    private final CommitService commitService;

    /**
     * commit 처리를 수행한다.
     *
     * @param req req
     * @param du du
     * @return 처리 결과
     */
    @PostMapping
    public CommitResponse commit(
        @RequestBody CommitRequest req,
        @AuthenticationPrincipal CustomUserDetails du
    ) throws Exception {
        if (du == null) {
            throw new ResponseStatusException( HttpStatus.UNAUTHORIZED, "로그인이 필요합니다." );
        }

                CommitResponse resp = commitService.commit(req);
        return resp;
    }
}

