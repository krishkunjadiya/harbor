# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in Harbor, please email us directly instead of using the public issue tracker. This allows us to address the issue before it becomes public knowledge.

**Email**: security@harbor-project.example.com

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Response Timeline

- **Acknowledgment**: We will respond within 48 hours
- **Assessment**: We will provide an initial assessment within 5 business days
- **Fix & Release**: We aim to release patches within 30 days of confirmation
- **Disclosure**: Once patched, we will publicly acknowledge the vulnerability

## Security Best Practices

### For Users

1. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

2. **Never Commit Sensitive Data**
   - Never commit `.env.local`
   - Use `.env.local.example` as template
   - Add secrets to environment variables only

3. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols

4. **Enable Two-Factor Authentication**
   - Enable 2FA on your Supabase account
   - Enable 2FA on GitHub if maintaining this project

### For Developers

1. **Input Validation**
   - Validate all user inputs server-side
   - Use TypeScript for type safety
   - Sanitize file uploads

2. **Database Security**
   - Use parameterized queries (SQL injection prevention)
   - Implement Row-Level Security (RLS) on all tables
   - Never expose database credentials in client code
   - Use service role key only on server-side

3. **Authentication**
   - Use Supabase JWT tokens
   - Verify tokens on server-side
   - Implement proper session management
   - Use HTTPS for all connections

4. **API Security**
   - Implement rate limiting
   - Validate API requests
   - Use proper error handling (no stack traces in production)
   - Implement CORS properly

5. **Code Review**
   - All changes require code review
   - Security-critical changes need extra review
   - Use static analysis tools

6. **Dependency Management**
   - Regularly audit dependencies
   - Remove unused packages
   - Keep dependencies up to date
   - Review `npm audit` warnings

### Environment Variables

**Never expose:**
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (except it's public-safe by design)
- API keys or tokens
- Database credentials

**Secure configuration:**
```bash
# Good: Use environment-specific secrets
echo $SUPABASE_SERVICE_ROLE_KEY  # Only in server-side code

# Bad: Never hardcode
const SECRET = "sk_test_123456"  // DANGER!
```

## Security Features Implemented

✅ **Row-Level Security (RLS)**
- All tables enforce row-level policies
- Users can only access their own data (with exceptions for cross-stakeholder features)

✅ **Authentication**
- JWT-based auth with Supabase
- Secure session management
- Password hashing with bcrypt

✅ **Authorization**
- Role-based access control (RBAC)
- Middleware validation
- Server-side permission checks

✅ **Data Protection**
- Encrypted file uploads
- Signed URLs for download
- Secure data deletion

✅ **Input Sanitization**
- Server-side validation
- TypeScript type checking
- XSS prevention

## Known Security Considerations

### Current Limitations

1. **File Upload Size**
   - Currently limited to 5MB per file
   - Adjust in `.env.local` if needed

2. **Rate Limiting**
   - Not yet implemented at API level
   - Recommended for production deployment

3. **CORS**
   - Ensure CORS is properly configured for your domain
   - Review CORS settings in `next.config.mjs`

4. **SSL/TLS**
   - Always use HTTPS in production
   - Vercel handles SSL automatically

## Security Checklist for Deployment

Before going to production:

- [ ] All environment secrets in production environment variables
- [ ] `.env.local` never committed to git
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Security headers configured
- [ ] RLS policies verified on all tables
- [ ] Authentication keys rotated
- [ ] Database backups configured
- [ ] Error logging without sensitive data
- [ ] Admin user created securely
- [ ] Audit logging enabled
- [ ] DDoS protection enabled (Vercel provides this)

## Recommended Security Headers

Add to `next.config.mjs`:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ];
}
```

## Dependency Security

### Regular Audits
```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Review high-risk dependencies
npm list --depth=0
```

### Monitoring
- Enable GitHub security alerts
- Review Dependabot notifications
- Keep packages updated regularly

## Incident Response

If a security incident occurs:

1. **Assess Impact**
   - Determine scope and severity
   - Identify affected users/data

2. **Contain**
   - Take immediate action
   - Isolate compromised components

3. **Remediate**
   - Fix the vulnerability
   - Deploy patch

4. **Communicate**
   - Notify affected users if necessary
   - Publish security advisory
   - Update documentation

## Compliance

Harbor aims to follow:
- OWASP Top 10 best practices
- GDPR guidelines for data protection
- Industry standard security practices

## Questions?

For security questions or concerns:
- Open a private security issue (if supported)
- Email security@harbor-project.example.com
- Check this policy for updates regularly

## License

This Security Policy is provided as-is without warranty. Stay safe! 🔒
