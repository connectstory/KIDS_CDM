package kr.or.kids.domain.cm.upload.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import kr.or.kids.domain.cm.common.service.MemberResolver;
import kr.or.kids.domain.cm.upload.dto.CommitRequest;
import kr.or.kids.domain.cm.upload.dto.CommitResponse;
import kr.or.kids.domain.cm.upload.service.CommitService;
import kr.or.kids.global.common.CustomUserDetails;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/commit")
@RequiredArgsConstructor
public class CommitController {

    private final CommitService commitService;
    private final MemberResolver memberResolver;

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

        try {
            memberResolver.resolveUser( du );
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException( HttpStatus.BAD_REQUEST, e.getMessage() );
        }

        CommitResponse resp = commitService.commit( req );
        return resp;
    }
}

