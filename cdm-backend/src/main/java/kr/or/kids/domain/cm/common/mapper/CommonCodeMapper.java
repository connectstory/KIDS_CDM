package kr.or.kids.domain.cm.common.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import kr.or.kids.domain.cm.common.dto.CommonCodeItem;

@Mapper
public interface CommonCodeMapper {
    List<CommonCodeItem> selectByGroupCode(@Param("groupCode") String groupCode);
}
