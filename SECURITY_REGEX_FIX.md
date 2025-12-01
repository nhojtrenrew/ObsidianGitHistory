# Security Fix: ReDoS Vulnerability in Email Validation

## Issue

The email validation regex was vulnerable to ReDoS (Regular Expression Denial of Service) attacks due to catastrophic backtracking.

## Vulnerable Pattern

```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
```

### Why It Was Vulnerable

The pattern uses multiple `+` quantifiers with negated character classes `[^\s@]+`. When given a malicious input like:
- `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.`
- Or inputs with many characters before the `@` that don't match

The regex engine would try many different ways to match, causing exponential time complexity (catastrophic backtracking).

## Fixed Pattern

```typescript
const emailRegex = /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{2,63}$/;

if (email.length > 254 || !emailRegex.test(email)) {
    // Invalid email
}
```

### Why It's Secure

1. **Bounded quantifiers**: `{1,64}`, `{1,253}`, `{2,63}` instead of `+`
   - Limits the number of characters that can be matched
   - Prevents exponential backtracking

2. **Length validation**: `email.length > 254`
   - RFC 5321 specifies max email length is 254 characters
   - Pre-validation prevents processing of excessively long inputs

3. **Realistic limits**:
   - Local part (before @): max 64 characters (RFC 5321)
   - Domain: max 253 characters (RFC 1035)
   - TLD: 2-63 characters (realistic range)

## Other Regex Patterns Reviewed

All other regex patterns in the codebase were reviewed and found to be safe:

| Pattern | Location | Status | Reason |
|---------|----------|--------|--------|
| `/a\/(.+?) b\/(.+?)$/` | Line 812 | ✅ Safe | Uses lazy quantifier `+?` |
| `/rename from (.+)/` | Line 828 | ✅ Safe | Matches to end of line |
| `/similarity index (\d+)%/` | Line 834 | ✅ Safe | Digits only, no backtracking |
| `/\.[^/.]+$/` | Lines 1047-1059 | ✅ Safe | Negated class with anchor |

## Testing

The fixed regex correctly validates:

**Valid emails:**
- `user@example.com` ✅
- `john.doe@company.co.uk` ✅
- `test+tag@domain.org` ✅

**Invalid emails:**
- `invalid` ❌
- `@example.com` ❌
- `user@` ❌
- `user@domain` ❌
- Emails > 254 characters ❌

**Security:**
- Long malicious inputs are rejected by length check
- Bounded quantifiers prevent catastrophic backtracking
- Pattern completes in O(n) time instead of O(2^n)

## References

- [OWASP ReDoS](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [RFC 5321 - Email Address Specification](https://tools.ietf.org/html/rfc5321)
- [RFC 1035 - Domain Name Specification](https://tools.ietf.org/html/rfc1035)

## Impact

- **Severity**: Medium (could cause denial of service)
- **Likelihood**: Low (requires malicious input in Git config)
- **Status**: ✅ Fixed
- **Date**: December 1, 2025
