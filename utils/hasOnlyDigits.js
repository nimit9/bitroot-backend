export const hasOnlyDigits = (string) =>
    [...string].every((c) => "0123456789".includes(c));
