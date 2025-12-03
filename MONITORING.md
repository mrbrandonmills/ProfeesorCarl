# Professor Carl - Monitoring & Observability Guide

## Overview

This guide covers monitoring, logging, analytics, and observability for the Professor Carl application deployed on Vercel.

---

## Vercel Analytics

### Real User Monitoring (RUM)

Vercel automatically tracks:
- **Page Load Times**: First contentful paint, time to interactive
- **Web Vitals**: LCP, FID, CLS, TTFB
- **Geographic Distribution**: Where users are located
- **Device Types**: Desktop, mobile, tablet breakdown

**Access Analytics:**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select **professor-carl** project
3. Click **Analytics** tab

### Web Vitals Monitoring

Vercel tracks Core Web Vitals:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP (Largest Contentful Paint) | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FID (First Input Delay) | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| TTFB (Time to First Byte) | ≤ 600ms | 600ms - 1500ms | > 1500ms |

**Goal**: All metrics in "Good" range

---

## Logging

### Deployment Logs

**View Build Logs:**
```bash
# Via CLI
vercel logs [deployment-url]

# View specific deployment
vercel logs https://professor-carl-xyz.vercel.app
```

**Via Dashboard:**
1. Go to **Deployments**
2. Click on specific deployment
3. View **Build Logs** tab

### Runtime Logs

**View Function Logs:**
```bash
# Tail runtime logs in real-time
vercel logs [deployment-url] --follow

# Filter by time
vercel logs [deployment-url] --since 1h
```

**Common Log Locations:**
- `/api/auth/*` - Authentication logs
- `/api/chat/*` - Chat interaction logs
- `/api/videos/*` - Video analysis logs
- `/api/memory/*` - Memory system logs

### Error Tracking

**Automatic Error Capture:**

Vercel automatically captures:
- Unhandled exceptions
- API route errors
- Build failures
- Runtime crashes

**View Errors:**
1. Dashboard → **Deployments**
2. Click deployment → **Functions** tab
3. View **Errors** section

**Error Details Include:**
- Stack trace
- Request headers
- Query parameters
- Timestamp
- User location

---

## Performance Monitoring

### Application Performance Monitoring (APM)

**Key Metrics to Monitor:**

1. **Response Time**
   - Target: < 200ms for API routes
   - Target: < 1s for page loads

2. **Error Rate**
   - Target: < 0.1% error rate
   - Alert threshold: > 1% error rate

3. **Throughput**
   - Requests per second
   - Peak traffic times
   - Bandwidth usage

4. **Function Duration**
   - Serverless function execution time
   - Cold start frequency
   - Memory usage

### View Performance Metrics

**Via Vercel Dashboard:**
```
Project → Analytics → Performance
```

**Metrics Available:**
- Average response time
- p50, p75, p95, p99 percentiles
- Error rate by route
- Traffic by geography
- Device breakdown

---

## Uptime Monitoring

### Vercel Edge Network

**Availability Target:** 99.99% uptime

