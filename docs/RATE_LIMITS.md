# Rate Limiting - Professor Carl

## Overview

Professor Carl has rate limiting enabled to protect against spam, abuse, and unexpected API costs during testing.

## Current Limits (Testing Phase)

### Per Student/Device:
- **20 messages per 15 minutes**
- After 20 messages, you'll need to wait 15 minutes before sending more

### Global (All Users):
- **200 total messages per hour**
- This protects API costs while the real Professor Carl reviews the system

## What Happens When You Hit the Limit?

You'll see a friendly message from Carl like:

> Hey there! I need to slow down for a moment. Too many requests.
>
> Please wait about 15 minutes before sending more messages. This helps keep the service running smoothly for everyone during testing.
>
> In the meantime, try reviewing your notes or thinking through your question!

## Why Rate Limiting?

1. **Cost Protection**: Each message costs money via the Anthropic API. Rate limiting prevents unexpected bills during testing.

2. **Spam Prevention**: Prevents accidental or malicious spam that could drain the API budget.

3. **Fair Access**: Ensures all students get equal access during testing.

4. **Quality Over Quantity**: Encourages thoughtful questions rather than rapid-fire messaging.

## What Counts as a "Message"?

- Every time you send a message to Carl = 1 request
- Reading previous messages = no cost
- Opening the app = no cost
- Only sending new messages counts

## Tips to Avoid Hitting Limits

1. **Think Before Typing**: Craft thoughtful questions rather than many small ones
2. **Use the Hint Stepper**: Reveal hints progressively instead of asking repeatedly
3. **Review Previous Messages**: Carl's earlier guidance often contains what you need
4. **Take Breaks**: Use Carl's advice to work independently, then come back with specific questions

## Future Plans

Once Professor Carl approves and budgets for the system, these limits will likely increase to:

- **50-100 messages per 15 minutes** (per student)
- **No global limit** (or much higher)
- Possibly different limits for different times (e.g., higher during office hours)

## Technical Details

Rate limiting is based on your IP address. If you're on a shared network (like school WiFi), you share the limit with others on that network.

### For Administrators

Limits can be adjusted in `/server/rate-limiter.ts`:

```typescript
private readonly PER_IP_LIMIT = 20;        // requests per window
private readonly PER_IP_WINDOW = 15 * 60 * 1000;  // 15 minutes
private readonly GLOBAL_LIMIT = 200;       // total requests per hour
```

## Monitoring

Administrators can check rate limit stats via the console logs:
- IP addresses hitting limits are logged
- Global usage is tracked
- Cleanup happens automatically every 5 minutes

## Questions?

If you're hitting rate limits during normal use:
- Contact your instructor
- They may need to adjust limits for your class size
- Or request budget approval from the real Professor Carl

---

**Remember**: These limits are temporary during testing. They're designed to protect the system while we ensure everything works properly for classroom deployment!
