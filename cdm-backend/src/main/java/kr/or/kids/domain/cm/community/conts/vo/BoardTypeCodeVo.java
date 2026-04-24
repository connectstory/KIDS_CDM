package kr.or.kids.domain.cm.community.conts.vo;

/**
 * <pre>
 * 게시판 유형 코드 열거형 (리비전 번호 접두어 및 게시판 식별자 관리)
 * </pre>
 *
 * @author kim min seok
 * @since 2026-01-20
 * @version 1.0
 *
 * <pre>
 * since         author             description
 * ==========   ============   =========================
 * 2026-01-20   kim min seok    최초 생성
 * </pre>
 */
public enum BoardTypeCodeVo {

    BACKGROUND("BKG", "BIZ_BACKGROUND"),
    OBJECTIVE("OBJ", "BIZ_OBJECTIVE"),
    COORDINATION_CENTER("CCD", "BIZ_COORDINATION_CENTER"),
    PARTNER_INSTITUTION("PTN", "BIZ_PARTNER_INSTITUTION"),
    CDM_DEFINITION("CDF", "BIZ_CDM_DEFINITION"),
    CDM_STRUCTURE("CDS", "BIZ_CDM_STRUCTURE"),
    CDM_IMPLEMENTATION("IMP", "BIZ_CDM_IMPLEMENTATION"),
    CDM_OVERVIEW("OVW", "BIZ_CDM_OVERVIEW"),
    INFORMATION_SECURITY("SEC", "BIZ_INFORMATION_SECURITY");

    private final String code;
    private final String bbsId;

    BoardTypeCodeVo(String code, String bbsId) {
        this.code = code;
        this.bbsId = bbsId;
    }

    /** 리비전 번호 접두어 */
    public String getPrefix() {
        return "BIZ-" + code + "-";
    }

    /** 게시판 식별자 */
    public String getBbsId() {
        return bbsId;
    }

    /**
     * 게시판 식별자로 열거형 값을 조회한다.
     *
     * @param bbsId 게시판 식별자 (예: BIZ_BACKGROUND)
     * @return 해당 열거형 값
     * @throws IllegalArgumentException bbsId가 null이거나 매핑되는 값이 없을 경우
     */
    public static BoardTypeCodeVo from(String bbsId) {
        if (bbsId == null || bbsId.isBlank()) {
            throw new IllegalArgumentException("bbsId is null or blank");
        }
        for (BoardTypeCodeVo v : values()) {
            if (bbsId.equals(v.bbsId)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown bbsId: " + bbsId);
    }
}
