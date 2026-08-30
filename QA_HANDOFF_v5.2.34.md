# Driver Pay App v5.2.34 — Start placeholder fit visual patch

## Scope

Single presentation-only runtime change in `TimeRow`:

- Long contextual placeholders in the Start field use a smaller display font while the field is empty.
- Short Start/Finish placeholders remain at the existing 24px size.
- As soon as a factual/user-entered value exists, the time value remains at the existing 24px size.
- No Weekly Rest, Rest Engine, compensation, Split Rest, KM, Pay, archive, navigation, colour-state, or storage logic is changed.

## Phone check

Verify on the same narrow phone layout that previously squeezed/clipped long Start context:

1. Empty Start with long weekly-rest contextual placeholder fits inside the Start half-width field.
2. The helper below the Start value remains readable and unchanged.
3. Enter a factual Start and confirm the entered time is still rendered at the normal large size.
4. Finish field remains visually unchanged.

## Regression note

Split Rest / Start-KM provenance and Weekly Rest helper ownership remain intentionally untouched and open for later product review.
