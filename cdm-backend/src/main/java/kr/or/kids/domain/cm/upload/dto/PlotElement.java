package kr.or.kids.domain.cm.upload.dto;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 업로드 요청/응답 데이터를 표현한다.
 */
public class PlotElement {
    public String title;
    public String chartType;
    public String xAxisDataType;
    public String yAxisDataType;
    public List<Map<String, Object>> data;

    /**
     * PlotElement 처리를 수행한다.
     *
     * @param pTitle pTitle
     * @param pChartType pChartType
     * @param pXAxisDataType pXAxisDataType
     */
    public PlotElement(String pTitle, String pChartType, String pXAxisDataType) {
        title = pTitle;
        chartType = pChartType;
        xAxisDataType = pXAxisDataType;
        yAxisDataType = "number";
        data = new ArrayList<>();
    }
}
