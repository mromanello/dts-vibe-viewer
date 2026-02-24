# DraCor DTS Implementation - Special Behaviors & Debugging Notes

**Date:** 2026-01-30
**DTS Server:** https://dracor.org/api/v1/dts
**Issue:** Collections not loading children when expanded

---

## Summary of Issues Discovered

DraCor's DTS implementation has several non-standard behaviors that required specific handling in the client implementation. This document records these quirks for future reference.

---

## 1. Full @id URLs Required (Not Extracted IDs)

### Expected Behavior (Standard DTS)
Some DTS servers accept short IDs extracted from the @id URL:
```
@id: "https://dracor.org/id/am"
API call: ?id=am
```

### DraCor's Behavior
DraCor requires the **complete @id URL** as the `id` parameter:
```
@id: "https://dracor.org/id/am"
API call: ?id=https://dracor.org/id/am
```

### Solution
- Always use the full `@id` value from response objects
- Never extract just the last path segment for API calls
- Only use `extractIdFromUrl()` for React state keys, not API parameters

### Code Location
- `src/services/dts/collections.ts` - All fetch functions use full @id
- `src/components/collections/CollectionTree.tsx:106` - `fetchChildren(endpoints.collection, item['@id'])`

---

## 2. No URL Encoding for @id Parameters

### Expected Behavior (Standard HTTP)
URL parameters should be URL-encoded:
```
?id=https%3A%2F%2Fdracor.org%2Fid%2Fam
?resource=https%3A%2F%2Fdracor.org%2Fid%2Ftat000001
```

### DraCor's Behavior
DraCor **rejects URL-encoded @id and resource values** with HTTP 400 Bad Request:
```
✗ ?id=https%3A%2F%2Fdracor.org%2Fid%2Fam  (400 error)
✓ ?id=https://dracor.org/id/am             (works)

✗ ?resource=https%3A%2F%2Fdracor.org%2Fid%2Ftat000001  (400 error)
✓ ?resource=https://dracor.org/id/tat000001            (works)
```

### Error Message
```
400 Bad Request
CORS error (side-effect of 400 before CORS headers sent)
```

### Solution
Modified `expandURITemplate()` to detect when `id` or `resource` parameters are URLs and skip encoding:

```typescript
// src/services/utils/http.ts
if ((name === 'id' || name === 'resource') && (stringValue.startsWith('http://') || stringValue.startsWith('https://'))) {
  queryParts.push(`${name}=${stringValue}`); // No encoding
} else {
  queryParts.push(`${name}=${encodeURIComponent(stringValue)}`);
}
```

### Affected Endpoints
- **Collection Endpoint**: Uses `id` parameter for fetching collections
- **Navigation Endpoint**: Uses `resource` parameter for navigation trees
- **Document Endpoint**: Uses `resource` parameter for document content

### Code Location
- `src/services/utils/http.ts:171-186` - Modified URI template expansion

---

## 3. nav=children Parameter Not Supported

### Expected Behavior (DTS Spec)
The DTS spec defines `nav` parameter with values:
- `nav=children` - Get child collections/resources
- `nav=parents` - Get parent collections

### DraCor's Behavior
DraCor **only supports `nav=parents`**. Using `nav=children` results in:

```
Error: "The value 'children' of the parameter 'nav' is not allowed.
Use the single allowed value 'parents' if you want to request the parent collection."
```

### How to Get Children
Don't use `nav` parameter at all - just fetch by ID:
```
✗ ?id=https://dracor.org/id/am&nav=children  (400 error)
✓ ?id=https://dracor.org/id/am                (returns collection with member array)
```

The `member` array in the response contains the children.

### Solution
```typescript
// src/services/dts/collections.ts:74-89
export async function fetchChildren(
  collectionTemplate: string,
  id: string,
  page?: number
): Promise<Collection | Resource> {
  // Don't use nav=children - just fetch by ID
  const result = await fetchCollection(collectionTemplate, { id, page });
  return result;
}
```

### Code Location
- `src/services/dts/collections.ts:74-89` - fetchChildren without nav parameter

---

## 4. Empty member Arrays Cause Loading Issues

### Problem
DraCor returns `member: []` (empty array) instead of omitting the field or using `null`:

```json
{
  "@id": "https://dracor.org/id/am",
  "@type": "Collection",
  "member": [],
  "totalChildren": 40
}
```

### Impact
Our initial check used `!item.member`, which is `false` for empty arrays:
```typescript
if (!item.member && item.totalChildren > 0) {
  loadChildren(); // Never called because [] is truthy!
}
```

### Solution
Changed to explicitly check for empty arrays:
```typescript
if ((!item.member || item.member.length === 0) && item.totalChildren > 0) {
  loadChildren(); // Now called correctly
}
```

Also modified the "already loaded" check:
```typescript
// Before
if (nodeState?.children !== null) return;

// After
if (nodeState?.children && nodeState.children.length > 0) return;
```

