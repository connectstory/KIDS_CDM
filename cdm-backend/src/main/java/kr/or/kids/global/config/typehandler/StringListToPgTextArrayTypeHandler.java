package kr.or.kids.global.config.typehandler;

import java.sql.Array;
import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;

/**
 * Binds {@code List<String>} to PostgreSQL {@code text[]} for {@code = ANY (?)} (avoids MyBatis {@code foreach} on
 * {@code IN (...)}). Parameter-only; not used for result mapping.
 */
public class StringListToPgTextArrayTypeHandler extends BaseTypeHandler<List<String>> {

  private static final Logger LOG = Logger.getLogger( StringListToPgTextArrayTypeHandler.class.getName() );

  @Override
  public void setNonNullParameter( PreparedStatement ps, int i, List<String> parameter, JdbcType jdbcType ) throws SQLException {
    for (int j = 0; j < parameter.size(); j++) {
      if (parameter.get( j ) == null) {
        throw new SQLException( "text[] bind: null element at index " + j );
      }
    }
    String[] arr = parameter.toArray( new String[0] );
    Array sqlArray = ps.getConnection().createArrayOf( "text", arr );
    try {
      ps.setArray( i, sqlArray );
    } finally {
      if (sqlArray != null) {
        try {
          sqlArray.free();
        } catch (SQLException e) {
          LOG.log( Level.FINE, "SQL Array.free() failed after setArray (best-effort release)", e );
        }
      }
    }
  }

  @Override
  public List<String> getNullableResult( ResultSet rs, String columnName ) throws SQLException {
    throw new UnsupportedOperationException( "Parameter-only type handler" );
  }

  @Override
  public List<String> getNullableResult( ResultSet rs, int columnIndex ) throws SQLException {
    throw new UnsupportedOperationException( "Parameter-only type handler" );
  }

  @Override
  public List<String> getNullableResult( CallableStatement cs, int columnIndex ) throws SQLException {
    throw new UnsupportedOperationException( "Parameter-only type handler" );
  }
}
