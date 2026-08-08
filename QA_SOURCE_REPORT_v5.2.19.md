# QA Source Report — v5.2.19

Version purpose: compensation repayment chronology guard.

Source change: a repayment rest is eligible only if its calculated start boundary is at or after the compensation obligation source boundary. This prevents rest time that occurred before the debt existed from being used as compensation.

Automated regression coverage includes the previously missed spanning-rest case (`restStartAbs < sourceStartAbs < enteredStartAbs`) and a valid control case where the rest starts after the debt arose.

Monday Start proposal after End Week remains an open item and is intentionally unchanged.

Production `dist` remains excluded from source QA checkpoints until a fresh build can be produced from approved source.