### Code Location
- `src/components/collections/CollectionTree.tsx:83` - Already loaded check
- `src/components/collections/CollectionTree.tsx:157` - Expansion check

---

## 5. CORS Errors Were Side-Effect, Not Root Cause

### What We Saw
```
Access to fetch at '...' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present
```

### What Was Actually Happening
The server returned **400 Bad Request** BEFORE adding CORS headers. The browser then reported this as a CORS error because:
1. Request failed with 400
2. No CORS headers in error response
3. Browser blocks the response and reports CORS issue

### Root Causes
The 400 errors were caused by:
1. URL-encoded @id parameter (Issue #2)
2. Using `nav=children` parameter (Issue #3)

Once these were fixed, the "CORS errors" disappeared because the server now returns 200 OK with proper CORS headers.

---

## 6. Don't Pre-populate Children from item.member

### Problem
Initially, we pre-populated children from `item.member` when available:
```typescript
children: item.member || null
```

This caused issues when:
- `member: []` was present but empty
- Children needed to be lazy-loaded

### Solution
Always fetch children on expand, never pre-populate:
```typescript
// Root collection initialization
children: null  // Don't use root.member

// On expand
if (item.totalChildren > 0) {
  await loadChildren(item);  // Always fetch
}
```

### Code Location
- `src/components/collections/CollectionTree.tsx:57` - Root initialization
- `src/components/collections/CollectionTree.tsx:137-140` - Always fetch on expand

---

## 7. mediaTypes and download Can Be String or Array

### Problem
The DTS spec allows `mediaTypes` and `download` fields to be either a single string or an array of strings. DraCor sometimes returns single strings instead of arrays.

### Example Response
```json
{
  "@id": "https://dracor.org/id/tat000001",
  "@type": "Resource",
  "mediaTypes": "application/tei+xml",  // String, not array
  "download": "https://dracor.org/api/v1/corpora/tat/play/..." // String, not array
}
```

### Impact
Calling `.map()` on these fields causes runtime errors:
```
TypeError: item.download.map is not a function
TypeError: item.mediaTypes.map is not a function
```

### Solution
Always normalize to arrays before mapping:
```typescript
const downloads = Array.isArray(resource.download)
  ? resource.download
  : [resource.download];

const mediaTypes = Array.isArray(resource.mediaTypes)
  ? resource.mediaTypes
  : [resource.mediaTypes];
```

### Code Location
- `src/components/collections/CollectionMetadata.tsx:193-228` - Fixed mediaTypes and download rendering

---

## 8. Navigation member Can Be null Instead of Empty Array

### Problem
The DTS spec indicates that `member` should be an array in Navigation responses. However, DraCor returns `member: null` instead of `member: []` for citations that have no children.

### Example Response
When fetching a specific citation with `ref` parameter:
```json
{
  "@type": "Navigation",
  "@id": "https://dracor.org/api/v1/dts/navigation?resource=https://dracor.org/id/am000860&ref=front/div[2]&down=1",
  "ref": {
    "identifier": "front/div[2]",
    "@type": "CitableUnit",
    "level": 2
  },
  "resource": { ... },
  "member": null  // Should be [] according to spec
}
```

### Impact
Validation that checks `if (!data.member)` fails because `null` is falsy, causing errors like:
```
Invalid Navigation response: missing required fields: member
```

### Solution
Normalize `null` to empty array during validation:
```typescript
// src/services/dts/navigation.ts
// Allow member to be null (check for undefined instead)
if (data.member === undefined) missingFields.push('member');

// Normalize null to empty array
if (data.member === null) {
  data.member = [];
}
```

### Code Location
- `src/services/dts/navigation.ts:37-68` - Modified validation and normalization

---

## Testing URLs

### Working Examples
```
Root collection:
https://dracor.org/api/v1/dts/collection

Specific collection (unencoded @id):
https://dracor.org/api/v1/dts/collection?id=https://dracor.org/id/am

Polish Drama Corpus:
https://dracor.org/api/v1/dts/collection?id=https://dracor.org/id/pol

Bashkir Drama Corpus:
https://dracor.org/api/v1/dts/collection?id=https://dracor.org/id/bash

Tatar Drama Corpus:
https://dracor.org/api/v1/dts/collection?id=https://dracor.org/id/tat
```

### Failing Examples
```
❌ URL-encoded @id:
https://dracor.org/api/v1/dts/collection?id=https%3A%2F%2Fdracor.org%2Fid%2Fam

❌ Using nav=children:
https://dracor.org/api/v1/dts/collection?id=https://dracor.org/id/am&nav=children

❌ Using short ID:
https://dracor.org/api/v1/dts/collection?id=am
```

---

## Debugging Process

1. **Initial symptom**: Collections showed expand arrow but nothing happened on click
2. **Added logging**: Discovered children were "already loaded" despite being empty
3. **Identified empty array issue**: Fixed pre-population and "already loaded" logic
4. **Got CORS errors**: Initially thought it was server configuration
5. **Checked actual request**: Saw URL-encoded @id parameter
6. **Fixed encoding**: Still got 400 error
7. **Checked with user**: Learned DraCor expects unencoded URLs
8. **Fixed that**: Still got 400 error with nav=children
9. **User checked DraCor docs**: Found nav=children not supported
10. **Final fix**: Remove nav parameter entirely

---

## Recommendations for DTS Client Implementation

1. **Always use full @id URLs** - Don't assume servers accept short IDs
2. **Be flexible with URL encoding** - Some servers (like DraCor) don't want @id URLs encoded
3. **Don't assume nav=children is supported** - Fetching by ID alone should return children in member array
4. **Check for empty arrays** - Use `array.length > 0` not just `!!array`
5. **Don't pre-populate from embedded data** - Always fetch to ensure consistency
6. **CORS errors can be misleading** - Check for 400/500 errors first
7. **Add detailed console logging** - Critical for debugging API quirks
8. **Test with real servers** - Each DTS implementation may have quirks

---

## 9. Tab State Preservation Pattern

### Problem
When switching between Collections and Navigation tabs in the sidebar, component state (tree expansion, scroll position, selected items) was being lost. This happened because the tabs used conditional rendering which unmounted components when switching away.

### Original Implementation (Problematic)
```typescript
// src/components/layout/Sidebar.tsx
<div className="flex-1 overflow-hidden">
  {activeTab === 'collections' && <CollectionBrowser />}
  {activeTab === 'navigation' && currentResource && (
    <NavigationBrowser resource={currentResource} />
  )}
</div>
```

**Issue:** Components completely unmount when tab is inactive, causing:
- Loss of tree expansion state
- Loss of scroll position
- Loss of any internal component state
- Need to refetch data or rebuild state when returning to the tab

### Solution: CSS-Based Visibility
Keep both components mounted but hide them with CSS:

```typescript
// src/components/layout/Sidebar.tsx - Fixed version
<div className="flex-1 overflow-hidden">
  <div className={activeTab === 'collections' ? 'h-full' : 'hidden'}>
    <CollectionBrowser />
  </div>
  {currentResource && (
    <div className={activeTab === 'navigation' ? 'h-full' : 'hidden'}>
      <NavigationBrowser resource={currentResource} />
    </div>
  )}
</div>
```

### Benefits
1. **State Preservation**: Tree expansion state persists when switching tabs
2. **Scroll Position**: Users return to the same scroll position
3. **Selection Highlight**: Selected items remain highlighted
4. **No Refetching**: Data doesn't need to be fetched again
5. **Better UX**: Seamless tab switching without losing context

### Additional Context Synchronization
To ensure selection highlighting works across tabs, added context-based selection sync:

```typescript
// src/components/collections/CollectionTree.tsx
useEffect(() => {
  if (currentResource) {
    const resourceId = extractIdFromUrl(currentResource['@id']);
    setSelectedId(resourceId);
  } else if (currentCollection) {
    const collectionId = extractIdFromUrl(currentCollection['@id']);
    setSelectedId(collectionId);
  }
}, [currentResource, currentCollection]);
```

This syncs the tree highlight with global context when switching from Navigation tab back to Collections tab.

### Code Location
- `src/components/layout/Sidebar.tsx:55-64` - CSS-based tab visibility
- `src/components/collections/CollectionTree.tsx:37-46` - Selection sync from context

### Pattern Applicability
This pattern is useful for:
- Tab interfaces where state preservation matters
- Any UI where components should persist but be hidden temporarily
- Scenarios where remounting is expensive (large trees, complex state)

**When NOT to use:**
- Simple tabs where state doesn't matter
- Memory-constrained scenarios with many hidden components
- When you explicitly want a "fresh start" when returning to a tab

---

## Files Modified

1. `src/services/utils/http.ts` - Skip encoding for @id and resource URLs
2. `src/services/dts/collections.ts` - Remove nav=children, use full @id
3. `src/services/dts/document.ts` - Use full @id for resource parameter
4. `src/services/dts/navigation.ts` - Validate member !== undefined, normalize null to [], remove sorting
5. `src/components/collections/CollectionTree.tsx` - Fix loading logic, always fetch, add selection sync
6. `src/components/collections/CollectionMetadata.tsx` - Handle string/array for mediaTypes and download
7. `src/components/navigation/NavigationBrowser.tsx` - Use full @id, implement incremental loading with down=1
8. `src/components/navigation/NavigationTree.tsx` - Lazy load children with ref parameter, smart hasChildren detection
9. `src/components/layout/Sidebar.tsx` - CSS-based tab visibility for state preservation
10. `src/types/dts.ts` - Add maxCiteDepth to CitationTree interface

---

## Related Documentation

- DTS Specification: https://distributed-text-services.github.io/specifications/
- DraCor API: https://dracor.org/doc/api
- Phase 4 Summary: `PHASE_4_SUMMARY.md`
- Phase 5 Summary: `PHASE_5_SUMMARY.md`
