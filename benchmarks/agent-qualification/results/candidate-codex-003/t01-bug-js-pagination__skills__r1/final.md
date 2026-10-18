Fixed `totalPages` to use `Math.ceil`, making the final partial page accessible.

Added regression coverage for partial pages, small result sets, empty results, and out-of-range pages. All 6 tests pass after the fix; SotuRail contract verification reports ready.

STATUS: READY
VERIFIED: yes