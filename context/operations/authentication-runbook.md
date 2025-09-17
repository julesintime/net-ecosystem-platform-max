# Authentication Operations Runbook

## Overview

This runbook provides comprehensive operational guidance for the Net Ecosystem Platform's authentication system based on Logto. It covers monitoring, troubleshooting, incident response, and maintenance procedures.

## System Architecture

### Components
- **Next.js Application** - Main application server (Port 6789)
- **Logto Instance** - Authentication provider (`https://z3zlta.logto.app/`)
- **Organization Management** - Multi-tenant organization context
- **JWT Token System** - Stateless authentication with organization scopes

### Key Endpoints
- Health: `/api/health`
- Sign-in: `/api/logto/sign-in`
- Sign-out: `/api/logto/sign-out`
- Callback: `/api/logto/callback`
- Organizations: `/api/organizations`

## Monitoring and Alerting

### Health Checks

#### Application Health
```bash
# Check application health
curl http://localhost:6789/api/health

# Expected response:
{
  "status": "healthy",
  "auth": {
    "logto": {
      "configured": true
    }
  }
}
```

#### Authentication Endpoints
```bash
# Sign-in endpoint (should redirect)
curl -I http://localhost:6789/api/logto/sign-in
# Expected: 302 or 307 redirect

# Callback endpoint
curl -I http://localhost:6789/api/logto/callback
# Expected: 200, 302, or 400 (depending on parameters)
```

### Key Metrics to Monitor

1. **Response Times**
   - Health endpoint: < 100ms
   - Auth redirects: < 2s
   - Page loads: < 3s

2. **Error Rates**
   - Authentication failures: < 5%
   - JWT validation errors: < 1%
   - API endpoint errors: < 10%

3. **Availability**
   - Application uptime: > 99.9%
   - Logto service availability: > 99.5%

## Troubleshooting Guide

### Common Issues

#### 1. Authentication Not Working

**Symptoms:**
- Users cannot sign in
- Redirects to Logto fail
- "Configuration error" messages

**Diagnosis:**
```bash
# Check environment variables
echo $LOGTO_ENDPOINT
echo $LOGTO_APP_ID
echo $LOGTO_APP_SECRET

# Check health endpoint
curl http://localhost:6789/api/health | jq '.auth.logto'

# Check Logto connectivity
curl -I $LOGTO_ENDPOINT
```

**Resolution:**
1. Verify environment variables are set correctly
2. Check Logto instance is accessible
3. Validate redirect URIs in Logto console
4. Restart application if configuration changed

#### 2. JWT Token Validation Failures

**Symptoms:**
- "Invalid token" errors
- Organization context missing
- API calls failing with 401/403

**Diagnosis:**
```bash
# Check token structure (decode JWT manually)
# Look for organization audience format: "urn:logto:organization:{orgId}"

# Check logs for specific error messages
grep "JWT validation failed" /var/log/app.log

# Test organization token endpoint
curl -X POST http://localhost:6789/api/organizations/{orgId}/token \
  -H "Authorization: Bearer {user-token}"
```

**Resolution:**
1. Verify JWT audience configuration
2. Check token expiration settings
3. Validate organization membership
4. Clear token cache and retry

#### 3. Organization Switching Issues

**Symptoms:**
- Cannot switch between organizations
- Organization context not updating
- Permission errors after switching

**Diagnosis:**
```bash
# Check organization membership
curl http://localhost:6789/api/organizations \
  -H "Authorization: Bearer {token}"

# Test token generation for specific org
curl -X POST http://localhost:6789/api/organizations/{orgId}/token \
  -H "Authorization: Bearer {user-token}"

# Check organization roles and permissions
curl http://localhost:6789/api/organizations/{orgId}/members/{userId} \
  -H "Authorization: Bearer {org-token}"
```

**Resolution:**
1. Verify user membership in target organization
2. Check organization-specific permissions
3. Clear organization context cache
4. Validate token refresh mechanism

#### 4. Performance Issues

**Symptoms:**
- Slow authentication redirects
- Timeouts during sign-in
- High response times

**Diagnosis:**
```bash
# Run performance check
./scripts/validate-auth-environment.sh

# Check response times
time curl http://localhost:6789/api/health

# Monitor resource usage
top -p $(pgrep -f "next")
```

**Resolution:**
1. Scale application resources
2. Optimize database queries
3. Implement token caching
4. Review network latency to Logto

