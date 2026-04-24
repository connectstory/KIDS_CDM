package kr.or.kids.domain.cm.common.dto;

public class CommonCodeItem {
    private String code;
    private String name;

    public CommonCodeItem() {}

    public CommonCodeItem(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public String getCode() { return code; }
    public String getName() { return name; }
}
