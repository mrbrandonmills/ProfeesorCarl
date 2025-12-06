# Visual Spacing Reference - Before & After

**Quick reference for homepage spacing improvements**

---

## Hero Section Spacing

### CTA Button Group
```diff
- gap-4          (16px between buttons)
+ gap-6          (24px between buttons)

- mb-12          (48px below subheadline)
+ mb-16          (64px below subheadline)
```

### Button Sizing
```diff
Primary Button (Browse Courses):
- px-8 py-6      (32px horizontal, 24px vertical)
+ px-10 py-7     (40px horizontal, 28px vertical)

Sign In Button (NEW):
+ px-10 py-7     (40px horizontal, 28px vertical)
+ min-w-[220px]  (consistent minimum width)

Upload Button:
+ px-8 py-6      (slightly smaller, less emphasis)
```

### Feature Pills
```diff
- gap-6          (fixed 24px gap)
+ gap-4 sm:gap-6 (16px mobile, 24px desktop)

- mt-16          (64px from buttons)
+ mt-20          (80px from buttons)
```

---

## Feature Showcase Section

### Section Container
```diff
- py-32          (128px vertical padding)
+ py-24          (96px on mobile)
+ sm:py-32       (128px on tablet)
+ lg:py-40       (160px on desktop)
```

### Section Header
```diff
- mb-24          (96px below header)
+ mb-20          (80px mobile)
+ sm:mb-24       (96px tablet)
+ lg:mb-28       (112px desktop)
```

### Feature Grid
```diff
- gap-8 lg:gap-10         (32px/40px gaps)
+ gap-6 sm:gap-8 lg:gap-12 (24px/32px/48px gaps)
```

### Feature Cards
```diff
Internal Padding:
- p-10                  (40px all sides)
+ p-8 sm:p-10 lg:p-12  (32px/40px/48px)

Title Spacing:
- mb-4                  (16px below title)
+ mb-5                  (20px below title)
```

### Supporting Pills
```diff
- gap-4 mt-20    (16px gap, 80px top margin)
+ gap-4 sm:gap-5 (16px mobile, 20px desktop)
+ mt-16 sm:mt-20 lg:mt-24 (64px/80px/96px)
```

---

## Final CTA Section

### Section Container
```diff
- py-32          (128px vertical padding)
+ py-24          (96px mobile)
+ sm:py-32       (128px tablet)
+ lg:py-40       (160px desktop)
```

### CTA Panel
```diff
Internal Padding:
- p-12 md:p-16          (48px/64px)
+ p-10 sm:p-12          (40px/48px)
+ md:p-16 lg:p-20       (64px/80px)
```

### Typography
```diff
Headline:
- mb-6          (24px below headline)
+ mb-8          (32px below headline)

Subheadline:
- mb-10         (40px below subheadline)
+ mb-12         (48px below subheadline)
```

### Social Proof
```diff
- gap-6 mt-12 pt-8       (24px gap, 48px margin, 32px padding)
+ gap-8 sm:gap-12        (32px/48px gap)
+ mt-14 pt-10            (56px margin, 40px padding)
```

---

## Typography Line Heights

```diff
Headlines:
+ leading-[1.1]  (tight, elegant)

Body Text:
+ leading-[1.65] (comfortable reading)

Subheadlines:
+ leading-[1.7]  (generous, luxury)
```

---

## Responsive Breakpoint Strategy

**Mobile-First Approach:**
- Start with comfortable mobile spacing (smaller values)
- Scale up progressively for larger screens
- Maintain visual hierarchy at all sizes

**Scaling Pattern:**
```
Mobile    Tablet    Desktop
py-24  →  py-32  →  py-40
gap-6  →  gap-8  →  gap-12
p-8    →  p-10   →  p-12
```

---

## Visual Breathing Room Metrics

**Before:** Standard web spacing (tight, cramped)
**After:** Luxury brand spacing (generous, museum-quality)

**Improvement Ratio:**
- Vertical sections: +25-30% more padding
- Component gaps: +50% wider on desktop
- Internal card padding: +20% more breathing room
- Typography margins: +33% more line spacing

**Result:** Matches Louis Vuitton/Hermès visual standards

---

## Quick Reference: Tailwind Classes Used

**Spacing Scale:**
```
gap-4  = 16px
gap-6  = 24px
gap-8  = 32px
gap-12 = 48px

mt-16  = 64px
mt-20  = 80px
mt-24  = 96px

py-24  = 96px
py-32  = 128px
py-40  = 160px

p-8    = 32px
p-10   = 40px
p-12   = 48px
p-16   = 64px
p-20   = 80px

mb-5   = 20px
mb-8   = 32px
mb-12  = 48px
mb-16  = 64px
```

**Responsive Prefixes:**
```
sm:  = 640px+
md:  = 768px+
lg:  = 1024px+
xl:  = 1280px+
2xl: = 1536px+
```

---

**Use this reference when designing new components to maintain consistency.**
