package kr.or.kids.global.security;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * Dynamic SQL identifier guard for schema/table/column names.
 * <p>
 * Note: PreparedStatement placeholders cannot bind SQL identifiers.
 * For dynamic object names, validate with whitelist and quote safely.
 */
public final class SqlIdentifierGuard {

  private static final Pattern IDENTIFIER = Pattern.compile( "^[A-Za-z_][A-Za-z0-9_]{0,62}$" );

  private SqlIdentifierGuard() {
  }

  public static String requireValidIdentifier( String name, String label ) {
    if (name == null || !IDENTIFIER.matcher( name ).matches()) {
      throw new IllegalArgumentException( "Invalid " + label + ": " + name );
    }
    return name;
  }

  public static String requireAllowedIdentifier( String name, String label, Set<String> allowed ) {
    String v = requireValidIdentifier( name, label );
    if (allowed == null || !allowed.contains( v )) {
      throw new IllegalArgumentException( "Not allowed " + label + ": " + v );
    }
    return v;
  }

  /** PostgreSQL identifier quoting: foo"bar -> "foo""bar" */
  public static String quoteIdentifier( String name ) {
    return "\"" + requireValidIdentifier( name, "identifier" ).replace( "\"", "\"\"" ) + "\"";
  }

  public static String qualify( String schema, String table ) {
    return quoteIdentifier( schema ) + "." + quoteIdentifier( table );
  }
}

