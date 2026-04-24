package kr.or.kids;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@MapperScan(basePackages = { "kr.or.kids.domain.cm.anyid.mapper", "kr.or.kids.domain.cm.common.mapper", "kr.or.kids.domain.cm.research.mapper", "kr.or.kids.domain.cm.community.board.mapper", "kr.or.kids.domain.cm.community.faq.mapper", "kr.or.kids.domain.cm.community.qna.mapper",
		"kr.or.kids.domain.cm.community.asmtprp.mapper", "kr.or.kids.domain.cm.upload.mapper", "kr.or.kids.domain.cm.community.conts.mapper", "kr.or.kids.domain.cm.community.dashboard.mapper", "kr.or.kids.domain.cm.validaterule.mapper", "kr.or.kids.domain.cm.prstInfo.mapper" })

@SpringBootApplication
@ComponentScan(excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX, pattern = "kr\\.or\\.kids\\.global\\.exception\\..*"))
public class CdmApplication {
	public static void main( String[] args ) {
		SpringApplication.run( CdmApplication.class, args );
	}
}
