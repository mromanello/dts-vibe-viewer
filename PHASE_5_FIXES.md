# Phase 5 Bug Fixes - DraCor Compatibility

**Date:** 2026-01-30
**Status:** ✅ COMPLETE

## Overview

After initial Phase 5 implementation, critical bugs were discovered when testing with DraCor DTS endpoint. This document summarizes the issues found and fixes applied.

---

## Issues Discovered

### Issue 1: Collections Not Expanding
**Symptom:** Collections showed expand arrows but nothing happened when clicked.

**Root Cause:** Multiple issues:
1. Pre-populating children from `item.member` which could be empty arrays
2. "Already loaded" check failed for empty arrays (`[] !== null` is `true`)
3. Children never fetched because empty array was considered "loaded"

**Files Affected:**
- `src/components/collections/CollectionTree.tsx`

---

### Issue 2: Incorrect ID Parameter Format
**Symptom:** 400 Bad Request errors when fetching collection children.

**Root Cause:** Using extracted short IDs (e.g., "am") instead of full @id URLs (e.g., "https://dracor.org/id/am").

**Fix:** Use full `item['@id']` for all API calls, not `extractIdFromUrl(item['@id'])`.

**Files Affected:**
- `src/components/collections/CollectionTree.tsx:106`
- `src/components/navigation/NavigationBrowser.tsx:49`
- `src/pages/DocumentPage.tsx:49, 60`

---

### Issue 3: URL Encoding of @id Parameters
**Symptom:** 400 Bad Request, followed by CORS errors.

**Root Cause:** `URLSearchParams` automatically URL-encodes parameters, turning `https://dracor.org/id/am` into `https%3A%2F%2Fdracor.org%2Fid%2Fam`. DraCor rejects URL-encoded @id values.

**Fix:** Modified `expandURITemplate()` to skip encoding for `id` parameters that are URLs.

```typescript
// src/services/utils/http.ts
if (name === 'id' && (stringValue.startsWith('http://') || stringValue.startsWith('https://'))) {
  queryParts.push(`${name}=${stringValue}`); // No encoding
} else {
  queryParts.push(`${name}=${encodeURIComponent(stringValue)}`);
}
```

**Files Affected:**
- `src/services/utils/http.ts:160-189`

---

### Issue 4: nav=children Parameter Not Supported
**Symptom:** 400 Bad Request with error message about `nav=children` not being allowed.

**Root Cause:** DraCor only supports `nav=parents`, not `nav=children`. To get children, fetch collection by ID without nav parameter.

**Fix:** Removed `nav: 'children'` from `fetchChildren()` function.

```typescript
// Before
const result = await fetchCollection(collectionTemplate, { id, page, nav: 'children' });

// After
const result = await fetchCollection(collectionTemplate, { id, page });
```

**Files Affected:**
- `src/services/dts/collections.ts:74-89`

---

### Issue 5: CORS Errors (Side-Effect)
**Symptom:** CORS policy errors blocking requests.

**Root Cause:** Not actually CORS configuration issues - server returned 400 Bad Request before adding CORS headers, browser then reported it as CORS error.

**Fix:** Fixed underlying 400 errors (Issues 2, 3, 4), which resolved the CORS errors.

---

## Files Modified

### 1. src/services/utils/http.ts
**Change:** Modified `expandURITemplate()` to skip URL encoding for @id URLs

**Lines:** 160-189

**Reason:** DraCor rejects URL-encoded @id parameters

---

### 2. src/services/dts/collections.ts
**Change:** Removed `nav: 'children'` parameter from `fetchChildren()`

**Lines:** 74-89

**Reason:** DraCor doesn't support nav=children

**Added:** Console logging for debugging

---

### 3. src/components/collections/CollectionTree.tsx
**Changes:**
1. Root collection initialization: Don't pre-populate children (line 57)
2. `loadChildren()`: Changed "already loaded" check to verify non-empty array (line 83)
3. `handleToggle()`: Always fetch children on expand, never pre-populate (line 137-140)
4. Fixed expansion logic to check for empty arrays (line 157)

**Added:** Extensive console logging for debugging

**Reason:** Fix lazy loading and prevent empty array issues

---

### 4. src/components/navigation/NavigationBrowser.tsx
**Change:** Use full `resource['@id']` for API calls and URL encoding for route params

**Lines:** 49, 79

**Reason:** DraCor requires full @id URLs

---

### 5. src/pages/DocumentPage.tsx
**Change:** Decode resourceId and use full @id for API calls

**Lines:** 45, 49

**Reason:** Support URL-encoded route params while using full @id for API

---

## Testing Results

### Before Fixes
```
✗ Click expand arrow → nothing happens
✗ Console shows "Children already loaded, skipping"
✗ API calls fail with 400 Bad Request
✗ CORS errors in console
```

### After Fixes
```
✅ Click expand arrow → loading spinner appears
✅ API call succeeds: GET https://dracor.org/api/v1/dts/collection?id=https://dracor.org/id/pol
✅ Children load and display correctly
✅ No CORS errors
✅ Expand/collapse works smoothly
```

---

## Performance Impact

**Before:** No API calls made (stuck on empty arrays)

**After:**
- Initial load: 1 API call for root collection
- Per expand: 1 API call for children
- Proper caching: No repeated calls for same collection

**Bundle Size:** No change (logic fixes only)

---

## Lessons Learned

1. **Always check for empty arrays**, not just null/undefined
2. **Use full @id URLs** from DTS responses, don't extract IDs
3. **Don't assume URL encoding is safe** for all parameters
4. **Read API error messages carefully** - they often reveal the real issue
5. **CORS errors can be misleading** - check for 4xx/5xx errors first
6. **Test with real servers early** - each DTS implementation has quirks
7. **Console logging is invaluable** for debugging API issues

---

## Documentation Created

1. `DRACOR_DTS_QUIRKS.md` - Detailed documentation of DraCor-specific behaviors
2. `PHASE_5_FIXES.md` - This document

---

## Related Files

- Phase 5 Implementation: `PHASE_5_SUMMARY.md`
- DraCor Quirks: `DRACOR_DTS_QUIRKS.md`
- Implementation Progress: `IMPLEMENTATION_PROGRESS.md`

---

## Next Steps

Phase 5 is now **fully functional** with DraCor and ready for Phase 6 (Document Endpoint).

**Verified Working:**
- ✅ Browse collections hierarchy
- ✅ Expand collections to see resources
- ✅ Navigate citation trees
- ✅ View resource metadata
- ✅ Navigate to DocumentPage

**Not Yet Implemented:**
- 📄 Document content fetching (Phase 6)
- 📖 Text rendering (Phase 6)
- 🔍 Citation highlighting (Phase 6)