**Status Page:**
- [vercel-status.com](https://vercel-status.com)
- Subscribe to status updates
- View incident history

### Health Checks

**Endpoint to Monitor:**
```
https://professor-carl.vercel.app/api/auth/session
```

**Expected Response:**
```json
{
  "authenticated": false
}
```

**HTTP Status:** 200 OK

### Third-Party Monitoring

Recommended services:
- **UptimeRobot**: Free tier, 50 monitors
- **Pingdom**: Professional monitoring
- **StatusCake**: Free tier available

**Setup Example (UptimeRobot):**
1. Add new monitor
2. Type: HTTP(s)
3. URL: `https://professor-carl.vercel.app/api/auth/session`
4. Interval: 5 minutes
5. Alert contacts: Email, Slack, etc.

---

## Custom Monitoring Setup

### Application Insights

**Add Custom Logging:**

```typescript
// lib/monitoring/logger.ts
export function logEvent(event: string, data: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event,
    data,
    environment: process.env.VERCEL_ENV
  }))
}
```

**Usage:**
```typescript
import { logEvent } from '@/lib/monitoring/logger'

logEvent('video_analyzed', {
  video_id: videoId,
  duration: processingTime,
  user_id: userId
})
```

### Performance Instrumentation

**Measure Function Performance:**

```typescript
export async function POST(req: Request) {
  const start = Date.now()

  try {
    // Your logic here
    const result = await processVideo()

    const duration = Date.now() - start
    console.log(`[PERF] video_analysis duration=${duration}ms`)

    return Response.json(result)
  } catch (error) {
    console.error('[ERROR] video_analysis', error)
    throw error
  }
}
```

---

## Alerts & Notifications

### Vercel Deployment Notifications

**Configure in Dashboard:**
1. Project Settings → **Notifications**
2. Add webhook URL or email
3. Select events:
   - Deployment failed
   - Deployment succeeded
   - Domain configuration changed

### Slack Integration

**Setup:**
1. Create Slack webhook: [api.slack.com/messaging/webhooks](https://api.slack.com/messaging/webhooks)
2. Add to Vercel:
   ```
   Project Settings → Integrations → Slack
   ```
3. Configure notifications:
   - Failed builds
   - Successful deployments
   - Error rate increases

### Email Alerts

**Built-in Vercel Alerts:**
- Deployment status
- Domain changes
- Billing updates
- Security notifications

**Custom Alerts via Webhook:**
```typescript
async function sendAlert(message: string) {
  await fetch(process.env.ALERT_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Professor Carl Alert: ${message}`,
      timestamp: new Date().toISOString()
    })
  })
}
```

---

## Database Monitoring

### Supabase Dashboard

**Monitor Database:**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select **professor-carl** project
3. View metrics:
   - Active connections
   - Query performance
   - Database size
   - API requests

### Key Database Metrics

**Watch For:**
- Connection pool exhaustion
- Slow queries (> 1s)
- Table sizes growing unexpectedly
- Failed API requests

**Supabase Logs:**
```
Database → Logs → Postgres Logs
```

### Query Performance

**Enable Query Insights:**
```
Database → Query Performance
```

**Optimize Slow Queries:**
1. Identify queries > 1s
2. Add indexes
3. Optimize JOINs
4. Use prepared statements

---

## API Monitoring

### Anthropic API

**Monitor:**
- Token usage
- Request latency
- Error rates
- Rate limit status

**View in Anthropic Console:**
[console.anthropic.com/settings/usage](https://console.anthropic.com/settings/usage)

### YouTube API

**Monitor Quota:**
- Daily quota: 10,000 units
- Alert at 80% usage
- Reset: Daily at midnight PT

**View in Google Cloud:**
```
APIs & Services → YouTube Data API v3 → Quotas
```

### Canvas LMS

**Monitor:**
- OAuth token expiration
- API rate limits
- Integration errors

**Logging:**
```typescript
// Log Canvas API calls
console.log('[CANVAS]', {
  action: 'fetch_courses',
  user_id: userId,
  status: 'success',
  latency: duration
})
```

---

## Security Monitoring

### Security Headers

**Verify Headers:**
```bash
curl -I https://professor-carl.vercel.app/api/auth/session
```

**Expected:**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
```

### Vulnerability Scanning

**Automated Scans:**
- Vercel scans dependencies automatically
- Security advisories in Dashboard
- Dependabot alerts (if using GitHub)

**Manual Audit:**
```bash
npm audit
```

### Access Logs

**Monitor Suspicious Activity:**
- Unusual request patterns
- Failed authentication attempts
- Rate limit violations
- Invalid API keys

**Log Analysis:**
```bash
vercel logs [deployment-url] | grep "401\|403\|429"
```

---

## Dashboards

### Vercel Built-in Dashboard

**Key Sections:**
1. **Overview**: Deployment status, traffic summary
2. **Analytics**: Performance metrics, Web Vitals
3. **Deployments**: Build history, logs
4. **Functions**: Serverless function metrics
5. **Domains**: SSL status, DNS configuration
6. **Settings**: Environment variables, integrations

### Custom Dashboard (Optional)

**Tools to Consider:**
- **Grafana**: Open-source dashboards
- **Datadog**: Full-stack monitoring
- **New Relic**: APM and infrastructure
- **Sentry**: Error tracking

### Example Grafana Dashboard

**Metrics to Display:**
```
- Request rate (requests/sec)
- Error rate (%)
- p95 response time (ms)
- Active users
- Database connections
- API quota usage
```

---

## Metrics to Track

### Application Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Homepage Load Time | < 1s | > 2s |
| API Response Time | < 200ms | > 500ms |
| Error Rate | < 0.1% | > 1% |
| Uptime | 99.9% | < 99.5% |
| Chat Response Time | < 2s | > 5s |
| Video Analysis Time | < 30s | > 60s |