### Emergency Procedures

#### Service Degradation

**Priority:** High
**Response Time:** < 15 minutes

**Steps:**
1. Check application health endpoint
2. Verify Logto service status
3. Review recent deployments/changes
4. Check resource utilization
5. Scale resources if needed
6. Notify stakeholders

#### Complete Authentication Failure

**Priority:** Critical
**Response Time:** < 5 minutes

**Steps:**
1. Check Logto service status immediately
2. Verify environment configuration
3. Review application logs for errors
4. Implement emergency bypass if needed
5. Escalate to on-call engineer
6. Document incident timeline

## Incident Response

### Severity Levels

1. **Critical (P1)** - Authentication completely down
   - Response: Immediate (< 5 minutes)
   - Escalation: Page on-call engineer

2. **High (P2)** - Degraded authentication performance
   - Response: < 15 minutes
   - Escalation: Notify team lead

3. **Medium (P3)** - Minor authentication issues
   - Response: < 1 hour
   - Escalation: Create ticket

### Response Process

1. **Acknowledge** incident within SLA
2. **Investigate** using troubleshooting guide
3. **Communicate** status to stakeholders
4. **Resolve** issue using documented procedures
5. **Follow up** with post-incident review

## Maintenance Procedures

### Regular Maintenance

#### Daily Tasks
- [ ] Check health endpoint status
- [ ] Review authentication error logs
- [ ] Monitor performance metrics
- [ ] Verify backup systems

#### Weekly Tasks
- [ ] Run comprehensive validation script
- [ ] Review authentication metrics trends
- [ ] Check Logto configuration
- [ ] Update monitoring dashboards

#### Monthly Tasks
- [ ] Review and rotate secrets if needed
- [ ] Update authentication documentation
- [ ] Conduct disaster recovery tests
- [ ] Analyze authentication patterns

### Deployment Procedures

#### Pre-deployment Checklist
- [ ] Run full test suite including auth tests
- [ ] Verify environment variables in target
- [ ] Check Logto configuration compatibility
- [ ] Prepare rollback plan

#### Deployment Steps
1. Deploy to staging environment
2. Run authentication validation
3. Test organization switching
4. Monitor health endpoints
5. Deploy to production
6. Verify all authentication flows

#### Post-deployment Verification
- [ ] All health checks passing
- [ ] Authentication flows working
- [ ] Performance within SLA
- [ ] No error spikes in monitoring

## Configuration Management

### Environment Variables

**Required:**
- `LOGTO_ENDPOINT` - Logto instance URL
- `LOGTO_APP_ID` - Application ID from Logto
- `LOGTO_APP_SECRET` - Application secret
- `LOGTO_RESOURCE_ID` - API resource identifier

**Optional but Recommended:**
- `LOGTO_MANAGEMENT_API_RESOURCE` - Management API access
- `LOGTO_MANAGEMENT_API_IDENTIFIER` - Management API identifier

### Secret Rotation

**Frequency:** Every 90 days or as needed

**Process:**
1. Generate new secrets in Logto console
2. Update environment variables in staging
3. Test authentication flows
4. Deploy to production
5. Verify all systems working
6. Deactivate old secrets

## Security Guidelines

### Best Practices
- Never log JWT tokens or secrets
- Use HTTPS for all authentication endpoints
- Implement proper CORS policies
- Regular security audits
- Monitor for suspicious activity

### Incident Response for Security Issues
1. Immediately revoke compromised tokens
2. Force logout all affected users
3. Rotate all authentication secrets
4. Investigate scope of breach
5. Document and report incident

## Contacts and Escalation

### On-call Rotation
- **Primary:** Authentication team lead
- **Secondary:** Platform engineering team
- **Escalation:** CTO/Engineering VP

### External Dependencies
- **Logto Support:** [support contact]
- **Infrastructure Team:** [contact info]
- **Security Team:** [contact info]

## Documentation and Resources

### Internal Links
- Authentication setup guide: `/context/dashboard/02-logto-integration.md`
- API documentation: `/context/api/authentication.md`
- Testing procedures: `/auth-testing-guide.md`

### External Resources
- Logto Documentation: https://docs.logto.io/
- Next.js Auth Guide: https://nextjs.org/context/authentication
- JWT Best Practices: https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/

---

**Last Updated:** $(date)
**Version:** 1.0
**Owner:** Platform Engineering Team