### Infrastructure Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Function Cold Starts | < 10% | > 25% |
| Bandwidth Usage | < 80GB/mo | > 90GB/mo |
| Build Time | < 2min | > 5min |
| Database Connections | < 20 | > 50 |

### Business Metrics

| Metric | Description |
|--------|-------------|
| Daily Active Users | Users with ≥1 session |
| Videos Analyzed | Total video analysis requests |
| Chat Messages | Total chat interactions |
| Error Rate by Feature | Errors per feature area |
| User Retention | 7-day, 30-day retention |

---

## Incident Response

### Severity Levels

**P0 - Critical:**
- Site down
- Data loss
- Security breach

**Response:** Immediate (< 15 min)

**P1 - High:**
- Major feature broken
- High error rate
- Performance degradation

**Response:** < 1 hour

**P2 - Medium:**
- Minor feature issue
- Non-critical bug
- Cosmetic issue

**Response:** < 4 hours

**P3 - Low:**
- Enhancement request
- Documentation update
- Nice-to-have feature

**Response:** < 24 hours

### Incident Checklist

1. **Detect**
   - Alert received
   - User report
   - Monitoring dashboard

2. **Assess**
   - Determine severity
   - Identify impact
   - Check logs

3. **Respond**
   - Assign owner
   - Update status page
   - Communicate to users

4. **Resolve**
   - Fix issue
   - Deploy fix
   - Verify resolution

5. **Review**
   - Post-mortem
   - Document learnings
   - Update runbook

---

## Runbooks

### Common Issues

**1. Deployment Failed**

```bash
# Check build logs
vercel logs [deployment-url]

# Look for:
- Dependency installation errors
- TypeScript compilation errors
- Environment variable issues

# Fix:
- Update dependencies
- Fix TypeScript errors
- Add missing env vars
```

**2. High Error Rate**

```bash
# View error logs
vercel logs [deployment-url] --follow | grep ERROR

# Check:
- API endpoint errors
- Database connection issues
- Third-party API failures

# Fix:
- Review error messages
- Check service status pages
- Verify API keys/credentials
```

**3. Slow Performance**

```bash
# Analyze function duration
vercel logs [deployment-url] | grep duration

# Check:
- Database query performance
- API call latency
- Large response payloads

# Fix:
- Add database indexes
- Implement caching
- Optimize queries
```

---

## Logging Best Practices

### Structured Logging

**Use JSON Format:**
```typescript
console.log(JSON.stringify({
  level: 'info',
  message: 'Video analyzed successfully',
  video_id: videoId,
  duration: processingTime,
  timestamp: new Date().toISOString()
}))
```

### Log Levels

**Standard Levels:**
- `ERROR`: Something failed
- `WARN`: Something unexpected
- `INFO`: Normal operations
- `DEBUG`: Detailed diagnostic info

**Example:**
```typescript
if (error) {
  console.error({ level: 'ERROR', message: 'API call failed', error })
} else {
  console.log({ level: 'INFO', message: 'API call succeeded' })
}
```

### Sensitive Data

**Never Log:**
- API keys
- User passwords
- Session tokens
- Personal information

**Redact Sensitive Fields:**
```typescript
const safeLog = {
  ...data,
  api_key: '[REDACTED]',
  password: '[REDACTED]'
}
console.log(safeLog)
```

---

## Continuous Monitoring

### Daily Checks

- [ ] Review error logs
- [ ] Check uptime status
- [ ] Monitor API quota usage
- [ ] Verify latest deployment succeeded

### Weekly Reviews

- [ ] Analyze performance trends
- [ ] Review user analytics
- [ ] Check security advisories
- [ ] Update dependencies

### Monthly Reports

- [ ] Performance summary
- [ ] Uptime report
- [ ] Cost analysis
- [ ] User growth metrics
- [ ] Error rate trends

---

## Tools & Resources

### Monitoring Tools

**Free Tier:**
- UptimeRobot (uptime monitoring)
- Google Analytics (user analytics)
- Vercel Analytics (web vitals)
- LogRocket (session replay - free tier)

**Paid Options:**
- Datadog ($15/host/month)
- New Relic ($99/month)
- Sentry ($26/month)
- Grafana Cloud (from $49/month)

### Documentation

- **Vercel Observability**: [vercel.com/docs/observability](https://vercel.com/docs/observability)
- **Next.js Analytics**: [nextjs.org/analytics](https://nextjs.org/analytics)
- **Web Vitals**: [web.dev/vitals](https://web.dev/vitals)

---

**Last Updated**: December 2, 2025
**Version**: 1.0
